# This file is part of plot-navigator.
#
# Developed for the LSST Data Management System.
# This product includes software developed by the LSST Project
# (https://www.lsst.org).
# See the COPYRIGHT file at the top-level directory of this distribution
# for details of code ownership.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

from __future__ import annotations

import gzip
import json
import logging
import urllib.parse
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import TYPE_CHECKING
from uuid import uuid4

import lsst.daf.butler as dafButler
from botocore.exceptions import ClientError
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from lsst.daf.butler import MissingCollectionError  # pyright: ignore[reportPrivateImportUsage]
from pydantic import BaseModel

from .config import Settings, get_settings
from .data_model import CollectionSummaryFileV2, PlotCollection, PlotItem

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

router = APIRouter(tags=["cache"])

logger = logging.getLogger("api.cache")

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class CacheRequest(BaseModel):
    repo: str
    collection: str
    filter_collections: bool = False


class CacheResponse(BaseModel):
    jobId: str


class JobStatusResponse(BaseModel):
    status: str
    message: str

@dataclass
class CollectionSummaryResponse:
    base_summary_file: CollectionSummaryFileV2
    indirect_files: dict[str, CollectionSummaryFileV2]
    """Mapping of plot type to a CollectionSummaryFile for plots that get their own file."""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.put("", response_model=CacheResponse)
async def enqueue_cache(body: CacheRequest,
                        background_tasks: BackgroundTasks,
                        request: Request,
                        settings: Settings = Depends(get_settings)) -> CacheResponse:
    """
    Enqueue a cache_plots background job for the given repo and collection.
    Returns the arq job ID which can be polled via GET /cache/job/<job_id>.
    """

    if body.repo not in settings.butler_repo_names:
        raise HTTPException(status_code=400, detail=f"Repo '{body.repo}' is unknown")

    job_id = str(uuid4())
    request.app.state.redis.set(job_id, json.dumps({"status": "pending", "message": "Pending"}), ex=60*60*24)

    cache_task = cache_plots_v2 if settings.use_v2_summaries else cache_plots_v1
    background_tasks.add_task(cache_task, job_id, body.repo, body.collection,
                              request.app.state.s3_client,
                              filter_collections=body.filter_collections,
                              redis=request.app.state.redis)
    return CacheResponse(jobId=job_id)


@router.get("/job/{job_id}")
async def get_job_status(job_id: str, request: Request) -> JobStatusResponse:
    """
    Poll the status and result of a cache job by its arq job ID.
    """
    raw_status = request.app.state.redis.get(job_id)

    if not raw_status:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        status = json.loads(raw_status)
    except json.JSONDecodeError:
        logger.error(f"JSON decode failure on input: {raw_status}")
        raise HTTPException(status_code=500, detail="Job status invalid")

    if 'status' not in status:
        logger.error(f"Received invalid job status: {raw_status}")
        raise HTTPException(status_code=500, detail="Job status invalid")

    return JobStatusResponse(
        status=status['status'],
        message=status.get("message", "")
    )


# ---------------------------------------------------------------------------
# background worker
# ---------------------------------------------------------------------------

def cache_plots_v1(job_id: str,
                repo: str,
                collection: str,
                s3_client: S3Client,
                *,
                filter_collections: bool = False,
                redis = None) -> str:
    """
    Generate the plot cache file and write it to S3.

    Parameters
    ----------
    repo : str
        Butler repository.
    collection : str
        Butler collection to search for plots.
    filter_collections : bool, optional
        Only include plots in run collections named with the same prefix as
        ``collection``.

    Returns
    -------
    str
        Success or error message.
    """
    if redis:
        redis.set(job_id, json.dumps({"status": "running", "message": "Running"}))
    butler = dafButler.Butler.from_config(repo)

    try:
        summary = summarize_collection_v1(
            butler,
            collection,
            filter_prefix=collection if filter_collections else "",
        )
    except MissingCollectionError:
        msg = f"Error: Collection '{collection}' not found in {repo} repo."
        if redis:
            redis.set(job_id, json.dumps({"status": "error", "message": msg}))
        return msg

    encoded_collection = urllib.parse.quote_plus(collection)
    encoded_repo = urllib.parse.quote_plus(repo)
    filename = f"{encoded_repo}/collection_{encoded_collection}.json.gz"

    json_gzipped = gzip.compress(json.dumps(summary).encode())

    try:
        s3_client.put_object(
            Body=json_gzipped,
            Bucket="rubin-plot-navigator",
            Key=filename,
        )
    except ClientError as e:
        msg = f"Error: {e}"
        if redis:
            redis.set(job_id, json.dumps({"status": "error", "message": msg}))
        return msg

    n_plots = len(summary["tracts"]) + len(summary["visits"]) + len(summary["global"])
    if redis:
        redis.set(job_id, json.dumps({"status": "complete", "message": f"Success: {n_plots} plots"}))
    return f"Success: {n_plots} plots"

def cache_plots_v2(job_id: str,
                repo: str,
                collection: str,
                s3_client: S3Client,
                *,
                filter_collections: bool = False,
                direct_ref_limit: int = 30,
                redis = None) -> str:
    """
    Generate the plot cache file and write it to S3.

    This writes out in the v2 file format and separately caches plot types that
    are extremely numerous into their own cache file.

    Parameters
    ----------
    repo : str
        Butler repository.
    collection : str
        Butler collection to search for plots.
    filter_collections : bool, optional
        Only include plots in run collections named with the same prefix as
        ``collection``.
    direct_ref_limit : int, optional
        Plot types with more than this number of plots will be written to
        separate collection summary files, to support faster access.

    Returns
    -------
    str
        Success or error message.
    """
    if redis:
        redis.set(job_id, json.dumps({"status": "running", "message": "Running"}))
    butler = dafButler.Butler.from_config(repo)

    try:
        summary_response = summarize_collection_v2(
            butler,
            collection,
            filter_prefix=collection if filter_collections else "",
            direct_ref_limit=direct_ref_limit
        )
    except MissingCollectionError:
        msg = f"Error: Collection '{collection}' not found in {repo} repo."
        if redis:
            redis.set(job_id, json.dumps({"status": "error", "message": msg}))
        return msg

    encoded_collection = urllib.parse.quote_plus(collection)
    encoded_repo = urllib.parse.quote_plus(repo)

    #
    #  Base summary file
    #
    filename = f"v2/{encoded_repo}/collection_{encoded_collection}.json.gz"
    json_gzipped = gzip.compress(summary_response.base_summary_file.model_dump_json().encode())

    try:
        s3_client.put_object(
            Body=json_gzipped,
            Bucket="rubin-plot-navigator",
            Key=filename,
        )
    except ClientError as e:
        msg = f"Error: {e}"
        if redis:
            redis.set(job_id, json.dumps({"status": "error", "message": msg}))
        return msg

    for plot_name, indirect_summary in summary_response.indirect_files.items():
        encoded_plot = urllib.parse.quote_plus(plot_name)
        indirect_filename = f"v2/{encoded_repo}/indirects/{encoded_collection}/{encoded_plot}.json.gz"

        indirect_json_gzipped = gzip.compress(indirect_summary.model_dump_json().encode())
        try:
            s3_client.put_object(
                Body=indirect_json_gzipped,
                Bucket="rubin-plot-navigator",
                Key=indirect_filename,
            )
        except ClientError as e:
            msg = f"Error: {e}"
            if redis:
                redis.set(job_id, json.dumps({"status": "error", "message": msg}))
            return msg

    summary = summary_response.base_summary_file
    n_plots = sum(summary.per_tract_counts.values())
    if redis:
        redis.set(job_id, json.dumps({"status": "complete", "message": f"Success: {n_plots} plots"}))
    return f"Success: {n_plots} plots"


def summarize_collection_v1(butler: dafButler.Butler, collection_name: str, filter_prefix: str = "") -> dict:
    out: dict = {}
    summary = butler.registry.getCollectionSummary(collection_name)

    plot_types = [x for x in summary.dataset_types if x.storageClass_name == "Plot"]

    tract_plot_types   = [x for x in plot_types if "tract" in x.dimensions]
    visit_plot_types   = [x for x in plot_types if "visit" in x.dimensions]
    global_plot_types  = [x for x in plot_types if "tract" not in x.dimensions and "visit" not in x.dimensions]

    def refs_for_types(plot_types_subset):
        datasets = list(butler.registry.queryDatasets(
            plot_types_subset, collections=collection_name, findFirst=True
        ))
        result = {}
        for plot_type in plot_types_subset:
            ref_dicts = [
                {"dataId": json.dumps(dict(ref.dataId.mapping)), "id": str(ref.id)}
                for ref in datasets
                if ref.datasetType == plot_type and ref.run.startswith(filter_prefix)
            ]
            if ref_dicts:
                result[plot_type.name] = ref_dicts
        return result

    out["tracts"] = refs_for_types(tract_plot_types)
    out["visits"] = refs_for_types(visit_plot_types)
    out["global"] = refs_for_types(global_plot_types)

    return out

def summarize_collection_v2(butler: dafButler.Butler,
                            collection_name: str,
                            filter_prefix: str = "",
                            direct_ref_limit: int = 10
                            ) -> CollectionSummaryResponse:
    """Create summary files for a collection.

    Any plot types that contain more than direct_ref_limit plots will have a
    separate summary file created for them, referenced in the indirect_refs list
    and returned as a file in indirect_files dict.

    """
    summary = butler.registry.getCollectionSummary(collection_name)

    plot_types = [x.name for x in summary.dataset_types if x.storageClass_name == "Plot"]

    per_plot_counts: dict[str,int] = {}
    per_tract_counts: dict[int,int] = defaultdict(int)
    direct_refs = {}
    indirect_refs = []
    indirect_summary_files = {}

    for plot_type in plot_types:
        dataset_refs = list(butler.query_datasets(
            plot_type, collections=collection_name, limit=None, explain=False
        ))

        if len(dataset_refs) == 0:
            continue

        ref_dicts = [
            PlotItem(dataId=json.dumps(dict(ref.dataId.mapping)), id=str(ref.id))
            for ref in dataset_refs
            if ref.run.startswith(filter_prefix)
        ]

        per_plot_counts[plot_type] = len(ref_dicts)

        tract_count = Counter(int(ref.dataId['tract'])
                              for ref in dataset_refs
                              if 'tract' in ref.dataId and ref.run.startswith(filter_prefix))

        for tract, count in tract_count.items():
            per_tract_counts[tract] += count

        if len(ref_dicts) <= direct_ref_limit:
            direct_refs[plot_type] = ref_dicts
        else:
            indirect_refs.append(plot_type)

            # Reuse the CollectionSummaryV2 file format for the single-plot-type
            # files that are referenced from the collection-level file. This is
            # maybe a bit excessive but avoids defining a separate file type.

            indirect_plot_collection = PlotCollection({plot_type: ref_dicts})
            indirect_summary_files[plot_type] = CollectionSummaryFileV2(direct_refs=indirect_plot_collection)


    output_summary = CollectionSummaryFileV2(
        per_plot_counts={k:v for (k,v) in per_plot_counts.items() if v > 0},
        per_tract_counts={k:v for (k,v) in per_tract_counts.items() if v > 0},
        direct_refs=PlotCollection(direct_refs),
        indirect_refs=indirect_refs,
    )

    return CollectionSummaryResponse(base_summary_file=output_summary,
                                     indirect_files=indirect_summary_files)
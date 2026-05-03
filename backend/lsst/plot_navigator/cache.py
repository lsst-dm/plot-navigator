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
import logging
import json
import urllib.parse
from uuid import uuid4

from typing import TYPE_CHECKING

import botocore
import lsst.daf.butler as dafButler
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

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

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.put("", response_model=CacheResponse)
async def enqueue_cache(body: CacheRequest,
                        background_tasks: BackgroundTasks,
                        request: Request) -> CacheResponse:
    """
    Enqueue a cache_plots background job for the given repo and collection.
    Returns the arq job ID which can be polled via GET /cache/job/<job_id>.
    """

    job_id = str(uuid4())
    request.app.state.redis.set(job_id, json.dumps({"status": "pending", "message": "Pending"}), ex=60*60*24)
    background_tasks.add_task(cache_plots_v1, job_id, body.repo, body.collection,
                              request.app.state.s3_client,
                              body.filter_collections, request.app.state.redis)
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
    except dafButler.MissingCollectionError:
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
    except botocore.exceptions.ClientError as e:
        msg = f"Error: {e}"
        if redis:
            redis.set(job_id, json.dumps({"status": "error", "message": msg}))
        return msg

    n_plots = len(summary["tracts"]) + len(summary["visits"]) + len(summary["global"])
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

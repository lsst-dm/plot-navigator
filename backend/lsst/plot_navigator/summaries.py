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
import os
import re
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Optional
from urllib.parse import quote, unquote

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from .config import Settings, get_settings
from .data_model import CollectionSummaryFile, CollectionSummaryFileV2, NamedPlotItem, PlotCollection, PlotItem

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

logger = logging.getLogger("api.summaries")

router = APIRouter(prefix="", tags=["summaries"])

@router.get("/ping")
async def ping():
    return {"status": "ok"}

BUCKET_NAME = os.getenv("BUCKET_NAME", "")
TEST_ASSETS_DIR = Path("test_assets/summaries")

# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class SummaryHeader(BaseModel):
    """API response for the list of available collections."""
    repo: str
    collection: str
    filename: str
    lastModified: datetime

class CollectionSummary(BaseModel):
    """API response for the list of plots."""
    plot_counts: dict[str, int]
    tract_counts: dict[int, int]
    visit_counts: dict[int, int]



# ---------------------------------------------------------------------------
# Internal helpers — S3 and filesystem variants mirror the JS originals
# ---------------------------------------------------------------------------

def _list_summaries_s3(repo_name: str, client: S3Client, prefix: str = "") -> list[SummaryHeader]:
    entries: list[SummaryHeader] = []
    prefix = prefix if prefix.endswith('/') else prefix + '/'
    bucket_path = f"{prefix}{quote(repo_name, safe='')}/"
    continuation_token: str | None = None

    start = time.perf_counter()
    while True:
        kwargs: dict = {"Bucket": BUCKET_NAME, "Prefix": bucket_path}
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token

        response = client.list_objects_v2(**kwargs)

        for obj in response.get("Contents", []):
            key: str = obj["Key"]
            match = re.search(r"collection_(.*?)\.json\.gz$", key)
            if match:
                collection = unquote(match.group(1))
                entries.append(SummaryHeader(
                    repo=repo_name,
                    collection=collection,
                    filename=key,
                    lastModified=obj["LastModified"],
                ))

        if not response.get("IsTruncated"):
            break
        continuation_token = response.get("NextContinuationToken")

    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(f"_list_summaries duration: {duration_ms:.2f} ms")

    return entries


def _list_summaries_filesystem(repo_name: str, prefix: str = "") -> list[SummaryHeader]:
    if prefix:
        repo_dir = TEST_ASSETS_DIR / prefix / quote(repo_name, safe="")
    else:
        repo_dir = TEST_ASSETS_DIR / quote(repo_name, safe="")
    entries: list[SummaryHeader] = []

    try:
        for filename in repo_dir.iterdir():
            match = re.fullmatch(r"collection_(.*?)\.json\.gz", filename.name)
            if match:
                collection = unquote(match.group(1))
                mtime = datetime.fromtimestamp(os.path.getmtime(filename))
                entries.append(SummaryHeader(
                    repo=repo_name,
                    collection=collection,
                    filename=filename.name,
                    lastModified=mtime,
                ))
    except FileNotFoundError:
        pass

    return entries


def _get_collection_data_s3(repo_name: str, collection_name: str, client: S3Client) -> CollectionSummaryFile:
    key = f"{quote(repo_name, safe='')}/collection_{quote(collection_name, safe='')}.json.gz"

    start = time.perf_counter()
    response = client.get_object(Bucket=BUCKET_NAME, Key=key)
    gz_data = response["Body"].read()
    text_data = gzip.decompress(gz_data)
    result = CollectionSummaryFile.model_validate_json(text_data)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(f"_get_summary_s3 compressed: {len(gz_data):d} bytes, "
                    f"uncompressed: {len(text_data):d} bytes, duration: {duration_ms:.2f} ms")

    return result


def _get_collection_data_filesystem(repo_name: str, collection_name: str) -> CollectionSummaryFile:
    path = (
        TEST_ASSETS_DIR
        / quote(repo_name, safe="")
        / f"collection_{quote(collection_name, safe='')}.json.gz"
    )

    return CollectionSummaryFile.model_validate_json( gzip.decompress(path.read_bytes()))

def _get_collection_data_v2(repo_name: str,
                            collection_name: str,
                            *,
                            client: S3Client | None = None,
                            indirect_plot: str | None = None,
                            use_filesystem: bool = False) -> CollectionSummaryFileV2:

    if not use_filesystem:
        if not client:
            raise ValueError("Must supply S3 client if use_filesystem=False")

        if indirect_plot:
            # v2/testing_butler/indirects/debug_collection/object_wPerpPSF_ColorColorFitPlot.json.gz
            key = f"v2/{quote(repo_name, safe='')}/indirects/{quote(collection_name, safe='')}/{quote(indirect_plot, safe='')}.json.gz"
        else:
            key = f"v2/{quote(repo_name, safe='')}/collection_{quote(collection_name, safe='')}.json.gz"

        start = time.perf_counter()

        try:
            response = client.get_object(Bucket=BUCKET_NAME, Key=key)
        except ClientError as e:
            raise LookupError(e)

        gz_data = response["Body"].read()
        text_data = gzip.decompress(gz_data)
        result = CollectionSummaryFileV2.model_validate_json(text_data)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(f"_get_collection_data_v2 compressed: {len(gz_data):d} bytes, "
                        f"uncompressed: {len(text_data):d} bytes, duration: {duration_ms:.2f} ms")

        return result

    else:

        if not indirect_plot:
            path = (
                TEST_ASSETS_DIR / "v2"
                / quote(repo_name, safe="")
                / f"collection_{quote(collection_name, safe='')}.json.gz"
            )
        else:
            path = (
                TEST_ASSETS_DIR / "v2"
                / quote(repo_name, safe="")
                / "indirects"
                / f"{quote(collection_name, safe='')}"
                / f"{quote(indirect_plot, safe='')}.json.gz"
            )

        try:
            data = path.read_bytes()
        except FileNotFoundError as e:
            raise LookupError(e)

        return CollectionSummaryFileV2.model_validate_json( gzip.decompress(data))

def _make_collection_summary_v1(collection_data) -> CollectionSummary:
    plot_counts: dict[str, int] = defaultdict(int)
    tract_counts: dict[int, int] = defaultdict(int)
    visit_counts: dict[int, int] = defaultdict(int)

    # .visits is a dict of [plot type, [{dataid, id}]]
    for entry in [collection_data.visits, collection_data.tracts, collection_data.global_]:
        for plot_type, plot_refs in entry.items():
            plot_counts[plot_type] += len(plot_refs)

            for plot_ref in plot_refs:
                dataId = json.loads(plot_ref.dataId)
                if 'tract' in dataId:
                    tract_counts[int(dataId['tract'])] += 1
                if 'visit' in dataId:
                    visit_counts[int(dataId['visit'])] += 1

    return CollectionSummary(plot_counts=plot_counts,
                             tract_counts=tract_counts,
                             visit_counts=visit_counts)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("")
def list_summaries(request: Request,
                   settings: Settings = Depends(get_settings)) -> list[SummaryHeader]:
    """
    List available collection summaries.
    """

    results: list[SummaryHeader] = []

    if not settings.enable_test_images:
        for repo_name in settings.butler_repo_names:
            v1_summaries = _list_summaries_s3(repo_name, request.app.state.s3_client)
            v2_summaries = _list_summaries_s3(repo_name, request.app.state.s3_client, prefix="v2")
            v2_repo_collections = [(s.repo, s.collection) for s in v2_summaries]

            results.extend(v2_summaries)
            results.extend([s for s in v1_summaries
                            if (s.repo, s.collection) not in v2_repo_collections])
    else:
        for repo_name in settings.butler_repo_names:
            v1_summaries = _list_summaries_filesystem(repo_name)
            v2_summaries = _list_summaries_filesystem(repo_name, prefix="v2")
            v2_repo_collections = [(s.repo, s.collection) for s in v2_summaries]

            results.extend(v2_summaries)
            results.extend([s for s in v1_summaries
                            if (s.repo, s.collection) not in v2_repo_collections])

    return results


@router.get("/collection/{repo}/{collection:path}")
def get_summary(repo: str,
                collection: str,
                request: Request,
                settings: Settings = Depends(get_settings)) -> CollectionSummary:
    """
    Return a summary of the plot types and their counts.
    """

    try:
        data_v2 = _get_collection_data_v2(repo, collection,
                                        client=request.app.state.s3_client,
                                        use_filesystem=settings.enable_test_images)

        return CollectionSummary(plot_counts=data_v2.per_plot_counts,
                                 tract_counts=data_v2.per_tract_counts,
                                 visit_counts={})

    except LookupError as e:
        print(f"Did not find v2 summary for collection {collection}")

        #
        # Fall back to v1 data
        #
        if not settings.enable_test_images:
            data = _get_collection_data_s3(repo, collection, request.app.state.s3_client)
        else:
            data = _get_collection_data_filesystem(repo, collection)

        if not data:
            raise HTTPException(status_code=404, detail="Summary not found")

    return _make_collection_summary_v1(data)


# TODO:
#
# - Turn get_summary into just the plot names+counts, and/or tracts + counts
# - summaries/plot/{plot_type}/{repo}/{collection:path}
# - summaries/tract/{tract}/{repo}/{collection:path}
# - summaries/visit/{visit}/{repo}/{collection:path}
# @router.get("//{repo}/{collection:path}")

def _make_plot_items_v1(plot: str, summary: CollectionSummaryFile) -> list[PlotItem]:
    entries: list[PlotItem]

    if plot in summary.visits:
        entries = summary.visits[plot]
    elif plot in summary.tracts:
        entries = summary.tracts[plot]
    elif plot in summary.global_:
        entries = summary.global_[plot]
    else:
        raise HTTPException(status_code=404, detail="Plot not found")

    return entries

@router.get("/plot/{plot}/{repo}/{collection:path}")
def get_plot_items(plot: str,
                   repo: str,
                   collection: str,
                   request: Request,
                   settings: Settings = Depends(get_settings)) -> list[PlotItem]:

    try:
        data_v2 = _get_collection_data_v2(repo, collection,
                                        client=request.app.state.s3_client,
                                        use_filesystem=settings.enable_test_images)

        if plot in data_v2.direct_refs:
            return data_v2.direct_refs[plot]
        else:
            indirect = _get_collection_data_v2(
                repo,
                collection,
                indirect_plot=plot,
                client=request.app.state.s3_client,
                use_filesystem=settings.enable_test_images,
            )
            if plot not in indirect.direct_refs:
                raise HTTPException(status_code=404, detail="Plot not found in cache file.")
            return indirect.direct_refs[plot]

    except LookupError:

        summary: CollectionSummaryFile
        if not settings.enable_test_images:
            summary = _get_collection_data_s3(repo, collection, request.app.state.s3_client)
        else:
            summary = _get_collection_data_filesystem(repo, collection)

        if not summary:
            raise HTTPException(status_code=404, detail="Collection summary not found")

        return _make_plot_items_v1(plot, summary)


@router.get("/tract/{tract}/{repo}/{collection:path}")
def get_tract_items(tract: int,
                   repo: str,
                   collection: str,
                   request: Request,
                   settings: Settings = Depends(get_settings)) -> list[NamedPlotItem]:

    try:
        data_v2 = _get_collection_data_v2(repo, collection,
                                        client=request.app.state.s3_client,
                                        use_filesystem=settings.enable_test_images)

        all_items: list[NamedPlotItem] = []

        # This is a potentially expensive search for a big collection
        for plot, plot_refs in data_v2.direct_refs.items():
            matching_items = [
                NamedPlotItem(name=plot, dataId=ref.dataId, id=ref.id)
                for ref in plot_refs
                if "tract" in ref.dataId and json.loads(ref.dataId)["tract"] == tract
            ]
            all_items.extend(matching_items)

        for plot in data_v2.indirect_refs:
            indirect_data = _get_collection_data_v2(
                repo,
                collection,
                indirect_plot=plot,
                client=request.app.state.s3_client,
                use_filesystem=settings.enable_test_images,
            )
            matching_items = [
                NamedPlotItem(name=plot, dataId=ref.dataId, id=ref.id)
                for ref in indirect_data.direct_refs[plot]
                if "tract" in ref.dataId and json.loads(ref.dataId)["tract"] == tract
            ]
            all_items.extend(matching_items)

        return all_items

    except LookupError:

        if not settings.enable_test_images:
            summary = _get_collection_data_s3(repo, collection, request.app.state.s3_client)
        else:
            summary = _get_collection_data_filesystem(repo, collection)

        if not summary:
            raise HTTPException(status_code=404, detail="Collection summary not found")

        output = []

        data_sources: list[PlotCollection] = [summary.visits, summary.tracts, summary.global_]

        for data_source in data_sources:
            for plot_name, plot_list in data_source.items():
                for plot in plot_list:
                    dataId = json.loads(plot.dataId)
                    if dataId.get('tract') == tract:
                        output.append(NamedPlotItem(name=plot_name, dataId=plot.dataId, id=plot.id))

        return output


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

import gzip
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import quote, unquote

import aioboto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="", tags=["summaries"])

@router.get("/ping")
async def ping():
    return {"status": "ok"}

BUCKET_NAME = os.getenv("BUCKET_NAME", "")
BUCKET_URL = os.getenv("BUCKET_URL", "")
S3_KEY = os.getenv("S3_KEY", "")
S3_SECRET = os.getenv("S3_SECRET", "")
S3_REGION = "s3dfrgw"
ENABLE_TEST_IMAGES = os.getenv("ENABLE_TEST_IMAGES", "").lower() in ("1", "true", "yes")
TEST_ASSETS_DIR = Path("test_assets/summaries")

_repo_urls: dict[str, str] | None = None


def get_repo_urls() -> dict[str, str]:
    global _repo_urls
    if _repo_urls is None:
        try:
            _repo_urls = json.loads(os.getenv("REPO_URLS", "{}"))
        except Exception as err:
            print(f"Could not parse REPO_URLS env var: {err}")
            _repo_urls = {}
    return _repo_urls


def get_s3_client():
    session = aioboto3.Session()
    return session.client(
        "s3",
        endpoint_url=BUCKET_URL,
        region_name=S3_REGION,
        aws_access_key_id=S3_KEY,
        aws_secret_access_key=S3_SECRET,
    )


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class SummaryEntry(BaseModel):
    repo: str
    collection: str
    filename: str
    lastModified: datetime


# ---------------------------------------------------------------------------
# Internal helpers — S3 and filesystem variants mirror the JS originals
# ---------------------------------------------------------------------------

async def _list_summaries_s3(repo_name: str) -> list[SummaryEntry]:
    entries: list[SummaryEntry] = []
    prefix = f"{quote(repo_name, safe='')}/"
    continuation_token: Optional[str] = None

    async with get_s3_client() as s3:
        while True:
            kwargs: dict = {"Bucket": BUCKET_NAME, "Prefix": prefix}
            if continuation_token:
                kwargs["ContinuationToken"] = continuation_token

            response = await s3.list_objects_v2(**kwargs)

            for obj in response.get("Contents", []):
                key: str = obj["Key"]
                match = re.search(r"collection_(.*?)\.json\.gz$", key)
                if match:
                    collection = unquote(match.group(1))
                    entries.append(SummaryEntry(
                        repo=repo_name,
                        collection=collection,
                        filename=key,
                        lastModified=obj["LastModified"],
                    ))

            if not response.get("IsTruncated"):
                break
            continuation_token = response.get("NextContinuationToken")

    return entries


def _list_summaries_filesystem(repo_name: str) -> list[SummaryEntry]:
    repo_dir = TEST_ASSETS_DIR / quote(repo_name, safe="")
    entries: list[SummaryEntry] = []

    try:
        for filename in repo_dir.iterdir():
            match = re.fullmatch(r"collection_(.*?)\.json\.gz", filename.name)
            if match:
                collection = unquote(match.group(1))
                entries.append(SummaryEntry(
                    repo=repo_name,
                    collection=collection,
                    filename=filename.name,
                    lastModified=datetime(2025, 3, 10, 2, 30),
                ))
    except FileNotFoundError:
        pass

    return entries


async def _get_summary_s3(repo_name: str, collection_name: str) -> dict:
    key = f"{quote(repo_name, safe='')}/collection_{quote(collection_name, safe='')}.json.gz"

    async with get_s3_client() as s3:
        try:
            response = await s3.get_object(Bucket=BUCKET_NAME, Key=key)
            gz_data = await response["Body"].read()
            return json.loads(gzip.decompress(gz_data))
        except Exception as err:
            print(f"S3 error fetching summary: {err}")
            return {}


def _get_summary_filesystem(repo_name: str, collection_name: str) -> dict:
    path = (
        TEST_ASSETS_DIR
        / quote(repo_name, safe="")
        / f"collection_{quote(collection_name, safe='')}.json.gz"
    )
    try:
        return json.loads(gzip.decompress(path.read_bytes()))
    except Exception as err:
        print(f"Filesystem error fetching summary: {err}")
        return {}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SummaryEntry])
async def list_summaries(repo: Optional[str] = None) -> list[SummaryEntry]:
    """
    List available collection summaries.
    Optionally filter to a single repo with ?repo=<name>.
    When no repo is specified, all repos from REPO_URLS are queried.
    """
    repo_urls = get_repo_urls()
    repos = [repo] if repo else list(repo_urls.keys())

    results: list[SummaryEntry] = []

    if not ENABLE_TEST_IMAGES:
        for repo_name in repos:
            results.extend(await _list_summaries_s3(repo_name))
    else:
        for repo_name in repos:
            results.extend(_list_summaries_filesystem(repo_name))

    return results


@router.get("/{repo:path}/{collection}", response_model=dict)
async def get_summary(repo: str, collection: str) -> dict:
    """
    Fetch the summary JSON for a specific repo + collection.
    The repo segment may contain slashes (e.g. embargo/main).
    """
    if not ENABLE_TEST_IMAGES:
        data = await _get_summary_s3(repo, collection)
    else:
        data = _get_summary_filesystem(repo, collection)

    if not data:
        raise HTTPException(status_code=404, detail="Summary not found")

    return data

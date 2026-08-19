# This file is part of production-tools.
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


import io
import logging
import time

import anyio
from fastapi import APIRouter, Depends, HTTPException, Response
from lsst.daf.butler import Butler, DatasetId
from lsst.resources import ResourcePath
from PIL import Image
from pydantic import BaseModel

from .config import Settings, get_settings

router = APIRouter(tags=["images"])

butler_map: dict[str, Butler] = {}

logger = logging.getLogger("images")


def get_butler(repo: str) -> Butler:
    if repo not in butler_map:
        print("Instantiating a butler")
        butler_map[repo] = Butler.from_config(repo)
    return butler_map[repo]


async def _validate_and_load(repo: str, uuid: str) -> bytes:
    """Shared validation logic: checks repo, fetches dataset, opens image."""

    butler = get_butler(repo)
    dataset_ref = butler.get_dataset(DatasetId(uuid))
    if not dataset_ref:
        raise HTTPException(status_code=404, detail="No dataset found")

    resource_path = ResourcePath(butler.getURI(dataset_ref))

    if dataset_ref.datasetType.storageClass_name != "Plot":
        raise HTTPException(status_code=400, detail="Storage class of dataset is not 'Plot'")

    start = time.perf_counter()
    async with await anyio.open_file(resource_path.path, "rb") as f:
        image_bytes = await f.read()
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info("Image file read time: %.2f ms ", duration_ms)

    return image_bytes


@router.get("/uuid/{repo}/{uuid}")
@router.head("/uuid/{repo}/{uuid}")
async def get_image(repo: str, uuid: str, settings: Settings = Depends(get_settings)) -> Response:
    """
    Retrieve a Plot image by repo and UUID.
    Responds to both GET and HEAD; sets Has-Metadata header if the PNG
    contains box annotations.
    """
    if repo not in settings.butler_repo_names:
        raise HTTPException(status_code=400, detail=f"Invalid repo {repo}")
    image_bytes = await _validate_and_load(repo, uuid)

    return Response(
        image_bytes,
        media_type="image/png",
    )


class ImageMetadata(BaseModel):
    label: str | None = None
    boxes: str | None = None


@router.get("/uuid_md/{repo}/{uuid}")
async def get_metadata(repo: str,
                       uuid: str,
                       settings: Settings = Depends(get_settings)) -> ImageMetadata:
    """
    Retrieve PNG metadata (label and box annotations) for a Plot dataset.
    """
    if repo not in settings.butler_repo_names:
        raise HTTPException(status_code=400, detail=f"Invalid repo {repo}")

    image_bytes = await _validate_and_load(repo, uuid)

    image = Image.open(io.BytesIO(image_bytes))

    return ImageMetadata(
        label=image.info.get("label"),
        boxes=image.info.get("boxes"),
    )

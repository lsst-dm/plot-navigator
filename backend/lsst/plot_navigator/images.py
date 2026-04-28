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

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from lsst.daf.butler import Butler, DatasetId
from lsst.resources import ResourcePath
from PIL import Image
from pydantic import BaseModel

from .config import Settings, get_settings

router = APIRouter(tags=["images"])

# REPO_NAMES = os.getenv("BUTLER_REPO_NAMES", "").split(",")

butler_map: dict[str, Butler] = {}


def get_butler(repo: str) -> Butler:
    if repo not in butler_map:
        print("Instantiating a butler")
        butler_map[repo] = Butler.from_config(repo)
    return butler_map[repo]


def _validate_and_load(repo: str, uuid: str) -> tuple[ResourcePath, Image.Image]:
    """Shared validation logic: checks repo, fetches dataset, opens image."""

    butler = get_butler(repo)
    dataset_ref = butler.get_dataset(DatasetId(uuid))
    if not dataset_ref:
        raise HTTPException(status_code=404, detail="No dataset found")

    resource_path = ResourcePath(butler.getURI(dataset_ref))

    if dataset_ref.datasetType.storageClass_name != "Plot":
        raise HTTPException(status_code=400, detail="Storage class of dataset is not 'Plot'")

    image_bytes = io.BytesIO(resource_path.read())
    image = Image.open(image_bytes)

    return resource_path, image


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
    resource_path, image = _validate_and_load(repo, uuid)

    headers = {}
    if "boxes" in image.info:
        headers["Has-Metadata"] = "true"

    # For HEAD requests return headers only, no body.
    if not hasattr(get_image, "_request_method"):
        pass  # handled by FastAPI routing — HEAD auto-strips body

    # BytesIO behaves like a stream, so a fresh read is needed for send.
    image_to_send = io.BytesIO(resource_path.read())
    return StreamingResponse(
        image_to_send,
        media_type="image/png",
        headers=headers,
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

    _, image = _validate_and_load(repo, uuid)

    return ImageMetadata(
        label=image.info.get("label"),
        boxes=image.info.get("boxes"),
    )

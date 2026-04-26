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


import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

import boto3
import redis
from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import cache, images, summaries
from .config import Settings, get_settings

logger = logging.getLogger("api.middleware")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=logging.INFO, force=True)

    app.state.redis = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
    )

    session = boto3.Session()
    app.state.s3_client = session.client("s3", endpoint_url=os.getenv("S3_ENDPOINT_URL"))
    yield
    app.state.redis.close()



def app_factory(settings: Settings | None = None) -> FastAPI:
    if settings is None:
        settings = get_settings()

    app = FastAPI(lifespan=lifespan)

    base_router = APIRouter()
    app.include_router(summaries.router, prefix=f"{settings.app_prefix}/api/v1/summaries")
    app.include_router(images.router, prefix=f"{settings.app_prefix}/api/v1/images")
    app.include_router(cache.router, prefix=f"{settings.app_prefix}/api/v1/cache")


    # --- Static assets (JS, CSS, images from Vite build) ---
    if os.getenv("DIST_DIR"):
        DIST = Path(os.getenv("DIST_DIR"))
    else:
        DIST = Path(__file__).parent.parent.parent.parent / "frontend" / "dist"
    app.mount(f"{settings.app_prefix}/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    # --- SPA catch-all: any unmatched route serves index.html ---
    @base_router.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(DIST / "index.html")

    app.include_router(base_router, prefix=settings.app_prefix)

    @app.middleware("http")
    async def log_request_time(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "request_timing path: %s, duration: %.2f ms",
            request.url.path,
            duration_ms,
            extra={
                "method": request.method,
                "path": request.url.path,
                "route": request.scope.get("route").path if request.scope.get("route") else request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        response.headers["X-Process-Time-ms"] = f"{duration_ms:.2f}"
        return response

    return app
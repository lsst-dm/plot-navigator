import os
from contextlib import asynccontextmanager
from pathlib import Path

import boto3
import redis
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import cache, images, summaries


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
    )

    # Could set profile_name="rubin-plot-navigator" here
    session = boto3.Session()
    app.state.s3_client = session.client("s3", endpoint_url=os.getenv("S3_ENDPOINT_URL"))
    yield
    app.state.redis.close()

app = FastAPI(lifespan=lifespan)

app.include_router(summaries.router, prefix="/api/v1/summaries")
app.include_router(images.router, prefix="/api/v1/images")
app.include_router(cache.router, prefix="/api/v1/cache")

# --- Static assets (JS, CSS, images from Vite build) ---
DIST = Path(__file__).parent.parent.parent.parent / "frontend" / "dist"
app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

# --- SPA catch-all: any unmatched route serves index.html ---
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse(DIST / "index.html")

def serve():
    import uvicorn
    uvicorn.run("lsst.plot_navigator.main:app", host="0.0.0.0", port=8000, reload=False)
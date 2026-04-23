#!/usr/bin/env python3
"""
Create a temporary Butler repository and register an existing PNG file in place.
"""

import gzip
import json
import urllib
from pathlib import Path

from lsst.daf.butler import Butler, DatasetType, FileDataset

from lsst.plot_navigator.cache import summarize_collection


# TODO: This is all really messy
def create_temp_butler(tracts) -> None:
    repo_dir = Path("testing_butler")

    if not repo_dir.exists():
        Butler.makeRepo(repo_dir)

    butler = Butler(repo_dir, writeable=True)

    skymap_name = "test_skymap"
    butler.registry.insertDimensionData("skymap", {"name": skymap_name})

    for tract in tracts:
        butler.registry.insertDimensionData(
            "tract",
            {"skymap": skymap_name, "id": tract, "region": None},
        )

    print(f"Created temporary Butler repo at: {repo_dir}")


def ingest_to_temp_butler(file_path: str | Path, tract: int) -> None:
    file_path = Path(file_path).resolve()
    if not file_path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")

    repo_dir = Path("testing_butler")

    butler = Butler(repo_dir, writeable=True)

    # --- 2. Register a RUN collection ---
    run = "debug_collection"
    butler.registry.registerRun(run)

    # --- 3. Register the dataset type ---
    dataset_type = DatasetType(
        "object_wPerpPSF_ColorColorFitPlot",
        butler.dimensions.conform(["tract", "band", "skymap"]),
        "Plot",
    )
    butler.registry.registerDatasetType(dataset_type)

    # --- 5. Insert a registry record for the dataset ---
    skymap_name = "test_skymap"
    data_id = {"tract": tract, "skymap": skymap_name, "band": "g"}
    (ref,) = butler.registry.insertDatasets(
        dataset_type, dataIds=[data_id], run=run
    )
    print(f"Registered dataset ref: {ref}")

    # --- 6. Ingest in place with transfer="direct" ---
    file_dataset = FileDataset(path=str(file_path), refs=[ref])
    butler.ingest(file_dataset, transfer="direct")
    print(f"Ingested in place: {file_path}")

    # --- 7. Verify ---
    exists = butler.exists(ref)
    print(f"Datastore reports file exists: {exists}")
    print("Done.")


def main():

    create_temp_butler(range(1461,1480))
    ingest_to_temp_butler("test_assets/images/debug/6b2b562b-9a4b-493a-9c59-a55e1a47e43c.png", 1461)
    ingest_to_temp_butler("test_assets/images/debug/e5aba659-e379-47e2-ba1c-d93bfea1a4fa.png", 1463)

    collection = "debug_collection"
    repo = "testing_butler"
    b = Butler(repo)
    summary = summarize_collection(b, collection)

    print(summary)

    encoded_collection = urllib.parse.quote_plus(collection)
    encoded_repo = urllib.parse.quote_plus(repo)
    filename = Path(f"{encoded_repo}/collection_{encoded_collection}.json.gz")

    json_gzipped = gzip.compress(json.dumps(summary).encode())

    Path(f"test_assets/summaries/{encoded_repo}").mkdir(parents=True, exist_ok=True)
    with open(Path("test_assets/summaries") / filename, "wb") as f:
        f.write(json_gzipped)


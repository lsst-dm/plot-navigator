#!/usr/bin/env python3
"""
Create a temporary Butler repository and register an existing PNG file in place.
"""

import gzip
import json
import urllib.parse
from collections.abc import Iterable
from pathlib import Path

import lsst.daf.butler
from lsst.daf.butler import Butler, DatasetRef, DatasetType, FileDataset

from lsst.plot_navigator.cache import summarize_collection_v1, summarize_collection_v2


def create_temp_butler(tracts: Iterable[int], repo_dir: Path) -> None:

    if not repo_dir.exists():
        Butler.makeRepo(repo_dir)

    butler = Butler.from_config(repo_dir, writeable=True)

    skymap_name = "test_skymap"
    butler.registry.insertDimensionData("skymap", {"name": skymap_name}, skip_existing=True)

    for tract in tracts:
        butler.registry.insertDimensionData(
            "tract",
            {"skymap": skymap_name, "id": tract, "region": None},
            skip_existing=True
        )

    butler.registry.registerDatasetType(
        DatasetType(
        "object_wPerpPSF_ColorColorFitPlot",
        butler.dimensions.conform(["tract", "band", "skymap"]),
        "Plot",
        )
    )

    butler.registry.registerDatasetType(
        DatasetType(
            "analysis_source_association_whole_sky_wholeSkyMetric_stellarAstrometricRepeatability1_i_AM1_WholeSkyPlot",
            butler.dimensions.conform(["skymap"]),
            "Plot",
        )
    )

    print(f"Created temporary Butler repo at: {repo_dir}")


def ingest_to_temp_butler(butler: Butler,
                          file_path: str | Path,
                          dataset_type: str,
                          run_collection: str,
                          data_id: dict) -> None:
    file_path = Path(file_path).resolve()
    if not file_path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")

    # --- 2. Register a RUN collection ---
    butler.registry.registerRun(run_collection)

    # --- 5. Insert a registry record for the dataset ---
    ref: DatasetRef
    try:
        (ref,) = butler.registry.insertDatasets(
            dataset_type, dataIds=[data_id], run=run_collection
        )
        print(f"Registered dataset ref: {ref}")
    except lsst.daf.butler.registry.ConflictingDefinitionError:
        print("Skipping existing file")
        return


    # --- 6. Ingest in place with transfer="direct" ---
    file_dataset = FileDataset(path=str(file_path), refs=[ref])
    butler.ingest(file_dataset, transfer="direct")
    print(f"Ingested in place: {file_path}")

    # --- 7. Verify ---
    assert butler.exists(ref)


def write_summary_file(butler, repo_name, collection):

    summary = summarize_collection_v1(butler, collection)

    encoded_collection = urllib.parse.quote_plus(collection)
    encoded_repo = urllib.parse.quote_plus(repo_name)
    filename = Path(f"{encoded_repo}/collection_{encoded_collection}.json.gz")

    json_gzipped = gzip.compress(json.dumps(summary).encode())

    Path(f"test_assets/summaries/{encoded_repo}").mkdir(parents=True, exist_ok=True)
    with open(Path("test_assets/summaries") / filename, "wb") as f:
        f.write(json_gzipped)

def write_summary_files_v2(butler, repo_name, collection):

    summary_response = summarize_collection_v2(butler, collection)

    encoded_collection = urllib.parse.quote_plus(collection)
    encoded_repo = urllib.parse.quote_plus(repo_name)

    summary = summary_response.base_summary_file
    json_gzipped = gzip.compress(summary.model_dump_json().encode())

    # TODO: This is duplicative
    Path(f"test_assets/summaries/v2/{encoded_repo}/indirects").mkdir(parents=True, exist_ok=True)
    filename = Path(f"v2/{encoded_repo}/collection_{encoded_collection}.json.gz")
    with open(Path("test_assets/summaries") / filename, "wb") as f:
        f.write(json_gzipped)


    for plot_name, indirect_summary in summary_response.indirect_files.items():
        encoded_plot = urllib.parse.quote_plus(plot_name)
        indirect_filename = f"v2/{encoded_repo}/indirects/{encoded_collection}/{encoded_plot}.json.gz"

        indirect_json_gzipped = gzip.compress(indirect_summary.model_dump_json().encode())
        with open(Path("test_assets/summaries") / indirect_filename, "wb") as f:
            f.write(indirect_json_gzipped)



def make_test_butler(repo_dir: Path, repo_name: str) -> None:

    create_temp_butler(range(1461,1480), repo_dir)

    # Create a collection with an annoyingly long name for testing.
    collections = ["debug_collection",
                   "debug_collection_v2",
                   "debug_collection_v2_only",
                   "LSSTCam/calib/DM-53399/3s_v1_dp2_gain_correction_20250720/gainCorrectionGen.20251124a/20251202T172458Z"]

    butler = Butler.from_config(repo_dir, writeable=True)

    for collection in collections:
        ingest_to_temp_butler(
            butler,
            "test_assets/images/debug/6b2b562b-9a4b-493a-9c59-a55e1a47e43c.png",
            "object_wPerpPSF_ColorColorFitPlot",
            collection,
            {"tract": 1461, "skymap": "test_skymap", "band": "g"},
        )
        ingest_to_temp_butler(
            butler,
            "test_assets/images/debug/e5aba659-e379-47e2-ba1c-d93bfea1a4fa.png",
            "object_wPerpPSF_ColorColorFitPlot",
            collection,
            {"tract": 1463, "skymap": "test_skymap", "band": "g"},
        )

        ingest_to_temp_butler(
            butler,
            "test_assets/images/debug/04e7c0fb-40e7-4a07-9e2a-cc9987282923.png",
            "analysis_source_association_whole_sky_wholeSkyMetric_stellarAstrometricRepeatability1_i_AM1_WholeSkyPlot",
            collection,
            {"skymap": "test_skymap"}
        )


        if "v2_only" not in collection:
            print(f"Writing v1 summary for collection: {collection}")
            write_summary_file(butler, repo_name, collection)

        if "v2" in collection:
            print(f"Writing v2 summary for collection: {collection}")
            write_summary_files_v2(butler, repo_name, collection)

def main():

    repo_name = "testing_butler"
    repo_dir = "testing_butler"
    make_test_butler(Path(repo_dir), repo_name)

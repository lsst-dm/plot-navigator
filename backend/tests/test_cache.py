
from pathlib import Path
from unittest.mock import Mock
from uuid import uuid4

import pytest

from lsst.plot_navigator.cache import cache_plots
from lsst.plot_navigator.make_test_butler import create_temp_butler_and_ingest


@pytest.fixture(scope="session")
def test_butler():
    repo_dir = Path("testing_butler")
    if not repo_dir.exists():
        create_temp_butler_and_ingest("test_assets/images/debug/6b2b562b-9a4b-493a-9c59-a55e1a47e43c.png", 1461)
    return repo_dir

def test_cache_plots(test_butler):
    #butler = Butler(test_butler)
    #summary = summarize_collection(butler, "debug_collection")

    job_id = str(uuid4())
    collection = "debug_collection"
    repo = "testing_butler"
    s3_client = Mock()
    ret = cache_plots(job_id,
                repo,
                collection,
                s3_client,
                filter_collections=False,
                redis=None)

    assert ret.startswith("Success")
    s3_client.put_object.assert_called_once()


from unittest.mock import Mock
from uuid import uuid4

from lsst.plot_navigator.cache import cache_plots


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

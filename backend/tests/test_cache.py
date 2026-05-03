
from unittest.mock import Mock
from uuid import uuid4

from lsst.daf.butler import Butler
from lsst.plot_navigator.cache import cache_plots_v1, summarize_collection_v1


def test_cache_plots_v1(test_butler):
    """Test that the cache is created and written to S3.
    Does not test the contents of the cache file.
    """

    job_id = str(uuid4())
    collection = "debug_collection"
    repo = "testing_butler"
    s3_client = Mock()
    ret = cache_plots_v1(job_id,
                repo,
                collection,
                s3_client,
                filter_collections=False,
                redis=None)

    assert ret.startswith("Success")
    s3_client.put_object.assert_called_once()

def test_summarize_v1(test_butler):
    """Test the contents of the collection summary."""

    collection = "debug_collection"
    butler = Butler.from_config(test_butler)

    summary = summarize_collection_v1(butler, collection)

    assert "tracts" in summary
    assert "object_wPerpPSF_ColorColorFitPlot" in summary['tracts']
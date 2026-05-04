
import json
from unittest.mock import Mock, ANY
from uuid import uuid4

from lsst.daf.butler import Butler

from lsst.plot_navigator.cache import (
    cache_plots_v1,
    cache_plots_v2,
    summarize_collection_v1,
    summarize_collection_v2,
)


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

def test_cache_plots_v2(test_butler):
    """Test that the cache is created and written to S3.
    Does not test the contents of the cache file.
    """

    job_id = str(uuid4())
    collection = "debug_collection"
    repo = "testing_butler"
    s3_client = Mock()
    ret = cache_plots_v2(job_id,
                repo,
                collection,
                s3_client,
                filter_collections=False,
                redis=None)

    assert ret.startswith("Success")
    s3_client.put_object.assert_called_once()

def test_cache_plots_v2_indirect(test_butler):
    """Test that indirect cache summaries are written.
    Does not test the contents of the cache file.
    """

    job_id = str(uuid4())
    collection = "debug_collection"
    repo = "testing_butler"
    s3_client = Mock()
    ret = cache_plots_v2(job_id,
                repo,
                collection,
                s3_client,
                filter_collections=False,
                direct_ref_limit=1, # Extra low limit to force indirect summary
                redis=None)

    assert ret.startswith("Success")
    assert s3_client.put_object.call_count == 2
    s3_client.put_object.assert_any_call(Body=ANY, Bucket="rubin-plot-navigator",
                                         Key="v2/testing_butler/indirects/debug_collection/object_wPerpPSF_ColorColorFitPlot.json.gz")

def test_summarize_v1(test_butler):
    """Test the contents of the collection summary."""

    collection = "debug_collection"
    butler = Butler.from_config(test_butler)

    summary = summarize_collection_v1(butler, collection)

    assert "tracts" in summary
    assert "object_wPerpPSF_ColorColorFitPlot" in summary['tracts']

def test_summarize_v2(test_butler):
    """Test the contents of the collection summary."""

    collection = "debug_collection"
    butler = Butler.from_config(test_butler)

    summary_response = summarize_collection_v2(butler, collection)

    summary = summary_response.base_summary_file

    assert "object_wPerpPSF_ColorColorFitPlot" in summary.per_plot_counts
    assert "object_wPerpPSF_ColorColorFitPlot" in summary.direct_refs
    assert "object_wPerpPSF_ColorColorFitPlot" not in summary.indirect_refs
    assert summary.per_plot_counts["object_wPerpPSF_ColorColorFitPlot"] == 2
    assert summary.per_tract_counts[1461] == 1
    assert len(summary.indirect_refs) == 0
    assert len(summary.direct_refs["object_wPerpPSF_ColorColorFitPlot"]) == 2

    tracts = [json.loads(plot_item.dataId)['tract']
              for plot_item in summary.direct_refs["object_wPerpPSF_ColorColorFitPlot"]]
    assert 1461 in tracts

def test_summarize_v2_indirect(test_butler):
    """Test the ability to store high number count plots in a separate file"""

    collection = "debug_collection"
    butler = Butler.from_config(test_butler)

    summary_response = summarize_collection_v2(butler, collection, direct_ref_limit=1)

    summary = summary_response.base_summary_file

    assert summary.per_plot_counts["object_wPerpPSF_ColorColorFitPlot"] == 2
    assert summary.per_tract_counts[1461] == 1

    assert "object_wPerpPSF_ColorColorFitPlot" in summary.indirect_refs
    assert "object_wPerpPSF_ColorColorFitPlot" not in summary.direct_refs
    assert ("analysis_source_association_whole_sky_"
            "wholeSkyMetric_stellarAstrometricRepeatability1_i_AM1_WholeSkyPlot") in summary.direct_refs


    assert len(summary.indirect_refs) == 1

    indirect_summary = summary_response.indirect_files["object_wPerpPSF_ColorColorFitPlot"]
    assert len(indirect_summary.direct_refs["object_wPerpPSF_ColorColorFitPlot"]) == 2

    tracts = [json.loads(plot_item.dataId)['tract']
              for plot_item in indirect_summary.direct_refs["object_wPerpPSF_ColorColorFitPlot"]]
    assert 1461 in tracts
    assert 1463 in tracts
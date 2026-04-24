

import json

from fastapi.testclient import TestClient

from lsst.plot_navigator.summaries import CollectionSummary, NamedPlotItem, PlotItem, SummaryHeader


def test_list_summaries(client: TestClient, test_butler):
    response = client.get("/api/v1/summaries")
    headers = [SummaryHeader.model_validate(entry) for entry in response.json()]
    repos = [h.repo for h in headers]
    assert "testing_butler" in repos

def test_summary_contents(client: TestClient, test_butler):
    response = client.get("/api/v1/summaries/collection/testing_butler/debug_collection")
    summary = CollectionSummary.model_validate(response.json())
    assert summary.plot_counts["object_wPerpPSF_ColorColorFitPlot"] == 2

def test_plot_items(client: TestClient, test_butler):
    url = "/api/v1/summaries/plot/object_wPerpPSF_ColorColorFitPlot/testing_butler/debug_collection"
    response = client.get(url)
    items = [PlotItem.model_validate(item) for item in response.json()]
    assert len(items) == 2
    tracts = [json.loads(item.dataId)['tract'] for item in items]
    assert 1461 in tracts
    assert 1463 in tracts


def test_tract_items(client: TestClient, test_butler):
    url = "/api/v1/summaries/tract/1461/testing_butler/debug_collection"
    response = client.get(url)
    items = [NamedPlotItem.model_validate(item) for item in response.json()]
    assert len(items) == 1
    plotNames = [item.name for item in items]
    assert "object_wPerpPSF_ColorColorFitPlot" in plotNames

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

def test_summary_contents_v2(client: TestClient, test_butler):

    # This collection has both v1 and v2
    response = client.get("/api/v1/summaries/collection/testing_butler/debug_collection_v2")
    summary = CollectionSummary.model_validate(response.json())
    assert summary.plot_counts["object_wPerpPSF_ColorColorFitPlot"] == 2

    # Only V2
    response = client.get("/api/v1/summaries/collection/testing_butler/debug_collection_v2_only")
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

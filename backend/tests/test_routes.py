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

from fastapi.testclient import TestClient

from lsst.plot_navigator.repos import RepoList
from lsst.plot_navigator.tables import TableList, GroupList


def test_list_summaries(client: TestClient, test_butler):
    response = client.get("/api/v1/repos")
    repo_list = RepoList.model_validate(response.json())
    assert "testing_butler" in repo_list.repos

def test_list_metric_tables(client: TestClient, test_butler):
    repo = "testing_butler"
    collection = "debug_collection_v2"
    response = client.get(f"/api/v1/tables/tables/{repo}/{collection}")
    table_list = TableList.model_validate(response.json())
    assert "object_metrics_table" in table_list.tables

def test_list_groups_in_table(client: TestClient, test_butler):
    repo = "testing_butler"
    collection = "debug_collection_v2"
    response = client.get(f"/api/v1/tables/groups/object_metrics_table/{repo}/{collection}")
    group_list = GroupList.model_validate(response.json())
    assert "shapeSizeFractionalDiff" in group_list.groups

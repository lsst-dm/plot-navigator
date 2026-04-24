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


from pydantic import BaseModel, Field, RootModel


class PlotItem(BaseModel):
    """A single plot reference with a data id and UUID."""
    dataId: str
    id: str

class NamedPlotItem(BaseModel):
    """A single plot with its name, data id and UUID."""
    name: str
    dataId: str
    id: str


class PlotCollection(RootModel[dict[str, list[PlotItem]]]):
    """Maps plot type names to lists of plot items."""

    def __getitem__(self, key: str) -> list[PlotItem]:
        return self.root[key]

    def __iter__(self):  # type: ignore[override]
        return iter(self.root)

    def keys(self):
        return self.root.keys()

    def items(self):
        return self.root.items()


class CollectionSummaryFile(BaseModel):
    """This is the summary file stored as JSON on disk.
    This should get replaced soon with a better structure."""
    tracts: PlotCollection = Field(default_factory=PlotCollection)
    visits: PlotCollection = Field(default_factory=PlotCollection)
    global_: PlotCollection = Field(default_factory=PlotCollection, alias="global")

    model_config = {"populate_by_name": True}


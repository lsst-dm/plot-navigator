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

import logging
from typing import Annotated

import duckdb
import lsst.daf.butler as dafButler
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from .config import Settings, get_settings

router = APIRouter(tags=["tables"])

logger = logging.getLogger("tables")

class TableList(BaseModel):
    """API response for the list of available collections."""
    repo: str
    collection: str
    tables: list[str]

class GroupList(BaseModel):
    """API response for the list of available metric groups in a table."""
    repo: str
    collection: str
    table: str
    groups: list[str]

#TODO: can we validate the repo and collection argument somewhere outside of the function?
#TODO: This is maybe kind of slow, can we cache it in memory?
@router.get("/tables/{repo}/{collection:path}")
async def get_tables(repo: str,
                     collection: str,
                     settings: Settings = Depends(get_settings)) -> TableList:
    butler = dafButler.Butler.from_config(repo)
    table_dataset_types = butler.registry.queryDatasetTypes("*metrics_table")
    all_datasets = [
        butler.query_datasets(dataset_type, collections=collection, explain=False)
        for dataset_type in table_dataset_types
    ]

    # all_datasets is a list of lists, so this searches per candidate dataset,
    # then picks the name out of each dataset ref in that candidate
    dataset_names = [
       ref.datasetType.name
       for dataset_refs in all_datasets
       for ref in dataset_refs
    ]

    return TableList(repo=repo, collection=collection, tables=list(set(dataset_names)))

@router.get("/data/{table_name}/{repo}/{collection:path}")
async def get_table(table_name: str,
                    repo: str,
                    collection: str,
                    group_names: Annotated[str | None, Query(pattern="[a-zA-Z,]+")] = None,
                    settings: Settings = Depends(get_settings)) -> list[dict]:
  butler = dafButler.Butler(repo, collections=collection)
  refs = butler.query_datasets(table_name)
  if len(refs) < 1:
    raise HTTPException(status_code=404, detail="Metric table not found")

  parquet_filename = butler.getURI(refs[0])
  con = duckdb.connect()

  if group_names:
    # Want to have a list of data ID dimensions that always get selected
    column_string = ",".join(f"COLUMNS('{name}.*')" for name in group_names.split(","))
    try:
      res = con.execute(f"SELECT tract, {column_string} FROM read_parquet(\"{parquet_filename}\")")
    except duckdb.BinderException as e:
      raise HTTPException(status_code=404, detail="Invalid group names")
  else:
    res = con.execute(f"SELECT * FROM read_parquet(\"{parquet_filename}\")")

  return res.to_arrow_table().to_pylist()

@router.get("/groups/{table_name}/{repo}/{collection:path}")
async def get_table_groups(table_name: str,
                           repo: str,
                           collection: str,
                           settings: Settings = Depends(get_settings)) -> GroupList:

  butler = dafButler.Butler(repo, collections=collection)
  refs = butler.query_datasets(table_name)
  if len(refs) < 1:
    raise HTTPException(status_code=404, detail="Metric table not found")

  parquet_filename = butler.getURI(refs[0])

  con = duckdb.connect()

  result = con.execute("SELECT split_part(column_name, '_', 1)  AS col_group "
                       f"FROM (DESCRIBE SELECT * FROM read_parquet(\"{parquet_filename}\") ) "
                       "GROUP BY col_group")

  table = result.to_arrow_table()
  return GroupList(repo=repo, collection=collection, table=table_name,
                   groups=table["col_group"].to_pylist())
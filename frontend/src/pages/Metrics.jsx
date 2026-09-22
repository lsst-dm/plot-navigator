
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { MetricTable } from '../components/metricTable'
import { apiFetch } from '../wrappers'
import { DropdownOptions } from '../components/dropdownOptions'

const numberFormat = Intl.NumberFormat("en-US", {minimumSignificantDigits: 1, maximumSignificantDigits: 3})

const dimensions = ['tract', 'visit', 'detector']

const createColumnsFromRow = (row, groupPrefix, repo, collection) => {

  const subgroups = [... new Set(row.map((column) => column.match("([ugrizy])_(.*)") ? column.match("([ugrizy])_(.*)")[2] : null))
    ].filter((x) => x)

    const link_to_dimension = (dimension, value) => {
      if(dimension == "tract") {
        return <Link to={{pathname: `/tract/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${value}`}}>{value}</Link>
      } else {
        return value
      }
    }

  const cell_formatter = (cell) => {
    return dimensions.includes(cell.column.id) ?
      link_to_dimension(cell.column.id, cell.getValue())
      : (cell.getValue() ? numberFormat.format(cell.getValue()) : "-")
  }

  const col_groups = subgroups.map((group) =>
    ({
      id: group,
      header: group,
      columns: row.filter((column) => column.match(`[ugrizy]_${group}`))
        .map((column) =>
        ({
          id: column.replace(groupPrefix + "_", ""),
          /* Must return null columns as undefined for proper sorting */
          accessorFn: row => row[column] ? row[column] : undefined,
          header: column.replace(groupPrefix + "_", "").replace("_" + group, ""),
          cell: cell_formatter,
          sortUndefined: 'last',
        })
      )
,
      depth: 1,
    })
  )

  const individual_cols = row.filter((column) => !column.match("([ugrizy])_(.*)")).map((column) =>
    ({
      id: column.replace(groupPrefix + "_", ""),
      /* Must return null columns as undefined for proper sorting */
      accessorFn: row => row[column] ? row[column] : undefined,
      header: column.replace(groupPrefix + "_", ""),
      cell: cell_formatter,
      sortUndefined: 'last',
      parent: column.match(`${groupPrefix}_[ugrizy]_(.*)`) ? column.match(`${groupPrefix}_[ugrizy]_(.*)`)[1] : "blah",
    })
  )
  return [...individual_cols, ...col_groups]
}

export default function Metrics() {

  const { collection: _collection, repo: _repo } = useParams()
  const collection = decodeURIComponent(_collection)
  const repo = decodeURIComponent(_repo)

  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [groups, setGroups] = useState([])
  const [table, setTable] = useState("")
  const [tableList, setTableList] = useState("")
  const [selectedGroups, setSelectedGroups] = useState({})

  useEffect(() => {apiFetch(`/api/v1/tables/groups/${table}/${_repo}/${_collection}`)
      .then(data => {
          setGroups(data.groups);
      })
      .catch((e) => {
          console.log(e);
    })
  }, [table])

  useEffect(() => {
    const groupString = Object.keys(selectedGroups).filter((key) => selectedGroups[key]).join(",")
    apiFetch(`/api/v1/tables/data/${table}/${_repo}/${_collection}?group_names=${groupString}`)
      .then(data => {
          setData(data);
          const groupPrefix = Object.keys(selectedGroups).filter((key) => selectedGroups[key])[0]
          setColumns(createColumnsFromRow(Object.keys(data[0]), groupPrefix, repo, collection));
      })
      .catch((e) => {
          console.log(e);
    })
  }, [selectedGroups])

  useEffect(() => {apiFetch(`/api/v1/tables/tables/${_repo}/${_collection}`)
      .then(data => {
          setTableList(data.tables)
      })
      .catch((e) => {
          console.log(e);
    })
  }, [])


    return (
      <div>
        <div>
          <div className="text-2xl p-2">{table}</div>
          <DropdownOptions options={tableList} prefix={"Metric Table"} onChange={(selTable) => setTable(selTable)}/>
          <DropdownOptions options={groups} prefix={"Metric Group"} onChange={(selGroup) => setSelectedGroups({[selGroup]: true})}/>
        </div>
        <MetricTable data={data} columns={columns} />
      </div>
    )

}
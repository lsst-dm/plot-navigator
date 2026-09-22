

import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { apiFetch } from '../wrappers'
import { Link } from 'react-router'

export default function MetricsList() {

  const { collection: _collection, repo: _repo } = useParams()
  const collection = decodeURIComponent(_collection)
  const repo = decodeURIComponent(_repo)
  const [tableList, setTableList] = useState([])

  useEffect(() => {apiFetch(`/api/v1/tables/tables/${_repo}/${_collection}`)
      .then(data => {
          setTableList(data.tables)
      })
      .catch((e) => {
          console.log(e);
    })
  }, [])

  return (
    <div className="p-2">
      <div className="text-xl ">Metric Tables:</div>
      <ul>
        {tableList.map((entry) =>
          <li><Link to={{pathname: `/metrics/${_repo}/${_collection}/${entry}`}}>{entry}</Link></li>
        )}
      </ul>
    </div>
  )
}

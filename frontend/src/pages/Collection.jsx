

import { useParams } from 'react-router-dom'
import { GetCollectionListURLFromRepo } from '../summaries'
import { Link } from "react-router-dom";
import { useState, useEffect } from "react"
import TruncatedText from '../components/TruncatedText'
import TabNav from '../components/TabNav'

import { apiFetch } from '../wrappers'

export default function Collection() {

    const { collection: _collection, encodedRepo: _repo } = useParams()
    const collection = decodeURIComponent(_collection)
    const repo = decodeURIComponent(_repo)

    const [collectionData, setCollectionData] = useState({tracts: [], visits: [], global: []})
    const [plotCounts, setPlotCounts] = useState({})
    const [tractCounts, setTractCounts] = useState({})
    const [visitCounts, setVisitCounts] = useState({})

    useEffect(() => {apiFetch(`/api/v1/summaries/collection/${_repo}/${_collection}`)
        .then(data => {
            setPlotCounts(data.plot_counts)
            setTractCounts(data.tract_counts)
            setVisitCounts(data.visit_counts)
        })
        .catch((e) => {
            console.log(e);
      })
    }, [_repo, _collection])

    const plotNames = Object.keys(plotCounts).sort()
    const tractNumbers = Object.keys(tractCounts).sort()

    const selByDataId = (
                <div className="">
                    <div className="border-0 rounded mr-4 p-4 w-48 float-left">
                        <table className="divide-y">
                        <thead>
                            <tr><td>Tract</td><td>Plot count</td></tr>
                        </thead>
                        <tbody>
                        {tractNumbers.map((tract, n) =>
                            <tr key={n}>
                            <td className="p-1"><Link to={`/tract/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${tract}`}>{tract}</Link></td>
                            <td className="p-1 text-right">{tractCounts[tract]}</td></tr>
                        )}
                        </tbody>
                        </table>
                    </div>

                    <div className="border-0 rounded mr-4 p-4 w-48 float-left">
                        <table className="divide-y">
                        <thead>
                            <tr><td>Visit</td><td>Plot count</td></tr>
                        </thead>
                        <tbody>
                        {Object.keys(visitCounts).map((visit, n) =>
                            <tr key={n}>
                            <td className="p-1"><Link to={`/visit/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${visit}`}>{visit}</Link></td>
                            <td className="p-1 text-right">{visitCounts[visit]}</td></tr>
                        )}
                        </tbody>
                        </table>
                    </div>
                </div>
    )

    const selByPlotName = (
                <div className="">
                    <div className="border-0 rounded mr-2 p-4 float-left">
                        <table className="divide-y">
                        <thead>
                            <tr><td>Plot Type</td><td>Plot count</td></tr>
                        </thead>
                        <tbody>
                        {plotNames.map((plot, n) =>
                            <tr key={n}>
                                <td className="p-1"><Link to={`/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${plot}`}>{plot}</Link></td>
                                <td className="p-1 text-right">{plotCounts[plot]}</td>
                            </tr>
                        )}
                        </tbody>
                        </table>
                    </div>

                </div>
    )


    return (
        <div>
            <div className="text-m m-5"><Link to={`${GetCollectionListURLFromRepo(repo)}/`}>&lt;- Back to collections</Link></div>
            <div className="text-2xl m-5">{collection}</div>

            { "note" in collectionData ? 
                <div className="m-5">
                    <TruncatedText text={collectionData["note"]} length={80} />
                </div>
            : "" }

            <div className="">
                <TabNav panes={[
                    {title: "Select by Plot Name", content: selByPlotName},
                    {title: "Select by Data Id", content: selByDataId},
                ]} />
            </div>

        </div>
    )
}

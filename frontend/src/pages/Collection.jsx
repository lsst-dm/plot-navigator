

import { useParams } from 'react-router-dom'
import { GetCollectionListURLFromRepo } from '../summaries'
import { Link } from "react-router-dom";
import { useState, useEffect } from "react"
import TruncatedText from '../components/TruncatedText'
import TabNav from '../components/TabNav'

export default function Collection() {

    const { collection: _collection, encodedRepo: _repo } = useParams()
    const collection = decodeURIComponent(_collection)
    const repo = decodeURIComponent(_repo)

    const [collectionData, setCollectionData] = useState({tracts: [], visits: [], global: []})

    useEffect(() => {fetch(`http://localhost:8000/api/v1/summaries/${_repo}/${_collection}`)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${r.status}`)
            return response.json()
        })
        .then(data => setCollectionData(data))
        .catch((e) => {
            console.log(e);
      })
    }, [])


    var tractEntries = {}
    Object.entries(collectionData['tracts']).forEach(([plot, plotIdList]) =>  {
        plotIdList.forEach((listEntry) => {
            const tract = JSON.parse(listEntry['dataId'])['tract']
            if(tractEntries[tract]) {
                tractEntries[tract] = 1 + tractEntries[tract]
            } else {
                tractEntries[tract] = 1
            }
        })
    })
    const tractInts = Object.keys(tractEntries).map(x => parseInt(x))
    tractInts.sort((a,b) => a - b)
    const tractKeys = tractInts.map(x => x.toString())

    const classifyDataId = (dataId) => {
        if('tract' in dataId) {
            return 'tract'
        } else if('visit' in dataId) {
            return 'visit'
        } else {
            return 'global'
        }
    }

    var plotEntries = {}
    const allCollectionEntries = [...Object.entries(collectionData['tracts']),
        ...Object.entries(collectionData['visits']),
        ...Object.entries(collectionData['global'])]
    allCollectionEntries.forEach(([plot, plotIdList]) =>  {

        plotEntries[plot] = {category: classifyDataId(plotIdList[0]), count: plotIdList.length}
    })

    const plotKeys = Object.keys(plotEntries)
    plotKeys.sort()

    var visitEntries = {}
    Object.entries(collectionData['visits']).forEach(([plot, plotIdList]) =>  {
        plotIdList.forEach((listEntry) => {
            const visit = JSON.parse(listEntry['dataId'])['visit']
            visitEntries[visit] = visitEntries[visit] ?  visitEntries[visit] + 1 : 1
        })
    })
    const visitInts = Object.keys(visitEntries).map(x => parseInt(x))
    visitInts.sort((a,b) => a - b)
    const visitKeys = visitInts.map(x => x.toString())


    var globalEntries = {}
    Object.entries(collectionData['global']).forEach(([plot, plotIdList]) =>  {

        plotIdList.forEach((listEntry) => {
            if(globalEntries[plot]) {
                globalEntries[plot] = 1 + globalEntries[plot]
            } else {
                globalEntries[plot] = 1
            }

        })
    })


    const selByDataId = (
                <div className="">
                    <div className="border-0 rounded mr-4 p-4 w-48 float-left">
                        <table className="divide-y">
                        <thead>
                            <tr><td>Tract</td><td>Plot count</td></tr>
                        </thead>
                        <tbody>
                        {tractKeys.map((tract, n) =>
                            <tr key={n}>
                            <td className="p-1"><Link to={`/tract/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${tract}`}>{tract}</Link></td>
                            <td className="p-1 text-right">{tractEntries[tract]}</td></tr>
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
                        {visitKeys.map((visit, n) =>
                            <tr key={n}>
                            <td className="p-1"><Link to={`/visit/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${visit}`}>{visit}</Link></td>
                            <td className="p-1 text-right">{visitEntries[visit]}</td></tr>
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
                        {plotKeys.map((plot, n) =>
                            <tr key={n}>
                            <td className="p-1"><Link to={`/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${plot}`}>{plot}</Link></td>
                            <td className="p-1 text-right">{plotEntries[plot].count}</td></tr>
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

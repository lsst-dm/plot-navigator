
import React from 'react';

import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom'
import { useState, useEffect } from "react"

import { apiFetch } from '../wrappers'

import { DataIdSortFunc } from '../components/dataIdFuncs'
import PlotPager from '../components/plotPager'
import PlotDisplay from '../components/plotDisplay'

export default function Tract() {


    const { repo: _repo, collection: _collection, tract } = useParams()
    const repo = decodeURIComponent(_repo)
    const collection = decodeURIComponent(_collection)

    const [plotList, setPlotList] = useState([])

    useEffect(() => {apiFetch(`/api/v1/summaries/tract/${tract}/${_repo}/${_collection}`)
        .then(data => {
            data.sort((a,b) => DataIdSortFunc(JSON.parse(a.dataId), JSON.parse(b.dataId)))
            setPlotList(data)
        })
        .catch((e) => {
            console.log(e);
      })
    }, [tract, _repo, _collection])

    const plotGroupSet = new Set(plotList.map((entry) => entry.name.split('_')[0]))
    const plotGroups = Array(...plotGroupSet)
    plotGroups.sort()

    const findMatchingPlots = (plotList, prefix) => {
        const matchingEntries = plotList.filter((entry) => entry.name.split('_')[0] == prefix)
        matchingEntries.sort()
        return matchingEntries
    }

    return (
        <div>
            <div className="text-m m-5">
                <Link to={`/collection/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}`}>← Back to collection</Link>
            </div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">Tract {tract}</div>
            <div className="">
                {plotGroups.map( (plotGroup, n) =>
                    <div key={n}>
                        <div className="m-8 text-xl font-medium border-b-2 border-black">{plotGroup}_*</div>
                    <PlotPager plotsPerPage={6} plotEntries={
                        findMatchingPlots(plotList, plotGroup).map((entry, n) =>
                            ({dataId: JSON.parse(entry.dataId),
                                plotFn: () => (<PlotDisplay key={n} plotEntry={ ({...entry, repo: repo}) }
                                                showDataId={false} showDatasetType={true} />)
                            }))} 
                            />
                        <div className="clear-both"></div>
                    </div>
                )}
            </div>
        </div>
    )
}

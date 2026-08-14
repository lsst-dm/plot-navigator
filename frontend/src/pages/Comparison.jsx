
import { useState, useEffect } from "react"
import { useLocation, Navigate, useParams, Link } from "react-router-dom"

import { DataIdSortFunc } from '../components/dataIdFuncs'

import DualPlotPager from '../components/dualPlotPager'
import PlotDisplay from '../components/plotDisplay'

import { apiFetch } from '../wrappers'

export default function Comparison() {

    const location = useLocation()

    const { repo: _repo, collection: _collection, plotName: _plotName } = useParams()
    const repo = decodeURIComponent(_repo)
    const repo2 = location.state?.repo2
    const collection = decodeURIComponent(_collection)
    const collection2 = decodeURIComponent(location.state?.collection2)
    const plotName = decodeURIComponent(_plotName)

    const [plotEntries, setPlotEntries] = useState([])
    const [plotEntries2, setPlotEntries2] = useState([])

    useEffect(() => {apiFetch(`/api/v1/summaries/plot/${plotName}/${_repo}/${_collection}`)
        .then(data => {
            data.sort((a,b) => DataIdSortFunc(JSON.parse(a.dataId), JSON.parse(b.dataId)))
            setPlotEntries(data)
        })
        .catch((e) => {
            console.log(e);
      })
    }, [plotName, _repo, _collection])

    useEffect(() => {
        if(!repo2 || !collection2) { return }
        apiFetch(`/api/v1/summaries/plot/${plotName}/${repo2}/${collection2}`)
        .then(data => {
            data.sort((a,b) => DataIdSortFunc(JSON.parse(a.dataId), JSON.parse(b.dataId)))
            setPlotEntries2(data)
        })
        .catch((e) => {
            console.log(e);
      })
    }, [plotName, repo2, collection2])


    const findPlotEntries = (collectionData, plotName)  => {

        const tractEntries = collectionData['tracts']?.[plotName] ?? []
        const visitEntries = collectionData['visits']?.[plotName] ?? []
        const globalEntries = collectionData['global']?.[plotName] ?? []

        return [tractEntries, visitEntries, globalEntries].flat()
    }

    const encodeDataId = (id) => {
        return encodeURIComponent(id.trim())
    }

    /* We want the permalink on when in lightbox but off when in the general display, not sure how
     * to do that yet */
    const plotDisplays = plotEntries.map((entry, n) =>
        ({dataId: JSON.parse(entry.dataId),
            plotFn: () => <PlotDisplay key={n} showPermalink={false}
            plotEntry={ ({...entry, repo: repo, collection: collection,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />})
    )

    const plotDisplays2 = plotEntries2.map((entry, n) =>
        ({dataId: JSON.parse(entry.dataId),
            plotFn: () => <PlotDisplay key={n} showPermalink={false}
            plotEntry={ ({...entry, repo: repo2, collection: collection2,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />})
    )

    return (
        <div>
            <div className="text-m m-5">
                <Link to={`/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${plotName}`}>← Back to Plot</Link>
            </div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <DualPlotPager plotEntriesA={plotDisplays} plotEntriesB={plotDisplays2} collectionA={collection} collectionB={collection2}/>
            </div>
        </div>
    )
}



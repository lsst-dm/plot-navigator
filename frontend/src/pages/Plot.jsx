
import { Link } from "react-router-dom";

// import { GetSummary } from '@/lib/summaries'
import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from "react"

import PlotPager from '../components/plotPager'
import PlotDisplay from '../components/plotDisplay'
import CompareCollectionButton from '../components/compareCollectionButton'
import { DataIdSortFunc } from '../components/dataIdFuncs'

import { apiFetch } from '../wrappers'

export default function Plot() {

    const { repo: _repo, collection: _collection, plotName: _plotName } = useParams()

    const repo = decodeURIComponent(_repo)
    const collection = decodeURIComponent(_collection)
    const plotName = decodeURIComponent(_plotName)

    /*
    const [ searchParams ] = useSearchParams()
    const currentPage = parseInt(searchParams.get("page")) || 1
    */

    const [plotList, setPlotList] = useState([])

    useEffect(() => {apiFetch(`/api/v1/summaries/plot/${plotName}/${_repo}/${_collection}`)
        .then(data => {
            data.sort((a,b) => DataIdSortFunc(JSON.parse(a.dataId), JSON.parse(b.dataId)))
            setPlotList(data)
        })
        .catch((e) => {
            console.log(e);
      })
    }, [plotName, _repo, _collection])


    const encodeDataId = (id) => {
        return encodeURIComponent(id.trim())
    }

    /* We want the permalink on when in lightbox but off when in the general display, not sure how
     * to do that yet */
    const plotDisplays = plotList.map((entry, n) =>
        ({dataId: JSON.parse(entry.dataId),
            plotFn: (showMouseover = false) => (
            <PlotDisplay key={n} showPermalink={false} showMouseover={showMouseover} plotEntry={ ({...entry, repo: repo,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />
        )})
    )

    return (
        <div>
            <div className="float-left">
                <div className="text-m m-5"><Link to={`/collection/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}`}>← Back to collection</Link></div>
                <div className="text-2xl m-5">{collection}</div>
                <div className="text-2xl m-5">{plotName}</div>
            </div>
            <div className="float-right">
                <CompareCollectionButton
                    baseURL={`/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}`}
                    />
            </div>
            <div className="clear-both"></div>
            <div className="">
                <PlotPager plotEntries={plotDisplays}/>
            </div>
        </div>
    )
}



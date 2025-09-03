
import React from 'react';
import Link from 'next/link'

import { GetSummary } from '@/lib/summaries'
import { DataIdSortFunc } from '@/lib/dataIdFuncs'

import DualPlotPager from '@/components/dualPlotPager'
import PlotDisplay from '@/components/plotDisplay'

export const revalidate = 180

export default async function Collection({params, searchParams}) {


    const findPlotEntries = (collectionData, plotName)  => {

        const tractEntries = collectionData['tracts']?.[plotName] ?? []
        const visitEntries = collectionData['visits']?.[plotName] ?? []
        const globalEntries = collectionData['global']?.[plotName] ?? []

        return [tractEntries, visitEntries, globalEntries].flat()
    }

    const repo = decodeURIComponent(params['repo'])
    const repo2 = decodeURIComponent(params['repo2'])
    const collection = decodeURIComponent(params['collection'])
    const collection2 = decodeURIComponent(params['collection2'])
    const plotName = decodeURIComponent(params['plotName'])

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1

    const collectionData = await GetSummary(repo, collection)
    const collectionData2 = await GetSummary(repo2, collection2)


    const plotEntries = findPlotEntries(collectionData, plotName)

    const plotEntries2 = findPlotEntries(collectionData2, plotName)

    const encodeDataId = (id) => {
        return encodeURIComponent(id.trim())
    }

    /* We want the permalink on when in lightbox but off when in the general display, not sure how
     * to do that yet */
    const plotDisplays = plotEntries.map((entry, n) => 
        ({dataId: JSON.parse(entry.dataId), plot: <PlotDisplay key={n} showPermalink={false} plotEntry={ ({...entry, repo: repo,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />})
    )

    const plotDisplays2 = plotEntries2.map((entry, n) => 
        ({dataId: JSON.parse(entry.dataId), plot: <PlotDisplay key={n} showPermalink={false} plotEntry={ ({...entry, repo: repo2,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />})
    )

    return (
        <div>
            <div className="text-m m-5"><Link href={`/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${plotName}`}>&lt;- Back to Plot</Link></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <DualPlotPager plotEntriesA={plotDisplays} plotEntriesB={plotDisplays2} collectionA={collection} collectionB={collection2}/>
            </div>
        </div>
    )
}



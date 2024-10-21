
import React from 'react';
import Link from 'next/link'

import { GetSummary } from '@/lib/summaries'

import PlotPager from '@/components/plotPager'
import PlotDisplay from '@/components/plotDisplay'

export const revalidate = 180

export default async function Collection({params, searchParams}) {


    const findPlotEntries = (collection, plotName)  => {

        const tractEntries = collectionData['tracts']?.[plotName] ?? []
        const visitEntries = collectionData['visits']?.[plotName] ?? []
        const globalEntries = collectionData['global']?.[plotName] ?? []

        return [tractEntries, visitEntries, globalEntries].flat()
    }

    const repo = decodeURIComponent(params['repo'])
    const collection = decodeURIComponent(params['collection'])
    const plotName = decodeURIComponent(params['plotName'])

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1

    const collectionData = await GetSummary(repo, collection)

    const plotEntries = findPlotEntries(collectionData, plotName)

    const encodeDataId = (id) => {
       /* return encodeURIComponent(JSON.stringify(JSON.parse(id.trim()))) */
        return encodeURIComponent(id.trim())
    }

    /* We want the permalink on when in lightbox but off when in the general display, not sure how
     * to do that yet */
    const plotDisplays = plotEntries.map((entry, n) => 
        (<PlotDisplay key={n} showPermalink={false} plotEntry={ ({...entry, repo: repo,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />))

    return (
        <div>
            <div className="text-m m-5"><Link href={`/collection/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}`}>&lt;- Back to collection</Link></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <PlotPager plotEntries={plotDisplays}/>
            </div>
        </div>
    )
}



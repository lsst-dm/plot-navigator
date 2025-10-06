
import React from 'react';
import Link from 'next/link'

import { GetSummary } from '@/lib/summaries'

import PlotPager from '@/components/plotPager'
import PlotDisplay from '@/components/plotDisplay'
import CompareCollectionButton from '@/components/compareCollectionButton'
import { DataIdSortFunc } from '@/lib/dataIdFuncs'

import {ListSummaries } from '@/lib/summaries'

export const revalidate = 180

export default async function Collection({params, searchParams}) {

    /* SummaryRefs = [{repo: repo, collection: collection, filename: filename, lastModified: time}] */
    const summaryRefs = await ListSummaries()

    const findPlotEntries = (collection, plotName)  => {

        const tractEntries = collectionData['tracts']?.[plotName] ?? []
        const visitEntries = collectionData['visits']?.[plotName] ?? []
        const globalEntries = collectionData['global']?.[plotName] ?? []

        return [tractEntries, //tractEntries,tractEntries,tractEntries,tractEntries,tractEntries,tractEntries,
            visitEntries, globalEntries].flat()
    }

    const repo = decodeURIComponent(params['repo'])
    const collection = decodeURIComponent(params['collection'])
    const plotName = decodeURIComponent(params['plotName'])

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1

    const collectionData = await GetSummary(repo, collection)

    const plotEntries = findPlotEntries(collectionData, plotName).sort((a,b) => DataIdSortFunc(JSON.parse(a.dataId), JSON.parse(b.dataId)))

    const encodeDataId = (id) => {
        return encodeURIComponent(id.trim())
    }

    /* We want the permalink on when in lightbox but off when in the general display, not sure how
     * to do that yet */
    const plotDisplays = plotEntries.map((entry, n) => 
        ({dataId: JSON.parse(entry.dataId), plot: <PlotDisplay key={n} showPermalink={false} plotEntry={ ({...entry, repo: repo,
        permalink: `/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}/${encodeDataId(entry.dataId)}`}) } />})
    )

    return (
        <div>
            <div className="float-left">
                <div className="text-m m-5"><Link href={`/collection/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}`}>&lt;- Back to collection</Link></div>
                <div className="text-2xl m-5">{collection}</div>
                <div className="text-2xl m-5">{plotName}</div>
            </div>
            <div className="float-right">
                <CompareCollectionButton baseURL={`${process.env.BASE_URL ?? ''}/plot/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}/${encodeURIComponent(plotName)}`} collectionOptions={summaryRefs} />
            </div>
            <div className="clear-both"></div>
            <div className="">
                <PlotPager plotEntries={plotDisplays}/>
            </div>
        </div>
    )
}



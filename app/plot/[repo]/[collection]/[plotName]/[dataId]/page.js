
import React from 'react';
import Link from 'next/link'

const util = require('util');

import { GetSummary } from '@/lib/summaries'

import PlotPager from '@/components/plotPager'
import PlotDisplay from '@/components/plotDisplay'

export const revalidate = 180

export default async function Collection({params}) {


    const findPlotEntries = (collection, plotName)  => {

        const tractEntries = collectionData['tracts']?.[plotName] ?? []
        const visitEntries = collectionData['visits']?.[plotName] ?? []
        const globalEntries = collectionData['global']?.[plotName] ?? []

        return [tractEntries, visitEntries, globalEntries].flat()
    }

    const repo = decodeURIComponent(params['repo'])
    const collection = decodeURIComponent(params['collection'])
    const plotName = decodeURIComponent(params['plotName'])
    const targetDataId = JSON.parse(decodeURIComponent(params['dataId']))

    const collectionData = await GetSummary(repo, collection)

    const allPlotEntries = findPlotEntries(collectionData, plotName)

    const selPlotEntries = allPlotEntries.filter((entry) => util.isDeepStrictEqual(JSON.parse(entry.dataId), targetDataId))

    return (
        <div>
            <div className="text-m m-5"><Link href={`/collection/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}`}>&lt;- Back to collection</Link></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="w-3/4">
                {selPlotEntries.length > 0 ? 
                    <PlotDisplay plotEntry={({...selPlotEntries[0], repo: repo})} />
                : "No plots found" }
            </div>
        </div>
    )
}



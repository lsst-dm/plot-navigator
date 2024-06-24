
import React from 'react';
import Link from 'next/link'

import { GetSummary } from '../../../summaries'

import PlotPager from '../../../plotPager'
import PlotDisplay from '../../../plotDisplay'

export const revalidate = 180

export default async function Collection({params, searchParams}) {


    const findPlotEntries = (collection, plotName)  => {

        const tractEntries = collectionData['tracts']?.[plotName] ?? []
        const visitEntries = collectionData['visit']?.[plotName] ?? []
        const globalEntries = collectionData['global']?.[plotName] ?? []

        return [tractEntries, visitEntries, globalEntries].flat()
    }

    const collection = params['path'].join("/")
    const plotName = params['plotName']

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1

    const collectionData = await GetSummary("embargo", collection)

    const plotEntries = findPlotEntries(collectionData, plotName)

    const plotDisplays = plotEntries.map((entry, n) => (<PlotDisplay key={n} plotEntry={entry} />))

    return (
        <div>
            <div className="text-m m-5"><Link href={`/collection/${collection}`}>&lt;- Back to collection</Link></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <PlotPager plotEntries={plotDisplays}/>
            </div>
        </div>
    )
}



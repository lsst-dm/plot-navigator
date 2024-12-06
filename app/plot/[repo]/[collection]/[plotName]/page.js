
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

    const dataIdSortFunc = (a, b) => {
        const dataIdA = JSON.parse(a.dataId)
        const dataIdB = JSON.parse(b.dataId)
        const bandsOrder = ['u', 'g', 'r', 'i', 'z', 'y']

        if('tract' in dataIdA && 'tract' in dataIdB) {
            const tract_comparision = dataIdA.tract - dataIdB.tract
            if(tract_comparision != 0) {
                return tract_comparision
            }
        }

        if('visit' in dataIdA && 'visit' in dataIdB) {
            const visit_comparison = dataIdA.visit - dataIdB.visit
            if(visit_comparison != 0) {
                return visit_comparison
            }
        }

        if('band' in dataIdA && 'band' in dataIdB) {
            const band_comparison = bandsOrder.indexOf(dataIdA.band) - bandsOrder.indexOf(dataIdB.band)
            if(band_comparison != 0) {
                return band_comparison
            }
        }

        if('physical_filter' in dataIdA && 'physical_filter' in dataIdB) {
            const physical_filter_comparison = bandsOrder.indexOf(dataIdA.physical_filter[0]) - bandsOrder.indexOf(dataIdB.physical_filter[0])
            if(physical_filter_comparison != 0) {
                return physical_filter_comparison
            }
        }

        /* if none of these dimensions are available */
        return 0
    }

    const plotEntries = findPlotEntries(collectionData, plotName).sort(dataIdSortFunc)

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
            <div className="text-m m-5"><Link href={`/collection/${encodeURIComponent(repo)}/${encodeURIComponent(collection)}`}>&lt;- Back to collection</Link></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <PlotPager plotEntries={plotDisplays}/>
            </div>
        </div>
    )
}



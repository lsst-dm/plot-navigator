
import React from 'react';
import Link from 'next/link'

import { GetSummary } from '../../../summaries'

import PlotPager from '../../../plotPager'
import PlotDisplay from '../../../plotDisplay'

export const revalidate = 180


export default async function Collection({params, searchParams}) {


    const collection = params['path'].join("/")
    const tract = params['tract']

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1
    const collectionData = await GetSummary("embargo", collection)

    var plotEntries = {}
    Object.entries(collectionData['tracts']).forEach(([plot, plotIdList]) =>  {

        plotIdList.forEach((plotEntry) => {
            const dataId = JSON.parse(plotEntry['dataId'])
            const thisTract = dataId['tract']
            if(thisTract == tract) {
                if(plotEntries[plot]) {
                    plotEntries[plot] = [plotEntry, ...plotEntries[plot]]
                } else {
                    plotEntries[plot] = [plotEntry]
                }

            }
        })
    })

    const plotGroupSet = new Set(Object.keys(plotEntries).map(plotName => plotName.split('_')[0]))
    const plotGroups = Array(...plotGroupSet)
    plotGroups.sort()

    const findMatchingPlots = (plotEntries, prefix) => {
        const matchingNames = Object.keys(plotEntries).filter((plotName) => plotName.split('_')[0] == prefix)
        matchingNames.sort()

        return matchingNames.map(name => plotEntries[name]).flat()
    }

    return (
        <div>
            <div className="text-m m-5"><Link href={`/collection/${collection}`}>&lt;- Back to collection</Link></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">Tract {tract}</div>
            <div className="">
                {plotGroups.map( (plotGroup, n) =>
                    <div key={n}>
                        <div className="m-8 text-xl font-medium border-b-2 border-black">{plotGroup}_*</div>
                    <PlotPager plotsPerPage={6} plotEntries={findMatchingPlots(plotEntries, plotGroup).map((entry, n) =>
                            <PlotDisplay key={n} plotEntry={entry} showDataId={false} />)}  />
                        <div className="clear-both"></div>
                    </div>
                )}
            </div>
        </div>
    )
}

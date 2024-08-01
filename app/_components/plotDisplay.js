
import React from 'react';

export default async function PlotDisplay({plotEntry, showDataId = true, showDatasetType = false}) {

    const {instrument, skymap, ...dataId} = JSON.parse(plotEntry.dataId)
    const uuid = plotEntry.id
    const repo = plotEntry.repo
    const datasetType = plotEntry.datasetType ?? ''

    const splitType = [...datasetType.matchAll(/[a-zA-Z0-9]*(_|$)/g)].map((x) => x[0])
    const typeWithWbr = splitType.join('\u00ad')
    /*
    const typeWithWbr = splitType.map((x) => [x, <wbr/>]).flat()
    console.log(typeWithWbr)
    */

    const dataIdString = Object.entries(dataId).map(([k,v]) => `${k}: ${v}`).join(', ')

    return (
        <div className="m-2">
            { showDataId ? <div className="text-1xl my-5 text-wrap">{dataIdString}</div> : "" }
            { showDatasetType ? <div className="text-1xl my-5 text-wrap">{typeWithWbr}</div> : "" }
            <img src={`${process.env.BASE_URL ?? '' }/image/${encodeURIComponent(repo)}/${uuid}`} />
        </div>

    )
}

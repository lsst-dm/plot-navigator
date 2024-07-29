
import React from 'react';

export default async function PlotDisplay({plotEntry, showDataId = true}) {

    const dataId = plotEntry.dataId
    const uuid = plotEntry.id
    const repo = plotEntry.repo

    return (
        <div>
            { showDataId ? <div className="text-1xl my-5">{dataId}</div> : "" }
            <img src={`${process.env.BASE_URL ?? '' }/image/${encodeURIComponent(repo)}/${uuid}`} />
        </div>

    )
}


import React from 'react';

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")

import PlotPager from '../../../plotPager'
import PlotDisplay from '../../../plotDisplay'

export default async function Collection({params, searchParams}) {


    const collection = params['path'].join("/")
    const plotName = params['plotName']

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1

    const gzData = await readFile(`data/collection_${encodeURIComponent(collection)}.json.gz`)
    const collectionData = JSON.parse(zlib.gunzipSync(gzData))

    const plotEntries = collectionData['tracts']?.[plotName] ?? []

    const plotDisplays = plotEntries.map((entry, n) => (<PlotDisplay key={n} plotEntry={entry} />))

    return (
        <div>
            <div className="text-m m-5"><a href={`/collection/${collection}`}>&lt;- Back to collection</a></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <PlotPager plotEntries={plotDisplays}/>
            </div>
        </div>
    )
}



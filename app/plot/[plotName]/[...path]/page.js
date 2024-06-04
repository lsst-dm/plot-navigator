
import React from 'react';

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")


export default async function Collection({params}) {


    const collection = params['path'].join("/")
    const plotName = params['plotName']

    const gzData = await readFile(`data/collection_${encodeURIComponent(collection)}.json.gz`)
    const collectionData = JSON.parse(zlib.gunzipSync(gzData))

    const plotEntries = collectionData['tracts']?.[plotName] ?? []

    return (
        <div>
            <div className="text-m m-5"><a href={`/collection/${collection}`}>&lt;- Back to collection</a></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                {plotEntries.map((plotEntry, n) =>
                    <div key={n} className="w-96 p-5 m-5 float-left">
                        <div className="text-1xl my-5">{plotEntry.dataId}</div>
                        <img src="/test_plot.png" />
                    </div>
                )}
            </div>
        </div>
    )
}



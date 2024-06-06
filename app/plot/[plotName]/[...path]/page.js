
import React from 'react';

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")

import PlotPager from '../../../plotPager'

export default async function Collection({params, searchParams}) {


    const collection = params['path'].join("/")
    const plotName = params['plotName']

    const currentPage = parseInt(searchParams?.page) ? parseInt(searchParams?.page) : 1
    console.log(searchParams)

    const gzData = await readFile(`data/collection_${encodeURIComponent(collection)}.json.gz`)
    const collectionData = JSON.parse(zlib.gunzipSync(gzData))

    const plotEntries = collectionData['tracts']?.[plotName] ?? []
    /* https://usdf-rsp-dev.slac.stanford.edu/api/butler/repo/embargo/v1/get_file/5bc72dcd-cc33-43b0-a280-7f3cebbc8546
     *
     * artifact.file_info.0.url
     */


    return (
        <div>
            <div className="text-m m-5"><a href={`/collection/${collection}`}>&lt;- Back to collection</a></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">{plotName}</div>
            <div className="">
                <PlotPager plotEntries={plotEntries} currentPage={currentPage}/>
            </div>
        </div>
    )
}



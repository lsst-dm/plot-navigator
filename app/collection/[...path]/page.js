
import React from 'react';

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")


export default async function Collection({params}) {


    const collection = params['path'].join("/")

    const gzData = await readFile(`data/collection_${encodeURIComponent(collection)}.json.gz`)
    const collectionData = JSON.parse(zlib.gunzipSync(gzData))

    var tractEntries = {}
    Object.entries(collectionData['tracts']).forEach(([plot, dataIdList]) =>  {
        dataIdList.forEach((dataIdString) => {
            console.log(dataIdString)
            const tract = JSON.parse(dataIdString)['tract']
            if(tractEntries[tract]) {
                tractEntries[tract] = 1 + tractEntries[tract]
            } else {
                tractEntries[tract] = 1
            }
        })
    })


    /* {"tracts": {"objectTableCore_xPerpPSFP_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_yPerpPSF_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_yPerpCModel_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_i_e1Diff_ScatterPlotWithTwoHists": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_wPerpCModel_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract:
     */

    return (
        <div>
            <div className="text-m m-5"><a href="/collections">&lt;- Back to collections</a></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="border-2 rounded m-4 p-4 w-48">
                <table className="divide-y">
                <thead>
                    <tr><td>Tract</td><td>Plot count</td></tr>
                </thead>
                <tbody>
                {Object.entries(tractEntries).map(([tract, count], n) => 
                    <tr key={n}>
                    <td className="p-1">{tract}</td>
                    <td className="p-1 text-right">{count}</td></tr>
                )}
                </tbody>
                </table>
            </div>
        </div>
    )
}

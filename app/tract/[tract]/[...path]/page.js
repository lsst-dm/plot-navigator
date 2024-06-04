
import React from 'react';

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")


export default async function Collection({params}) {


    const collection = params['path'].join("/")
    const tract = params['tract']

    const gzData = await readFile(`data/collection_${encodeURIComponent(collection)}.json.gz`)
    const collectionData = JSON.parse(zlib.gunzipSync(gzData))

    var plotEntries = {}
    Object.entries(collectionData['tracts']).forEach(([plot, plotIdList]) =>  {

        plotIdList.forEach((plotEntry) => {
            const dataId = JSON.parse(plotEntry['dataId'])
            const thisTract = dataId['tract']
            if(thisTract == tract) {
                if(plotEntries[plot]) {
                    plotEntries[plot] = [dataId, ...plotEntries[plot]]
                } else {
                    plotEntries[plot] = [dataId]
                }

            }
        })
    })


    /* {"tracts": {"objectTableCore_xPerpPSFP_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_yPerpPSF_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_yPerpCModel_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_i_e1Diff_ScatterPlotWithTwoHists": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_wPerpCModel_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract:
     */

    return (
        <div>
            <div className="text-m m-5"><a href={`/collection/${collection}`}>&lt;- Back to collection</a></div>
            <div className="text-2xl m-5">{collection}</div>
            <div className="text-2xl m-5">Tract {tract}</div>
            <div className="">
                {Object.entries(plotEntries).map(([plot, dataIds], n) => 
                    <div key={n} className="w-96 p-5 m-5 float-left">
                        <div className="text-1xl my-5">{plot}</div>
                        <img src="/test_plot.png" />
                    </div>
                )}
            </div>
        </div>
    )
}

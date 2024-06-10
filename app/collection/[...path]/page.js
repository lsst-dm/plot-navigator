
import React from 'react';

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")

import SelectionDropdown from '../../selectionDropdown'

export default async function Collection({params}) {


    const collection = params['path'].join("/")

    const gzData = await readFile(`data/collection_${encodeURIComponent(collection)}.json.gz`)
    const collectionData = JSON.parse(zlib.gunzipSync(gzData))

    var tractEntries = {}
    Object.entries(collectionData['tracts']).forEach(([plot, plotIdList]) =>  {
        plotIdList.forEach((listEntry) => {
            const tract = JSON.parse(listEntry['dataId'])['tract']
            if(tractEntries[tract]) {
                tractEntries[tract] = 1 + tractEntries[tract]
            } else {
                tractEntries[tract] = 1
            }
        })
    })
    const tractInts = Object.keys(tractEntries).map(x => parseInt(x))
    tractInts.sort((a,b) => a - b)
    const tractKeys = tractInts.map(x => x.toString())

    var plotEntries = {}
    Object.entries(collectionData['tracts']).forEach(([plot, plotIdList]) =>  {

        plotIdList.forEach((listEntry) => {
            if(plotEntries[plot]) {
                plotEntries[plot] = 1 + plotEntries[plot]
            } else {
                plotEntries[plot] = 1
            }

        })
    })

    const plotKeys = Object.keys(plotEntries)
    plotKeys.sort()

    var visitEntries = {}
    Object.entries(collectionData['visits']).forEach(([plot, plotIdList]) =>  {
        plotIdList.forEach((listEntry) => {
            const visit = JSON.parse(listEntry['dataId'])['visit']
            if(visitEntries[visit]) {
               visitEntries[visit] = 1 + visitEntries[visit]
            } else {
               visitEntries[visit] = 1
            }
        })
    })
    const visitInts = Object.keys(visitEntries).map(x => parseInt(x))
    visitInts.sort((a,b) => a - b)
    const visitKeys = visitInts.map(x => x.toString())


    var globalEntries = {}
    Object.entries(collectionData['global']).forEach(([plot, plotIdList]) =>  {

        plotIdList.forEach((listEntry) => {
            if(globalEntries[plot]) {
                globalEntries[plot] = 1 + globalEntries[plot]
            } else {
                globalEntries[plot] = 1
            }

        })
    })

    const globalKeys = Object.keys(globalEntries)
    globalKeys.sort()


    /* {"tracts": {"objectTableCore_xPerpPSFP_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_yPerpPSF_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_yPerpCModel_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_i_e1Diff_ScatterPlotWithTwoHists": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract: 9813}"], "objectTableCore_wPerpCModel_ColorColorFitPlot": ["{skymap: 'hsc_rings_v1', tract: 9615}", "{skymap: 'hsc_rings_v1', tract: 9697}", "{skymap: 'hsc_rings_v1', tract:
     */

    return (
        <div>
            <div className="text-m m-5"><a href="/collections">&lt;- Back to collections</a></div>
            <div className="text-2xl m-5">{collection}</div>

            <div className="">
                <SelectionDropdown title="Tract Plots"
                contents={
                    <div className="py-4">
                        <div className="border-2 rounded mr-4 p-4 w-48 float-left">
                            <table className="divide-y">
                            <thead>
                                <tr><td>Tract</td><td>Plot count</td></tr>
                            </thead>
                            <tbody>
                            {tractKeys.map((tract, n) =>
                                <tr key={n}>
                                <td className="p-1"><a href={`/tract/${tract}/${collection}`}>{tract}</a></td>
                                <td className="p-1 text-right">{tractEntries[tract]}</td></tr>
                            )}
                            </tbody>
                            </table>
                        </div>

                        <div className="border-2 rounded mr-2 p-4 float-left">
                            <table className="divide-y">
                            <thead>
                                <tr><td>Per-Tract Plots</td><td>Plot count</td></tr>
                            </thead>
                            <tbody>
                            {plotKeys.map((plot, n) =>
                                <tr key={n}>
                                <td className="p-1"><a href={`/plot/${plot}/${collection}`}>{plot}</a></td>
                                <td className="p-1 text-right">{plotEntries[plot]}</td></tr>
                            )}
                            </tbody>
                            </table>
                        </div>
                    </div>} />

                <SelectionDropdown title="Visit Plots"
                contents={
                    <div className="py-4">
                        <div className="border-2 rounded mr-4 p-4 w-48 float-left">
                            <table className="divide-y">
                            <thead>
                                <tr><td>Visit</td><td>Plot count</td></tr>
                            </thead>
                            <tbody>
                            {visitKeys.map((visit, n) =>
                                <tr key={n}>
                                <td className="p-1"><a href={`/visit/${visit}/${collection}`}>{visit}</a></td>
                                <td className="p-1 text-right">{visitEntries[visit]}</td></tr>
                            )}
                            </tbody>
                            </table>
                        </div>

                    </div>} />




                <SelectionDropdown title="Global Plots"
                contents={
                    <div className="py-4">

                        <div className="border-2 rounded mr-2 p-4 float-left">
                            <table className="divide-y">
                            <thead>
                                <tr><td>Global Plots</td><td>Plot count</td></tr>
                            </thead>
                            <tbody>
                            {globalKeys.map((plot, n) =>
                                <tr key={n}>
                                <td className="p-1"><a href={`/plot/${plot}/${collection}`}>{plot}</a></td>
                                <td className="p-1 text-right">{globalEntries[plot]}</td></tr>
                            )}
                            </tbody>
                            </table>
                        </div>
                    </div>} />

            </div>

        </div>
    )
}

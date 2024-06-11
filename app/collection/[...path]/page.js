
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

    const classifyDataId = (dataId) => {
        if('tract' in dataId) {
            return 'tract'
        } else if('visit' in dataId) {
            return 'visit'
        } else {
            return 'global'
        }
    }

    var plotEntries = {}
    const allCollectionEntries = [...Object.entries(collectionData['tracts']),
        ...Object.entries(collectionData['visits']),
        ...Object.entries(collectionData['global'])]
    allCollectionEntries.forEach(([plot, plotIdList]) =>  {

        plotIdList.forEach((listEntry) => {
            const entry = plotEntries[plot]
            if(entry) {
                plotEntries[plot] = {count: entry['count'] + 1, ...entry}
            } else {
                plotEntries[plot] = {category: classifyDataId(listEntry), count: 1}
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


    return (
        <div>
            <div className="text-m m-5"><a href="/collections">&lt;- Back to collections</a></div>
            <div className="text-2xl m-5">{collection}</div>

            <div className="">
                <SelectionDropdown title="By Data ID"
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

                <SelectionDropdown title="By Plot Type"
                contents={
                    <div className="py-4">
                        <div className="border-2 rounded mr-2 p-4 float-left">
                            <table className="divide-y">
                            <thead>
                                <tr><td>Plot Type</td><td>Plot count</td></tr>
                            </thead>
                            <tbody>
                            {plotKeys.map((plot, n) =>
                                <tr key={n}>
                                <td className="p-1"><a href={`/plot/${plot}/${collection}`}>{plot}</a></td>
                                <td className="p-1 text-right">{plotEntries[plot].count}</td></tr>
                            )}
                            </tbody>
                            </table>
                        </div>

                    </div>} />


            </div>

        </div>
    )
}

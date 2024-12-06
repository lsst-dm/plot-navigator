
'use client'

import React from 'react';
import { useState, useEffect } from 'react'
import BandSelector from './bandSelector.js'

export default function PlotPager({plotEntries, plotsPerPage = 10}) {

    const [selectedBands, setSelectedBands] = useState({u: true, g: true, r: true, i: true, z: true, y: true})

    const [currentPage, setCurrentPage] = useState(1)
    const [inLightbox, setInLightbox] = useState(false)
    const [displayedEntry, setDisplayedEntry] = useState(0)

    const getFilteredEntries = () => {

        const indexedEntries = plotEntries.map((entry, n) => ({dataId: entry.dataId, plot: entry.plot, index: n}))
        return indexedEntries.filter(
                    (indexedEntry) => selectedBands[indexedEntry.dataId.band] || !('band' in indexedEntry.dataId) )
    }

    const totalPages = () => {
        return Math.ceil(getFilteredEntries().length/plotsPerPage)
    }

    const onBandUpdated = (band, value) => {
        setSelectedBands({...selectedBands, [band]: event.target.checked})
    }

    useEffect(() => {
        if(currentPage > totalPages()) {
            setCurrentPage(totalPages())
        }
        if(currentPage == 0 && totalPages() > 0) {
            setCurrentPage(1)
        }
    }, [selectedBands])

    const displayBandSelector = () => {
        const dimensions = new Set(plotEntries.map((entry) => Object.keys(entry.dataId)).flat())
        return (dimensions.has('band'))
    }

    const previousPage = () => {
        if(currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const nextPage = () => {
        if(currentPage < totalPages()) {
            setCurrentPage(currentPage + 1)
        }
    }

    const showLightboxEntry = (entry)  => {
        setDisplayedEntry(entry)
        setInLightbox(true)
    }

    const exitLightbox = ()  => {
        setInLightbox(false)
    }
    const doNothing = (e)  => {
        e.stopPropagation();
    }

    const advanceLeft = (e) => {
        e.stopPropagation();
        if(displayedEntry > 0) {
            setDisplayedEntry(displayedEntry - 1)
        }
    }

    const advanceRight = (e) => {
        e.stopPropagation();
        if(displayedEntry < (plotEntries.length  - 1)) {
            setDisplayedEntry(displayedEntry + 1)
        }
    }


    const getSlice = (currentPage) => {

        return getFilteredEntries().slice((currentPage - 1) * plotsPerPage, currentPage * plotsPerPage)
    }


    return (
        <div>
            <div className="grid grid-cols-3">
                <div></div>
                <div className="flex flex-row items-center justify-center">
                    <div className="m-3">
                        { currentPage > 1 ? <button className="p-2 rounded-md text-white bg-sky-600" onClick={previousPage}>Prev</button> :
                            <div>Prev</div> }
                        </div>
                    <div className="m-3">Page {currentPage}/{totalPages()}</div>
                    <div className="m-3">
                        { currentPage < totalPages() ? <button className="p-2 rounded-md text-white bg-sky-600" onClick={nextPage}>Next</button> :
                            <div>Next</div> }
                    </div>
                </div>
                <div className="m-2">
                    { displayBandSelector() ? <BandSelector selectedBands={selectedBands} onBandUpdated={onBandUpdated} /> : "" }
                </div>
            </div>
            <div className="flex flex-row flex-wrap justify-center">
                {getSlice(currentPage).map((indexedEntry, n) =>
                    <div key={n} className=" w-[28rem] p-1 m-0" onClick={() => showLightboxEntry(indexedEntry.index)}>
                        {indexedEntry.plot}
                    </div>
                )}
            </div>
            { inLightbox ?
                <div className="fixed top-0 left-0 w-screen h-screen bg-slate-500/75" onClick={exitLightbox}>
                    <div className="h-12"></div>
                    <div className="w-1/4 float-left h-1">
                        {displayedEntry > 0 ?
                            <div className="float-right flex items-center justify-center m-8 h-64 w-16 bg-indigo-100 hover:bg-indigo-600 hover:cursor-pointer" onClick={advanceLeft}>
                                <div>&lt;&lt;</div>
                            </div>
                        : "" }
                    </div>
                    <div className="w-1/2 float-left bg-white" onClick={doNothing}>
                        {plotEntries[displayedEntry].plot}
                    </div>
                    <div className="w-1/4 float-left">
                        {displayedEntry < (plotEntries.length  - 1) ?
                            <div className="flex items-center justify-center m-8 h-64 w-16 bg-indigo-100 hover:bg-indigo-600 hover:cursor-pointer" onClick={advanceRight}>
                                <div>&gt;&gt;</div>
                            </div>
                        : "" }
                    </div>
                </div>
            : ""}
        </div>
    )

}

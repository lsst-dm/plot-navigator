
'use client'

import React from 'react';
import { useState } from 'react'

export default function PlotPager({plotEntries, plotsPerPage = 10}) {


    const [currentPage, setCurrentPage] = useState(1)
    const [inLightbox, setInLightbox] = useState(false)
    const [displayedEntry, setDisplayedEntry] = useState(0)

    const totalPages = Math.ceil(plotEntries.length/plotsPerPage)


    const previousPage = () => {
        if(currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const nextPage = () => {
        if(currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const showLightboxEntry = (entry)  => {
        console.log("showLightboxEntry")
        console.log(entry)
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

    return (
        <div>
            <div className="flex flex-row justify-center">
                <div className="m-3">
                    { currentPage > 1 ? <button className="p-2 rounded-md text-white bg-sky-600" onClick={previousPage}>Prev</button> :
                        <div>Prev</div> }
                    </div>
                <div className="m-3">Page {currentPage}/{totalPages}</div>
                <div className="m-3">
                    { currentPage < totalPages ? <button className="p-2 rounded-md text-white bg-sky-600" onClick={nextPage}>Next</button> :
                        <div>Next</div> }
                    </div>
            </div>
            {plotEntries.slice((currentPage - 1) * plotsPerPage, currentPage * plotsPerPage).map((plotEntry, n) =>
                <div key={n} className="w-[28rem] p-1 m-0 float-left" onClick={() => showLightboxEntry(n)}>
                    {plotEntry}
                </div>
            )}
            { inLightbox ?
                <div className="fixed top-0 left-0 w-screen h-screen bg-slate-500/75" onClick={exitLightbox}>
                    <div className="h-32"></div>
                    <div className="w-1/4 float-left h-1">
                        {displayedEntry > 0 ?
                            <div className="float-right flex items-center justify-center m-8 h-64 w-16 bg-indigo-100 hover:bg-indigo-600 hover:cursor-pointer" onClick={advanceLeft}>
                                <div>&lt;&lt;</div>
                            </div>
                        : "" }
                    </div>
                    <div className="w-1/2 float-left" onClick={doNothing}>
                        {plotEntries[displayedEntry]}
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

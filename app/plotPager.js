
'use client'

import React from 'react';
import { useState } from 'react'

export default function PlotPager({plotEntries, plotsPerPage = 10}) {


    const [currentPage, setCurrentPage] = useState(1)

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
                plotEntry
            )}
        </div>
    )

}

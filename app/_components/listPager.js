

'use client'

import Link from 'next/link'
import React from 'react';
import { useState } from 'react'

export default function ListPager({listEntries, entriesPerPage = 10, showRepo = true}) {

    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = () => {
        return Math.ceil(listEntries.length/entriesPerPage)
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

    const getSlice = (currentPage) => {

        return listEntries.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
    }
    const cellClassNames = "px-2 py-3"

    return (
        <div>
        <div className="border-2 rounded px-2 inline-block my-0 " >
            <table className="divide-y">
            <thead>
                <tr>
                    <td className={cellClassNames}>Collection</td>
                    { showRepo ?
                        <td className={cellClassNames}>Repo</td>
                    : ""}
                    <td className={`text-right ${cellClassNames}`}>Last Updated</td>
                </tr>
            </thead>
            <tbody>
                {getSlice(currentPage).map((summary, n) =>
                (<tr key={n}><td className={cellClassNames}><Link href={`/collection/${encodeURIComponent(summary.repo)}/${encodeURIComponent(summary.collection)}`}>{summary.collection}</Link></td>
                    { showRepo ?
                     <td className={`${cellClassNames}`}>{summary.repo}</td>
                    : "" }
                     <td className={`text-right ${cellClassNames}`}>{summary.lastModified.toDateString()}</td>
                    </tr>))}
            </tbody>
            </table>

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
        </div>
        </div>
    )

}

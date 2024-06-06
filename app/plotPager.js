
import React from 'react';
import Link from 'next/link'

import PlotDisplay from './plotDisplay'

export default async function PlotPager({plotEntries, currentPage, showDataId = true, plotsPerPage = 10}) {


    const totalPages = Math.ceil(plotEntries.length/plotsPerPage)


    return (
        <div>
            <div className="flex flex-row justify-center">
                <div className="m-3">
                    { currentPage > 1 ? <Link href={`?page=${currentPage - 1}`} className="p-2 rounded-md text-white bg-sky-600">Prev</Link> :
                        <div>Prev</div> }
                    </div>
                <div className="m-3">Page {currentPage}/{totalPages}</div>
                <div className="m-3">
                    { currentPage < totalPages ? <Link href={`?page=${currentPage + 1}`} className="p-2 rounded-md text-white bg-sky-600">Next</Link> :
                        <div>Next</div> }
                    </div>
            </div>
            {plotEntries.slice((currentPage - 1) * plotsPerPage, currentPage * plotsPerPage).map((plotEntry, n) =>
                <PlotDisplay plotEntry={plotEntry} key={n} showDataId={showDataId}/>
            )}
        </div>
    )

}

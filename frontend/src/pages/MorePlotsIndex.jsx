
import { useState, useEffect } from "react"

import ListPager from '../components/listPager'

import { apiFetch } from '../wrappers'

export default function MorePlotsIndex() {

    const [summaryRefs, setSummaryRefs] = useState([])

    return (
        <div>
            <div className="mx-5 my-2 w-fit">
                <div className="flex flex-row items-center">
                    <div className="">
                        <h1 className="text-2xl py-4">More Plots</h1>
                    </div>
                </div>
                <div className="clear-both"></div>
                <ListPager listEntries={summaryRefs} loaded={true}/>
            </div>
        </div>
    )
}
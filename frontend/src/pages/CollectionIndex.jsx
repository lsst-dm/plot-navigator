
import { Link } from "react-router-dom";
import { useState, useEffect } from "react"

import ListPager from '../components/listPager'

import { apiFetch } from '../wrappers'

export default function CollectionIndex() {

    /* SummaryRefs = [{repo: repo, collection: collection, filename: filename, lastModified: time}] */
    /*
    const summaryRefs = await ListSummaries()
    */
    const [summaryRefs, setSummaryRefs] = useState([])

    useEffect(() => {apiFetch("/api/v1/summaries")
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${r.status}`)
            return response.json()
        })
        .then(data => setSummaryRefs(data))
        .catch((e) => {
            console.log(e);
      })
    }, [])

    summaryRefs.sort((a,b) => (b.lastModified - a.lastModified))

    const userCollectionFilter = (ref) => {
        return ref.collection.startsWith("u") || ref.collection.startsWith("LSSTCam/calib") || ref.collection.startsWith("LATISS/calib")
    }

    const officialSummaryRefs = summaryRefs.filter((ref) => ! userCollectionFilter(ref))
    const userSummaryRefs = summaryRefs.filter((ref) => userCollectionFilter(ref))

    officialSummaryRefs.sort((a,b) => (b.lastModified - a.lastModified))
    userSummaryRefs.sort((a,b) => (b.lastModified - a.lastModified))

    const decodeReportFilename = (filename) => {
        const uriEncodedCollection = filename.match("report_(.*).json.gz")[1]
        return decodeURIComponent(uriEncodedCollection)
    }


    const cellClassNames = "px-2 py-3"

    return (
        <div>
            <div className="m-5 inline-block">
                <div className="flex flex-row items-end">
                    <div className="">
                        <h1 className="text-2xl py-4">Official Collections</h1>
                    </div>
                    <div className="grow text-right">
                            <div className="py-4"><Link className="p-2 px-4 m-2 rounded-md text-white bg-sky-600" to="/addcollection">Add Collection</Link></div>
                    </div>
                </div>
                <div className="clear-both"></div>
                <ListPager listEntries={officialSummaryRefs} />
            </div>

            <h1 className="text-2xl m-5">User Collections</h1>
            <div className="m-5 inline-block">
                <ListPager listEntries={userSummaryRefs} />
            </div>

        </div>
    )

}

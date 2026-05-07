
import { useState, useEffect } from "react"

import ListPager from '../components/listPager'
import { Button } from '../components/button'

import { apiFetch } from '../wrappers'

export default function CollectionIndex() {

    const [summaryRefs, setSummaryRefs] = useState([])
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {apiFetch("/api/v1/summaries")
        .then(data => {
            data.sort((a,b) => (new Date(b.lastModified) - new Date(a.lastModified)))
            setSummaryRefs(data)
            setIsLoaded(true)
        })
        .catch((e) => {
            console.log(e);
      })
    }, [])

    const userCollectionFilter = (ref) => {
        return ref.collection.startsWith("u") || ref.collection.startsWith("LSSTCam/calib") || ref.collection.startsWith("LATISS/calib")
    }

    const officialSummaryRefs  = () => {
        return summaryRefs.filter((ref) => ! userCollectionFilter(ref))
    }
    const userSummaryRefs = () => {
        return summaryRefs.filter((ref) => userCollectionFilter(ref))
    }

    const decodeReportFilename = (filename) => {
        const uriEncodedCollection = filename.match("report_(.*).json.gz")[1]
        return decodeURIComponent(uriEncodedCollection)
    }

    return (
        <div>
            <div className="mx-5 my-2 w-fit">
                <div className="flex flex-row items-center">
                    <div className="">
                        <h1 className="text-2xl py-4">Official Collections</h1>
                    </div>
                    <div className="grow text-right">
                            <div className="float-right items-center">
                                <Button to="/addcollection">Add Collection</Button>
                            </div>
                    </div>
                </div>
                <div className="clear-both"></div>
                <ListPager listEntries={officialSummaryRefs()} loaded={isLoaded} />
            </div>

            <div className="m-5 w-fit">
                <h1 className="text-2xl mb-5">User Collections</h1>

                <div className="w-xl">
                    <ListPager listEntries={userSummaryRefs()} loaded={isLoaded} />
                </div>
            </div>

        </div>
    )

}

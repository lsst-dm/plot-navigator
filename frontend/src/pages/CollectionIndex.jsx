
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
                                <Button to="/addcollection" className="gap-1.5">
                                    <span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"
                                            className="h-4 w-4" width="16" height="16">
                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                                        </svg>
                                    </span>
                                    <span>Add Collection</span>
                                    </Button>
                            </div>
                    </div>
                </div>
                <div className="clear-both"></div>
                <ListPager listEntries={officialSummaryRefs()} loaded={isLoaded} searchParamName="o"/>
            </div>

            <div className="m-5 w-fit">
                <h1 className="text-2xl mb-5">User Collections</h1>

                <div className="w-xl">
                    <ListPager listEntries={userSummaryRefs()} loaded={isLoaded} searchParamName="u"/>
                </div>
            </div>

        </div>
    )

}


import Link from 'next/link'

import {ListSummaries, GetSummary, ListReports} from '@/lib/summaries'
import ListPager from '@/components/listPager'

export const revalidate = 60

export default async function Collections() {

    /* SummaryRefs = [{repo: repo, collection: collection, filename: filename, lastModified: time}] */
    const summaryRefs = await ListSummaries()

    summaryRefs.sort((a,b) => (b.lastModified - a.lastModified))
    const officialSummaryRefs = summaryRefs.filter((ref) => ! ref.collection.startsWith("u"))
    const userSummaryRefs = summaryRefs.filter((ref) => ref.collection.startsWith("u"))

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
                            <div className="py-4"><Link className="p-2 px-4 m-2 rounded-md text-white bg-sky-600" href="/addcollection">Add Collection</Link></div>
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

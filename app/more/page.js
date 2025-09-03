
import Link from 'next/link'

import {ListSummaries, GetSummary, ListReports} from '@/lib/summaries'
import ListPager from '@/components/listPager'

export const revalidate = 60

export default async function Collections() {

    /* SummaryRefs = [{repo: repo, collection: collection, filename: filename, lastModified: time}] */
    const summaryRefs = await ListSummaries("decasu")

    summaryRefs.sort((a,b) => (b.lastModified - a.lastModified))

    return (
        <div>
            <div className="m-5 inline-block">
                <div className="flex flex-row items-end">
                    <div className="">
                        <h1 className="text-2xl py-4">Decasu Plots</h1>
                    </div>
                </div>
                <div className="clear-both"></div>
                <ListPager listEntries={summaryRefs} showRepo={false} />
            </div>


        </div>
    )

}

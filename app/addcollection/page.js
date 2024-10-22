
export const dynamic = 'force-dynamic'

import Link from 'next/link'

import AddCollectionSelect from '@/components/addCollectionSelect'

export default async function AddCollection() {


    const repoUrls = JSON.parse(process.env.REPO_URLS ?? "[]")

    /* REPO_URLS */
    return (
        <div>
            <div className="text-m m-5"><Link href={"/"}>&lt;- Back to collections</Link></div>
            <div className="text-2xl m-5">Add a Collection:</div>
            <AddCollectionSelect repos={Object.keys(repoUrls)} />
        </div>

    )

}

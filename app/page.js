

import {ListSummaries, GetSummary, ListReports} from './summaries'

export const revalidate = 60

export default async function Collections() {

    const decodeFilename = (filename) => {
        const uriEncodedCollection = filename.match("collection_(.*).json.gz")[1]
        return decodeURIComponent(uriEncodedCollection)
    }

    const filenames = await ListSummaries()
    const collections = filenames.map(decodeFilename)

    const decodeReportFilename = (filename) => {
        const uriEncodedCollection = filename.match("report_(.*).json.gz")[1]
        return decodeURIComponent(uriEncodedCollection)
    }
    const reportFilenames = await ListReports()
    const reports = reportFilenames.map(decodeReportFilename)

    const cellClassNames = "px-2 py-3"

    return (
        <div>
            <h1 className="text-2xl m-5">Collections</h1>
            <div className="m-5 border-2 rounded w-3/4" >
                <table className="divide-y">
                <thead>
                    <tr>
                        <td className={cellClassNames}>Collection</td>
                        <td className={cellClassNames}>Plots</td>
                        <td className={cellClassNames}>Last Updated</td>
                    </tr>
                </thead>
                <tbody>
                    {collections.map((collection, n) =>
                    (<tr key={n}><td className={cellClassNames}><a href={`/collection/${collection}`}>{collection}</a></td>
                         <td className={cellClassNames}>4321</td>
                         <td className={`text-right ${cellClassNames}`}>2024-05-06</td>
                        </tr>))}
                </tbody>
                </table>
            </div>

            <h1 className="text-2xl m-5">Reports</h1>
            <div className="m-5 border-2 rounded w-3/4" >
                <table className="divide-y">
                <thead>
                    <tr>
                        <td className={cellClassNames}>Collection</td>
                        <td className={cellClassNames}>Plots</td>
                        <td className={cellClassNames}>Last Updated</td>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((collection, n) =>
                    (<tr key={n}><td className={cellClassNames}><a href={`/collection/${collection}`}>{collection}</a></td>
                         <td className={cellClassNames}>4321</td>
                         <td className={`text-right ${cellClassNames}`}>2024-05-06</td>
                        </tr>))}
                </tbody>
                </table>
            </div>
        </div>
    )

}

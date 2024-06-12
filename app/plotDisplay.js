
import React from 'react';

export default async function PlotDisplay({plotEntry, showDataId = true}) {

    const dataId = plotEntry.dataId
    const uuid = plotEntry.id

    async function getUrl(uuid) {
        const url = `${process.env.BUTLER_URL}/api/butler/repo/embargo/v1/get_file/${uuid}`
        const result = await fetch(url, { next: { revalidate: 180 } })

        if (!result.ok) {
            try {
                const returnval = await result.json()
                console.log("Fetch failed, " + JSON.stringify(returnval))
                return ""
            } catch (error) {
                console.log(`Fetch failed of url ${url}, error ` + error)
                return ""
            }
        }

        const datasetInfo = await result.json()

        if(datasetInfo.artifact.file_info.length != 1) {
            console.log(`Multiple file_info entries returned for url ${url}`)
            return ""
        }

        return datasetInfo.artifact.file_info[0].url

    }

    return (
        <div className="w-96 p-5 m-5 float-left">
            { showDataId ? <div className="text-1xl my-5">{dataId}</div> : "" }
            <a href={await getUrl(uuid)}><img src={await getUrl(uuid)} /></a>
        </div>

    )
}

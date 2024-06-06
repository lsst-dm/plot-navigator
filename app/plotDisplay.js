
import React from 'react';

export default async function PlotDisplay({plotEntry}) {

    const dataId = plotEntry.dataId
    const uuid = plotEntry.id

    async function getUrl(uuid) {
        const url = `http://127.0.0.1:5678/api/butler/repo/embargo/v1/get_file/${uuid}`
        console.log("Trying: " + url)
        const result = await fetch(url)

        if (!result.ok) {
            const returnval = await result.json()
            console.log("Fetch failed, " + JSON.stringify(returnval))
            return ""
        }

        const datasetInfo = await result.json()

        /* console.log(datasetInfo.artifact.file_info[0].url)*/
        if(datasetInfo.artifact.file_info.length != 1) {
            console.log(`Multiple file_info entries returned for url ${url}`)
            return ""
        }

        return datasetInfo.artifact.file_info[0].url

    }

    return (
        <div className="w-96 p-5 m-5 float-left">
            <div className="text-1xl my-5">{dataId}</div>
            { /* <img src="/test_plot.png" /> */ }
            <a href={await getUrl(uuid)}><img src={await getUrl(uuid)} /></a>
        </div>

    )
}

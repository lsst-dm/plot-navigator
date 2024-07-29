
import fs from 'fs'
import path from 'path'

import { GetButlerURL } from '../../../summaries'

export async function GET(request, { params }) {

    const repo = decodeURIComponent(params.repo)
    const uuid = params.uuid
    const repoUrl = GetButlerURL(repo)

    const url = `${repoUrl}/v1/get_file/${uuid}`
    const result = await fetch(url, { next: { revalidate: 10 } })

    if (!result.ok) {
        try {
            const returnval = await result.json()
            console.log(`butler get_file failed request url ${url}, result ${JSON.stringify(returnval)}`)
            return new Response("",{status: 500})
        } catch (error) {
            console.log(`Fetch failed of url ${url}, error ` + error)
            return new Response("",{status: 500})
        }
    }

    const datasetInfo = await result.json()

    if(datasetInfo.artifact.file_info.length != 1) {
        console.error(`Multiple file_info entries returned for url ${url}`)
        return new Response("",{status: 500})
    }

    if(datasetInfo.artifact.file_info[0].url.startsWith("file")) {
        const filePath = datasetInfo.artifact.file_info[0].url
        try {
            const imgBuffer = fs.readFileSync(filePath.replace("file://",""))

            return new Response(imgBuffer, { headers: { 'content-type': 'image/png' } });
        } catch (error) {

            console.log(error)
            return new Response("",{status: 500})

        }
    } else {
        /*
         * This could either redirect to the signed URL, or it could fetch the data and proxy it
         * back to the user.
         */
        console.error("URL was not type file://, service not implemented")
        return new Response("",{status: 500})
    }


}

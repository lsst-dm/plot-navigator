
import fs from 'fs'
import path from 'path'

import { GetButlerURL } from '../../../summaries'

export async function GET(request, { params }) {

    const repo = decodeURIComponent(params.repo)
    const uuid = params.uuid
    const repoUrl = GetButlerURL(repo)

    const butlerUrl = `${repoUrl}/v1/get_file/${uuid}`
    const result = await fetch(butlerUrl, { next: { revalidate: 10 } })

    if (!result.ok) {
        try {
            const returnval = await result.json()
            console.log(`butler get_file failed request url ${butlerUrl}, result ${JSON.stringify(returnval)}`)
            return new Response("",{status: 500})
        } catch (error) {
            console.log(`Fetch failed of url ${butlerUrl}, error ` + error)
            return new Response("",{status: 500})
        }
    }

    const datasetInfo = await result.json()

    if(datasetInfo.artifact.file_info.length != 1) {
        console.error(`Multiple file_info entries returned for url ${butlerUrl}`)
        return new Response("",{status: 500})
    }

    const fileUrl = datasetInfo.artifact.file_info[0].url

    if(fileUrl.startsWith("file")) {

        try {
            const imgBuffer = fs.readFileSync(fileUrl.replace("file://",""))

            return new Response(imgBuffer, { headers: { 'content-type': 'image/png' } });
        } catch (error) {

            console.log(error)
            return new Response("",{status: 500})

        }
    } else if (fileUrl.startsWith("http")) {
        /*
         * This could either redirect to the signed URL, or it could fetch the data and proxy it
         * back to the user.
         */
        return Response.redirect(fileUrl)

    } else {

        console.error(`URL type not supported, ${fileUrl}`)
        return new Response("",{status: 500})
    }


}

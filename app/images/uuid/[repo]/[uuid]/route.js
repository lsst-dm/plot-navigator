
import fs from 'fs'
import path from 'path'


/* 
 * This route is only for local testing.
 *
 */

export async function GET(request, { params }) {

    const repo = decodeURIComponent(params.repo)
    const uuid = params.uuid

    if(!process.env.ENABLE_TEST_IMAGES) {
        return new Response("",{status: 404})
    }

    try {
        const imgBuffer = fs.readFileSync("test_assets/images/" + repo + "/" + uuid + ".png")

        return new Response(imgBuffer, { headers: { 'content-type': 'image/png' } });
    } catch (error) {

        console.log(error)
        return new Response("",{status: 500})

    }


}

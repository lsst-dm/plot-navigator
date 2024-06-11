

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

const fs = require('fs');

export default async function Collections() {

    const decodeFilename = (filename) => {
        const uriEncodedCollection = filename.match("collection_(.*).json.gz")[1]
        return decodeURIComponent(uriEncodedCollection)
    }

    const dataDir = 'data/'
    const filenames = await (async () => {
        if(process.env.BUCKET_NAME) {

            const client = new S3Client({
                endpoint: process.env.BUCKET_URL,
                region: "s3dfrgw",
                forcePathStyle: true,
                credentials: {
                    accessKeyId: process.env.S3_KEY,
                    secretAccessKey: process.env.S3_SECRET,
                },
            })
            const command = new ListObjectsV2Command({
                Bucket: process.env.BUCKET_NAME,
                Prefix: "embargo/"
            });

            try {
                let isTruncated = true;

                let filenameArrays = []

                while (isTruncated) {
                    const { Contents, IsTruncated, NextContinuationToken } =
                        await client.send(command)
                    filenameArrays.push(Contents.map((entry) => entry.Key))
                    isTruncated = IsTruncated
                    command.input.ContinuationToken = NextContinuationToken
                }
                return filenameArrays.flat()
            } catch (err) {
                console.log(err)
                return []
            }


        } else {
            try {
                return fs.readdirSync(dataDir).filter(
                    (filename) => filename.match("collection_(.*).json.gz"));
            } catch (error) {
                return []
            }
        }})()
    const collections = filenames.map(decodeFilename)


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
        </div>
    )

}

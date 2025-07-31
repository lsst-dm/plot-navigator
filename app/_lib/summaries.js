

import { S3Client, ListObjectsV2Command, GetObjectCommand} from "@aws-sdk/client-s3"

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")

function GetButlerURL(repoName) {

    const repoUrls = (() => {
        try {
            return JSON.parse(process.env.REPO_URLS)
        } catch (err) {
            console.error(`Could not parse REPO_URLS env var, ${err}`)
            console.error(`REPO_URLS='${process.env.REPO_URLS}'`)
            return {}
        }
    })()

    return repoUrls[repoName]

}

function _getClient() {

    const client = new S3Client({
        endpoint: process.env.BUCKET_URL,
        region: "s3dfrgw",
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.S3_KEY,
            secretAccessKey: process.env.S3_SECRET,
        },
    })

    return client
}

async function _GetSummaryS3(repoName, collectionName) {

    const client = _getClient()
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${encodeURIComponent(repoName)}/collection_${encodeURIComponent(collectionName)}.json.gz`
    })

    try {
        const response = await client.send(command)
        const gzData = await response.Body.transformToByteArray()
        const collectionData = JSON.parse(zlib.gunzipSync(gzData))
        return collectionData

    } catch (err) {
        console.error(err)
        return {}
    }

}

async function GetSummary(repoName, collectionName) {

    if(process.env.BUCKET_NAME) {
        return await _GetSummaryS3(repoName, collectionName)

    } else {
        const gzData = await readFile(`test_assets/summaries/${encodeURIComponent(repoName)}/collection_${encodeURIComponent(collectionName)}.json.gz`)
        const collectionData = JSON.parse(zlib.gunzipSync(gzData))
        return collectionData
    }

}

async function _ListSummariesS3(repoName) {

    const client = _getClient()
    const command = new ListObjectsV2Command({
        Bucket: process.env.BUCKET_NAME,
        Prefix: `${encodeURIComponent(repoName)}/`,
    });

    try {
        let isTruncated = true;

        let filenameArrays = []

        while (isTruncated) {
            const { Contents, IsTruncated, NextContinuationToken } =
                await client.send(command)
            if(Contents) {
                filenameArrays.push(Contents)
            }
            isTruncated = IsTruncated
            command.input.ContinuationToken = NextContinuationToken
        }
        return filenameArrays.flat()
    } catch (err) {
        console.log(err)
        return []
    }

}

async function _ListSummariesFilesystem(repoName) {
    const repoDir = `test_assets/summaries/${encodeURIComponent(repoName)}`
    try {
        console.log(fs.readdirSync(repoDir))
        return fs.readdirSync(repoDir).filter(
            (filename) => filename.match("^collection_(.*).json.gz$"));
    } catch (error) {
        return []
    }
}

async function ListSummaries() {

    const decodeFilename = (filename) => {
        const uriEncodedCollection = filename.match("collection_(.*).json.gz")[1]
        return decodeURIComponent(uriEncodedCollection)
    }

    const repoUrls = (() => {
        try {
            return JSON.parse(process.env.REPO_URLS)
        } catch (err) {
            console.error(`Could not parse REPO_URLS env var, ${err}`)
            console.error(`REPO_URLS='${process.env.REPO_URLS}'`)
            return {}
        }
    })()

    const repos = Object.keys(repoUrls)

    if(process.env.BUCKET_NAME) {
        const res = await Promise.all(repos.map(repo =>
            {
                return _ListSummariesS3(repo).then((entries) => entries.map(entry => ({repo: repo, collection: decodeFilename(entry.Key), filename: entry.Key, lastModified: entry.LastModified})))
            }))
        return res.flat()
    } else {
        const res = await Promise.all(
            repos.map(repo => _ListSummariesFilesystem(repo)
                 .then((filenames) => filenames.map(filename => ({repo: repo, collection: decodeFilename(filename), filename: filename,
                     lastModified: new Date(2025, 2, 10, 2, 30)}))))
        )
        return res.flat()
    }

}

async function ListReports() {
    return []

    const client = _getClient()

    const command = new ListObjectsV2Command({
        Bucket: process.env.BUCKET_NAME,
        Prefix: `reports/`
    });

    try {
        let isTruncated = true;

        let filenameArrays = []

        while (isTruncated) {
            const { Contents, IsTruncated, NextContinuationToken } =
                await client.send(command)
            if(Contents) {
                filenameArrays.push(Contents.map((entry) => entry.Key))
            }
            isTruncated = IsTruncated
            command.input.ContinuationToken = NextContinuationToken
        }
        return filenameArrays.flat()
    } catch (err) {
        console.log(err)
        return []
    }

}

async function GetReport(filename) {

    const client = _getClient()
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `reports/${filename}`
    })

    try {
        const response = await client.send(command)
        const gzData = await response.Body.transformToByteArray()
        const collectionData = JSON.parse(zlib.gunzipSync(gzData))
        return collectionData

    } catch (err) {
        console.error(err)
        return {}
    }

}

export {ListSummaries, GetSummary, ListReports, GetReport, GetButlerURL}

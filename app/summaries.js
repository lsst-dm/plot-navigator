

import { S3Client, ListObjectsV2Command, GetObjectCommand} from "@aws-sdk/client-s3"

const fs = require('fs');
const zlib = require('zlib');

const  { readFile } = require("fs/promises")

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
        Key: `${repoName}/collection_${encodeURIComponent(collectionName)}.json.gz`
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
        const gzData = await readFile(`data/${repoName}/collection_${encodeURIComponent(collectionName)}.json.gz`)
        const collectionData = JSON.parse(zlib.gunzipSync(gzData))
        return collectionData
    }

}

async function _ListSummariesS3(repoName) {

    const client = _getClient()
    const command = new ListObjectsV2Command({
        Bucket: process.env.BUCKET_NAME,
        Prefix: `${repoName}/`
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

async function _ListSummariesFilesystem(repoName) {
    const repoDir = `data/${repoName}`
    try {
        return fs.readdirSync(repoDir).filter(
            (filename) => filename.match("collection_(.*).json.gz"));
    } catch (error) {
        return []
    }
}

async function ListSummaries() {

    const repos = process.env.REPOS.split(',')

    if(process.env.BUCKET_NAME) {
        const res = await Promise.all(repos.map(repo => _ListSummariesS3(repo)))
        return res.flat()
    } else {
        const res = await Promise.all(repos.map(repo => _ListSummariesFilesystem(repo)))
        return res.flat()
    }

}

async function ListReports() {

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

export {ListSummaries, GetSummary, ListReports, GetReport}

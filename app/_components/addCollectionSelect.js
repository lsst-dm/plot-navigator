'use client'

import React from 'react';
import { useState, useEffect } from 'react'

import {putCollection, pollJob} from './AddCollectionSelectServer.js'

export default function AddCollectionSelect({repos}) {

    const [repo, setRepo] = useState(repos[0]);
    const [collectionName, setCollectionName] = useState("");
    const [jobId, setJobId] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusClasses, setStatusClasses] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    const pollUpdates = async () => {
        if(jobId == "") {
            return
        }
        await new Promise(r => setTimeout(r, 5000));
        console.log(`Polling ${jobId}`)
        const res = await pollJob(jobId)
        setStatusMessage(res.status.replace("_", " "))
        bounceText()
        setStatusClasses("bg-sky-500/10")
        if(res.status == "in_progress") {
            await pollUpdates()
        } else if(res.status == "complete") {
            setResultMessage(res.result)
        }
    }
    useEffect(() => {pollUpdates(jobId)}, [jobId])

    const submitForm = async () => {
        const jobId = await putCollection(repo, collectionName)
        setJobId(jobId)
        setStatusMessage("Started")
        setResultMessage("")

    }

    const bounceText = () => {
        setStatusClasses("bg-sky-500/10")
    }

    useEffect(() => {setStatusClasses("duration-1000")}, [statusClasses])

    return (
        <div className="p-2">
            <select className="p-1 m-2" value={repo} onChange={(e) => {
                  setRepo(e.target.value);
            }}>
                {repos.map(
                    (repo) => <option value={repo} key={repo}>{repo}</option>
                )}
            </select>
            <input className="m-2 border-2" type="text" size={40} value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
            <button className="p-2 px-4 m-2 rounded-md text-white bg-sky-600" onClick={submitForm}>Add</button>
            <div className={`m-2 p-2 px-4 inline-block ${statusClasses}`}>{statusMessage}</div>
            <div className={`m-2 p-2 px-4 inline-block `}>{resultMessage}</div>
        { /*
            <button className="p-2 px-4 m-2 rounded-md text-white bg-sky-600" onClick={bounceText}>Bounce</button>
            */ }
        </div>
    )
}


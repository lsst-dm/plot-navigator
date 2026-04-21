
import React from "react";
import { useState, useEffect } from "react";

import helpImg from "./help_18dp.svg"

import { Tooltip } from 'react-tooltip';

export async function putCollection(repo, collectionName, filterCollections = false) {

  const putBody = JSON.stringify({ repo: repo, collection: collectionName,
        filter_collections: filterCollections})
  let res = await fetch("/api/v1/cache", {
    method: "PUT",
    body: putBody,
    headers: { "Content-Type": "application/json" },
  });
  let data = await res.json();
  console.log(`putCollection result: ${JSON.stringify(data)}`);

  return data.jobId;
}

const pollJob = async (jobId) => {
  try {
    const response = await fetch(`/api/v1/cache/job/${jobId}`)
    if (!response.ok) {
      return "Error getting job status."
    }
    return res.json()
  } catch (error) {
      return "Error getting job status."
  }
}

export default function AddCollectionSelect({ repos }) {
  const [repo, setRepo] = useState(repos?.[0] ?? "");
  const [collectionName, setCollectionName] = useState("");
  const [filterCollections, setFilterCollections] = useState(false);
  const [jobId, setJobId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusClasses, setStatusClasses] = useState("");
  const [resultMessage, setResultMessage] = useState("");


  const pollUpdates = async () => {
    if (!jobId) return;
    await new Promise((r) => setTimeout(r, 2500));
    console.log(`Polling ${jobId}`);
    const res = await pollJob(jobId);
    bounceText();
    if (res.status == "in_progress") {
      setStatusMessage("In progress")
      await pollUpdates();
    } else if (res.status == "complete") {
      setStatusMessage("Complete")
      setResultMessage(res.result);
    } else {
      setStatusMessage("Failed")
      setResultMessage(`Unknown error: ${res}`)
    }
  };
  useEffect(() => {
    pollUpdates();
  }, [jobId]);

  const submitForm = async () => {
    const jobId = await putCollection(repo, collectionName.trim(), filterCollections);
    setJobId(jobId);
    setStatusMessage("Started");
    setResultMessage("");
  };

  const bounceText = () => {
    setStatusClasses("bg-sky-500/10");
    setTimeout(() => setStatusClasses("duration-1000"), 50)
  };

  return (
    <div className="p-2">
      <table>
        <tbody>
          <tr>
            <td>
              <select
                className="p-2 m-2"
                value={repo}
                onChange={(e) => {
                  setRepo(e.target.value);
                }}
              >
                {repos.map((repo) => (
                  <option value={repo} key={repo}>
                    {repo}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                className="m-2 border-2"
                type="text"
                size={40}
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              />
            </td>
            <td>
              <button
                className="p-2 px-4 m-2 rounded-md text-white bg-sky-600 cursor-pointer"
                onClick={submitForm}
              >
                Add
              </button>

              <div className={`m-2 p-2 px-4 inline-block ${statusClasses}`}>
                {statusMessage}
              </div>
              <div className={"m-2 p-2 px-4 inline-block "}>{resultMessage}</div>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <label className="mx-2">
                <input type="checkbox" className="m-1" checked={filterCollections}
                  onChange={(event) => setFilterCollections(event.target.checked)}
                />
                Only plots in collections starting with this prefix
                </label>
                <img id="helpicon" className="inline mx-1" src={helpImg}
                  data-tooltip-id="helptooltip"
                  data-tooltip-place="bottom"
                  data-tooltip-html={`If this is selected and the collection name is u/username/DM-1234,<br/>
                    then only collections in the chain like u/username/DM-1234/20251125ZT230001Z<br/>
                    will be included and LSSTCam/runs/DRP/1234 will not.`}
                />
                <Tooltip id="helptooltip" />
              </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

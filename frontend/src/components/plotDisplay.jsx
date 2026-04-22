import React from "react";

import PlotMouseover from "./plotMouseover"
import { useState, useEffect } from "react"

import { apiFetch } from '../wrappers'

export default function PlotDisplay({
  plotEntry,
  showDataId = true,
  showDatasetType = false,
  showPermalink = false,
}) {
  const { instrument, skymap, ...dataId } = JSON.parse(plotEntry.dataId);
  const uuid = plotEntry.id;
  const imgUrl = plotEntry.url;
  const repo = plotEntry.repo;
  const permalink = plotEntry.permalink ?? "";
  const datasetType = plotEntry.datasetType ?? "";

  const splitType = [...datasetType.matchAll(/[a-zA-Z0-9]*(_|$)/g)].map(
    (x) => x[0],
  );
  const typeWithWbr = splitType.join("\u00ad");

  const dataIdString = Object.entries(dataId)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const [pngMetadata, setPngMetadata] = useState({})

  useEffect(() => {apiFetch( `/api/v1/images_md/${encodeURIComponent(repo)}/${uuid}`)
    .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${r.status}`)
        return response.json()
    })
    .then(data => setPngMetadata(data))
    .catch((e) => {
        console.log(e);
  })
}, [])

  let regions = [];
  let region_label = "";
  if('boxes' in pngMetadata && pngMetadata.boxes) {
      try {
          regions = JSON.parse(pngMetadata.boxes);
          region_label = pngMetadata.label;
      } catch (e) {
      }
  }

  return (
    <div className="m-2">
      <div className="text-1xl my-5 text-wrap float-left">
        {showDataId ? dataIdString : ""}
        {showDatasetType ? typeWithWbr : ""}
      </div>
      {showPermalink ? (
        <div className="text-1xl float-right">
          <a href={`${process.env.BASE_URL ?? ""}/${permalink}`}>Plot link</a>
        </div>
      ) : (
        ""
      )}
      {uuid ? (
        <PlotMouseover
          key={uuid}
          src={`/api/v1/images/uuid/${encodeURIComponent(repo)}/${uuid}`}
          label={region_label}
          regions={regions}
      />
      ) : (
        <img
          key={imgUrl}
          src={`/images/path/${imgUrl}`}
        />
      )}
    </div>
  );
}

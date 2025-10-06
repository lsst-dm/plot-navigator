import React from "react";

import PlotMouseover from "./plotMouseover.js"

export default async function PlotDisplay({
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

  let pngMetadata;
  if(! process.env.PRODUCTION_TOOLS_HOST) {
      pngMetadata = {};
  } else {
    pngMetadata = await fetch(
      `http://${process.env.PRODUCTION_TOOLS_HOST}/${process.env.BASE_URL ?? ""}/images/uuid_md/${encodeURIComponent(repo)}/${uuid}`,
    )
      .then((response) => {
        if (response.ok) {
          try {
              return response.json();
          } catch (e) {
              return {};
          }
        } else {
          return {};
        }
      })
      .catch((e) => {
        console.log(e);
        return {};
      });
  }

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
          src={`${process.env.BASE_URL ?? ""}/images/uuid/${encodeURIComponent(repo)}/${uuid}`}
          label={region_label}
          regions={regions}
      />
      ) : (
        <img
          key={imgUrl}
          src={`${process.env.BASE_URL ?? ""}/images/path/${imgUrl}`}
        />
      )}
    </div>
  );
}

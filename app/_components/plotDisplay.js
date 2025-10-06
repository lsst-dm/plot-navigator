import React from "react";

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
        <img
          key={uuid}
          src={`${process.env.BASE_URL ?? ""}/images/uuid/${encodeURIComponent(repo)}/${uuid}`}
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

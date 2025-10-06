"use client";

import React from "react";
import { useState, useEffect } from "react";
import BandSelector from "./bandSelector.js";
import { DataIdSortFunc } from "@/lib/dataIdFuncs";

/*
 * TODO:
 * - Add an option to only show plots that exist in both collections
 * - Light box for blinking A vs B images.
 */

export default function DualPlotPager({
  plotEntriesA,
  plotEntriesB,
  collectionA,
  collectionB,
  plotsPerPage = 10,
}) {
  const [selectedBands, setSelectedBands] = useState({
    u: true,
    g: true,
    r: true,
    i: true,
    z: true,
    y: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [inLightbox, setInLightbox] = useState(false);
  const [displayedEntry, setDisplayedEntry] = useState(0);

  const getCombinedEntries = () => {
    /*
     * To merge the two collections, we need the union of dataIDs. This requires converting
     * dataIDs to strings to facilitate comparison, as JS objects will not compare as equal even
     * if the keys and values are the same
     */
    const uniqDataIdSet = new Set([
      ...plotEntriesA.map((entry) => JSON.stringify(entry.dataId)),
      ...plotEntriesB.map((entry) => JSON.stringify(entry.dataId)),
    ]);
    const uniqDataIds = Array(...uniqDataIdSet).map(JSON.parse);

    const dataIdStringsA = plotEntriesA.map((entry) =>
      JSON.stringify(entry.dataId),
    );
    const dataIdStringsB = plotEntriesB.map((entry) =>
      JSON.stringify(entry.dataId),
    );

    const indexedEntries = uniqDataIds
      .filter((dataId) =>
        "band" in dataId ? selectedBands[dataId.band] : true,
      )
      .map((dataId, n) => ({
        dataId: dataId,
        index: n,
        plotA:
          plotEntriesA[
            dataIdStringsA.findIndex((x) => x === JSON.stringify(dataId))
          ]?.plot ?? null,
        plotB:
          plotEntriesB[
            dataIdStringsB.findIndex((x) => x === JSON.stringify(dataId))
          ]?.plot ?? null,
      }));

    const sortedEntries = indexedEntries.sort((a, b) =>
      DataIdSortFunc(a.dataId, b.dataId),
    );
    return sortedEntries;
  };

  const totalPages = () => {
    return Math.ceil(getCombinedEntries().length / plotsPerPage);
  };

  const onBandUpdated = (band, value) => {
    setSelectedBands({ ...selectedBands, [band]: event.target.checked });
  };

  useEffect(() => {
    if (currentPage > totalPages()) {
      setCurrentPage(totalPages());
    }
    if (currentPage == 0 && totalPages() > 0) {
      setCurrentPage(1);
    }
  }, [selectedBands]);

  const displayBandSelector = () => {
    const dimensions = new Set(
      plotEntriesA.map((entry) => Object.keys(entry.dataId)).flat(),
    );
    return dimensions.has("band");
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const showLightboxEntry = (entry) => {
    setDisplayedEntry(entry);
    setInLightbox(true);
  };

  const exitLightbox = () => {
    setInLightbox(false);
  };
  const doNothing = (e) => {
    e.stopPropagation();
  };

  const advanceLeft = (e) => {
    e.stopPropagation();
    if (displayedEntry > 0) {
      setDisplayedEntry(displayedEntry - 1);
    }
  };

  const advanceRight = (e) => {
    e.stopPropagation();
    if (displayedEntry < plotEntriesA.length - 1) {
      setDisplayedEntry(displayedEntry + 1);
    }
  };

  const getSlice = (currentPage) => {
    return getCombinedEntries().slice(
      (currentPage - 1) * plotsPerPage,
      currentPage * plotsPerPage,
    );
  };

  return (
    <div>
      <div className="grid grid-cols-3">
        <div></div>
        <div className="flex flex-row items-center justify-center">
          <div className="m-3">
            {currentPage > 1 ? (
              <button
                className="p-2 rounded-md text-white bg-sky-600"
                onClick={previousPage}
              >
                Prev
              </button>
            ) : (
              <div>Prev</div>
            )}
          </div>
          <div className="m-3">
            Page {currentPage}/{totalPages()}
          </div>
          <div className="m-3">
            {currentPage < totalPages() ? (
              <button
                className="p-2 rounded-md text-white bg-sky-600"
                onClick={nextPage}
              >
                Next
              </button>
            ) : (
              <div>Next</div>
            )}
          </div>
        </div>
        <div className="m-2">
          {displayBandSelector() ? (
            <BandSelector
              selectedBands={selectedBands}
              onBandUpdated={onBandUpdated}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      <div className="flex flex-row justify-center">
        <div className="w-[35rem] p-1 m-0 font-bold">{collectionA}</div>
        <div className="w-[35rem] p-1 m-0 font-bold">{collectionB}</div>
      </div>
      {plotEntriesA.length == 0 || plotEntriesB.length == 0 ? (
        <div className="flex flex-row justify-center">
          <div className="w-[35rem] p-1 m-0 font-bold">
            {plotEntriesA.length == 0
              ? "No plots of this type in this collection"
              : ""}
          </div>
          <div className="w-[35rem] p-1 m-0 font-bold">
            {plotEntriesB.length == 0
              ? "No plots of this type in this collection"
              : ""}
          </div>
        </div>
      ) : (
        ""
      )}
      <div className="">
        {getSlice(currentPage).map((indexedEntry, n) => (
          <div key={n} className="flex flex-row justify-center">
            <div className="w-[35rem] p-1 m-0">{indexedEntry.plotA}</div>
            <div className="w-[35rem] p-1 m-0">{indexedEntry.plotB}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-row items-center justify-center">
        <div className="m-3">
          {currentPage > 1 ? (
            <button
              className="p-2 rounded-md text-white bg-sky-600"
              onClick={previousPage}
            >
              Prev
            </button>
          ) : (
            <div>Prev</div>
          )}
        </div>
        <div className="m-3">
          Page {currentPage}/{totalPages()}
        </div>
        <div className="m-3">
          {currentPage < totalPages() ? (
            <button
              className="p-2 rounded-md text-white bg-sky-600"
              onClick={nextPage}
            >
              Next
            </button>
          ) : (
            <div>Next</div>
          )}
        </div>
      </div>
      {inLightbox ? (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-slate-500/75"
          onClick={exitLightbox}
        >
          <div className="h-12"></div>
          <div className="w-1/6 float-left h-1">
            {displayedEntry > 0 ? (
              <div
                className="float-right flex items-center justify-center m-8 h-64 w-16 bg-indigo-100 hover:bg-indigo-600 hover:cursor-pointer"
                onClick={advanceLeft}
              >
                <div>&lt;&lt;</div>
              </div>
            ) : (
              ""
            )}
          </div>
          <div className="w-2/3 float-left bg-white" onClick={doNothing}>
            <div className="[&_img]:[max-height:75vh]">
              {plotEntriesA[displayedEntry].plot}
            </div>
          </div>
          <div className="w-1/6 float-left">
            {displayedEntry < plotEntriesA.length - 1 ? (
              <div
                className="flex items-center justify-center m-8 h-64 w-16 bg-indigo-100 hover:bg-indigo-600 hover:cursor-pointer"
                onClick={advanceRight}
              >
                <div>&gt;&gt;</div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}


import { useState, useEffect } from "react";
import BandSelector from "./bandSelector";
import { DataIdSortFunc } from '../components/dataIdFuncs'
import { Button } from '../components/button'
import { Lightbox } from '../components/Lightbox'

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

  /* side = 0 for left, side = 1 for right-side plot */
  const [displayedSide, setDisplayedSide] = useState(0);

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
          ]?.plotFn ?? (() => {}),
        plotB:
          plotEntriesB[
            dataIdStringsB.findIndex((x) => x === JSON.stringify(dataId))
          ]?.plotFn ?? (() => {}),
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
  }, [plotEntriesA, plotEntriesB, selectedBands]);

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

  const showLightboxEntry = (entry, side) => {
    setDisplayedEntry(entry);
    setInLightbox(true);
    setDisplayedSide(side)
  };

  const exitLightbox = () => {
    setInLightbox(false);
  };

  const advanceLeft = (e) => {
    if(e) e.stopPropagation();
    setDisplayedSide(0)
  };

  const advanceRight = (e) => {
    if(e) e.stopPropagation();
    setDisplayedSide(1)
  };

  const getSlice = (currentPage) => {
    return getCombinedEntries().slice(
      (currentPage - 1) * plotsPerPage,
      currentPage * plotsPerPage,
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        if(inLightbox) { advanceLeft() }
      } else if (e.key === 'ArrowRight') {
        if(inLightbox) { advanceRight() }
      } else if (e.key === 'Escape') {
        if(inLightbox) { setInLightbox(false) }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inLightbox, displayedEntry])

  return (
    <div>
      <div className="grid grid-cols-3">
        <div></div>
        <div className="flex flex-row items-center justify-center">
          <div className="m-3">
            <Button inactive={currentPage <= 1} onClick={previousPage} >
              ‹ Prev
            </Button>
          </div>
          <div className="m-3">
            Page {currentPage}/{totalPages()}
          </div>
          <div className="m-3">
            <Button inactive={currentPage >= totalPages()} onClick={nextPage} >
              Next ›
            </Button>
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
                : ""
            }
          </div>
          <div className="w-[35rem] p-1 m-0 font-bold">
            {collectionB ?
              (plotEntriesB.length == 0
                ? "No plots of this type in this collection"
                : "")
              : "No comparison collection selected"
            }
          </div>
        </div>
      ) : (
        ""
      )}
      <div className="">
        {getSlice(currentPage).map((indexedEntry, n) => (
          <div key={n} className="flex flex-row justify-center">
            <div className="w-[35rem] p-1 m-0"
                  onClick={() => showLightboxEntry(indexedEntry.index, 0)}
            >{indexedEntry.plotA()}</div>
            <div className="w-[35rem] p-1 m-0"
                  onClick={() => showLightboxEntry(indexedEntry.index, 1)}
            >{indexedEntry.plotB()}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-row items-center justify-center">
        <div className="m-3">
          <Button inactive={currentPage <= 1} onClick={previousPage} >
            ‹ Prev
          </Button>
        </div>
        <div className="m-3">
          Page {currentPage}/{totalPages()}
        </div>
        <div className="m-3">
          <Button inactive={currentPage >= totalPages()} onClick={nextPage} >
            Next ›
          </Button>
        </div>
      </div>
      {inLightbox ? (
        <Lightbox plotFunction={displayedSide ?
                    getCombinedEntries()[displayedEntry].plotA : getCombinedEntries()[displayedEntry].plotB}
            prevEntry={advanceLeft}
            nextEntry={advanceRight}
            canGoPrev={displayedSide == 1}
            canGoNext={displayedSide == 0}
            exit={exitLightbox}
        />
      ) : (
        ""
      )}
    </div>
  );
}

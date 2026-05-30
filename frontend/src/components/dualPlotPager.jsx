
import { useState, useEffect, cloneElement } from "react";
import BandSelector from "./bandSelector";
import { DataIdSortFunc, DataIdMerge } from '../components/dataIdFuncs'
import { Button } from '../components/button'
import { Lightbox } from '../components/Lightbox'

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
  const [matchingPlots, setMatchingPlots] = useState(false);

  /* side = 0 for left, side = 1 for right-side plot */
  const [displayedSide, setDisplayedSide] = useState(0);

  const getCombinedEntries = () => {
    const sortedA = plotEntriesA.sort((a, b) =>
      DataIdSortFunc(a.dataId, b.dataId),
    ).filter((entry) =>
      "band" in entry.dataId ? selectedBands[entry.dataId.band] : true,
    )

    const sortedB = plotEntriesB.sort((a, b) =>
      DataIdSortFunc(a.dataId, b.dataId),
    ).filter((entry) =>
      "band" in entry.dataId ? selectedBands[entry.dataId.band] : true,
    )

    const mergedEntries = DataIdMerge(sortedA, sortedB,
      (a, b) => DataIdSortFunc(a.dataId, b.dataId))

    return mergedEntries.filter((entry) => matchingPlots ? entry.a && entry.b : true)
      .map((mergedEntry, n) => ({
      dataId: mergedEntry.a?.dataId || mergedEntry.b?.dataId,
      index: n,
      plotA: mergedEntry.a?.plotFn ?? (() => {}),
      plotB: mergedEntry.b?.plotFn ?? (() => {}),
    }))
  }

  /*
    This creates a version of the PlotDisplay that shows the collection, for use
    in the lightbox. Not a very elegant solution but ok.
  */
  const wrapPlotDisplay = (plotFn ) => {
    return () => cloneElement(plotFn(), {showCollection: true})
  }

  const totalPages = () => {
    return Math.ceil(getCombinedEntries().length / plotsPerPage);
  };

  const onBandUpdated = (band, value) => {
    setSelectedBands({ ...selectedBands, [band]: value });
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
        <div className="m-3 flex flex-row">

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
        <div className="m-2">
          {displayBandSelector() ? (
            <BandSelector
              selectedBands={selectedBands}
              onBandUpdated={onBandUpdated}
            />
          ) : (
            ""
          )}
          <label>
            <input type="checkbox" checked={matchingPlots} onChange={(e) => setMatchingPlots(e.target.checked)}/> Only Matching Plots
          </label>
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
        <Lightbox plotFunction={displayedSide == 0 ?
                    wrapPlotDisplay(getCombinedEntries()[displayedEntry].plotA)
                    : wrapPlotDisplay(getCombinedEntries()[displayedEntry].plotB)}
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


import React from "react";
import { useState, useEffect, useMemo } from "react";
import BandSelector from "./bandSelector";
import { Button } from '../components/button'
import { Lightbox } from '../components/Lightbox'

export default function PlotPager({ plotEntries, plotsPerPage = 10 }) {
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

  const filteredEntries = useMemo(() =>
    plotEntries
      .filter(
        (indexedEntry) =>
          selectedBands[indexedEntry.dataId.band] ||
          !("band" in indexedEntry.dataId),
      )
      .map((entry, n) => ({
        dataId: entry.dataId,
        plotFn: entry.plotFn,
        index: n,
      }))
  );

  const totalPages = () => {
    return Math.ceil(filteredEntries.length / plotsPerPage);
  };

  const onBandUpdated = (band, value) => {
    setSelectedBands({ ...selectedBands, [band]: value });
  };

  useEffect(() => {
    if (totalPages() === 0) return;  // don't adjust page while data is still loading
    if (currentPage > totalPages()) {
      setCurrentPage(totalPages());
    }
    if (currentPage == 0 && totalPages() > 0) {
      setCurrentPage(1);
    }
  }, [selectedBands, currentPage]);

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

  const displayBandSelector = () => {
    const dimensions = new Set(
      plotEntries.map((entry) => Object.keys(entry.dataId)).flat(),
    );
    return dimensions.has("band");
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(Number(currentPage) - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages()) {
      setCurrentPage(Number(currentPage) + 1);
    }
  };

  const showLightboxEntry = (entry) => {
    setDisplayedEntry(entry);
    setInLightbox(true);
  };

  const exitLightbox = () => {
    setInLightbox(false);
  };

  const advanceLeft = (e) => {
    if(e) { e.stopPropagation(); }
    if (displayedEntry > 0) {
      setDisplayedEntry(displayedEntry - 1);
    }
  };

  const advanceRight = (e) => {
    if(e) { e.stopPropagation(); }
    if (displayedEntry < filteredEntries.length - 1) {
      setDisplayedEntry(displayedEntry + 1);
    }
  };

  const getSlice = (currentPage) => {
    return filteredEntries.slice(
      (currentPage - 1) * plotsPerPage,
      currentPage * plotsPerPage,
    );
  };

  return (
    <div>
      <div className="grid grid-cols-3 items-center">
        <div></div>
        <div className="flex flex-row items-center justify-center">
          <div className="m-3">
            <Button inactive={currentPage <= 1}
              onClick={previousPage}
            >
              Prev
            </Button>
          </div>
          <div className="m-3">
            Page
            <input
              className="border border-gray-400 rounded-sm m-1 p-1"
              size={Math.ceil(Math.log10(totalPages() + 1))}
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
            />
            /{totalPages()}
          </div>
          <div className="m-3">
            <Button inactive={currentPage >= totalPages()}
              onClick={nextPage}
            >
              Next
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
      <div className="flex flex-row flex-wrap justify-center">
        {currentPage >= 1 && currentPage <= totalPages()
          ? ""
          : "Invalid page number"}
        {getSlice(currentPage).map((indexedEntry, n) => (
          <div
            key={indexedEntry.index}
            className=" w-[28rem] p-1 m-0"
            onClick={() => showLightboxEntry(indexedEntry.index)}
          >
            {indexedEntry.plotFn()}
          </div>
        ))}
      </div>
      {inLightbox ? (
          <Lightbox plotFunction={filteredEntries[displayedEntry].plotFn}
            prevEntry={advanceLeft}
            nextEntry={advanceRight}
            canGoPrev={displayedEntry > 0}
            canGoNext={displayedEntry < filteredEntries.length - 1}
            exit={exitLightbox}
          />
      ) : (
        ""
      )}
    </div>
  );
}

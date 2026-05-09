
import React from "react";
import { useState, useEffect, useMemo } from "react";
import BandSelector from "./bandSelector";
import { Button } from '../components/button'

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
  const doNothing = (e) => {
    e.stopPropagation();
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
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-slate-800/85"
          onClick={exitLightbox}
        >
          <div className="h-12"></div>
          <div className="w-1/6 float-left h-1">
            {displayedEntry > 0 ? (
              <div
                className={`absolute left-1/16 top-1/2 -translate-y-1/2 m-8 h-14 w-14 bg-lightbox-buttons/80 hover:bg-buttons-hover
                            hover:cursor-pointer rounded-full
                            flex items-center justify-center transition-colors`}
                onClick={advanceLeft}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              ""
            )}
          </div>
          <div className="w-2/3 float-left bg-white" onClick={doNothing}>
            <div className="[&_img]:[max-height:75vh]">
              {filteredEntries[displayedEntry].plotFn()}
            </div>
          </div>
          <div className="w-1/6 float-left">
            {displayedEntry < filteredEntries.length - 1 ? (
              <div
                className={`absolute right-12 top-1/2 -translate-y-1/2 m-8 h-14 w-14 bg-lightbox-buttons/80 hover:bg-buttons-hover
                            hover:cursor-pointer rounded-full
                            flex items-center justify-center transition-colors`}
                onClick={advanceRight}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
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

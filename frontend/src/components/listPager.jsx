// "use client";

import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import React from "react";
import { useQueryParam } from './pagerCommon'
import { Button } from '../components/button'
import { z } from 'zod';


export default function ListPager({
  listEntries,
  entriesPerPage = 10,
  showRepo = true,
  loaded = false,
  searchParamName = "",
}) {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useQueryParam(searchParamName, 1, z.coerce.number());

  const totalPages = () => {
    return Math.ceil(listEntries.length / entriesPerPage);
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

  const getSlice = (currentPage) => {
    return listEntries.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage,
    );
  };
  const cellClassNames = "px-2 py-2";

  const formatDate = (dateString) => {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <div className="border-2 rounded px-0 inline-block my-0 w-3xl border-[#5C7878]">
        <table className="divide-y w-full">
          <thead>
            <tr>
              <td className={`min-w-lg  bg-gray-200 font-medium  ${cellClassNames}`}>Collection</td>
              {showRepo ? <td className={` bg-gray-200 font-medium ${cellClassNames}`}>Repo</td> : ""}
              <td className={`text-right  bg-gray-200 font-medium  ${cellClassNames}`}>Last Updated</td>
            </tr>
          </thead>
          <tbody>
            { loaded ?
              getSlice(currentPage).map((summary, n) => (
                <tr key={n} className="hover:bg-gray-100">
                  <td className={cellClassNames}>
                    <Link
                      to={`/collection/${encodeURIComponent(summary.repo)}/${encodeURIComponent(summary.collection)}`}
                      state={{ from: location.pathname + location.search }}
                    >
                      {summary.collection}
                    </Link>
                  </td>
                  {showRepo ? (
                    <td className={`${cellClassNames}`}>{summary.repo}</td>
                  ) : (
                    ""
                  )}
                  <td className={`text-right ${cellClassNames}`}>
                    {formatDate(summary.lastModified)}
                  </td>
                </tr>
              )) : <tr><td className={cellClassNames}>Loading...</td></tr> }
          </tbody>
        </table>

        <div className="flex flex-row items-center justify-center">
          <div className="m-3">
              <Button inactive={currentPage <= 1}
                onClick={previousPage}
              >
                ‹ Prev
              </Button>
          </div>
          <div className="m-3">
            Page {currentPage}/{totalPages()}
          </div>
          <div className="m-3">
            <Button inactive={currentPage >= totalPages()}
              onClick={nextPage}
            >
              Next ›
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

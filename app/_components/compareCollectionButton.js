"use client";

import React from "react";
import { useState } from "react";

export default function CompareCollectionButton({
  baseURL,
  collectionOptions,
}) {
  const [showingPopup, setShowingPopup] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState("");
  const [selectedUnofficial, setSelectedUnofficial] = useState("");

  const officialOptions = collectionOptions
    .filter((option) => !option.collection.startsWith("u/"))
    .sort((a, b) => b.lastModified - a.lastModified);
  const userOptions = collectionOptions
    .filter((option) => option.collection.startsWith("u/"))
    .sort((a, b) => b.lastModified - a.lastModified);

  const makeOptionString = (option) => {
    return `${encodeURIComponent(option.repo)}/${encodeURIComponent(option.collection)}`;
  };

  return (
    <div>
      <div
        className="block m-5 mb-0 px-4 py-2 rounded-md text-white bg-sky-600"
        onClick={() => setShowingPopup(!showingPopup)}
      >
        <span className="text-l">
          Compare Collections{" "}
          <svg className="h-5 w-5 inline" fill="white">
            <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
          </svg>
        </span>
      </div>
      {showingPopup ? (
        <div className="border-2 border-black mx-5 m-2 p-2 absolute z-1 right-0 bg-white">
          <div className="block">
            <select
              className="m-1 p-1"
              value={selectedOfficial}
              onChange={(e) => {
                setSelectedOfficial(e.target.value);
              }}
            >
              <option value="">Official Collections</option>
              {officialOptions.map((collectionOption) => (
                <option
                  key={makeOptionString(collectionOption)}
                  value={makeOptionString(collectionOption)}
                >
                  {collectionOption.collection}
                </option>
              ))}
            </select>
            <a href={`${baseURL}/compare/${selectedOfficial}`}>Compare</a>
          </div>
          <div className="block">
            <select
              className="m-1 p-1"
              value={selectedUnofficial}
              onChange={(e) => {
                setSelectedUnofficial(e.target.value);
              }}
            >
              <option value="">User Collections</option>
              {userOptions.map(
                (collectionOption = (
                  <option
                    key={makeOptionString(collectionOption)}
                    value={makeOptionString(collectionOption)}
                  >
                    {collectionOption.collection}
                  </option>
                )),
              )}
            </select>
            <a href={`${baseURL}/compare/${selectedUnofficial}`}>Compare</a>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}

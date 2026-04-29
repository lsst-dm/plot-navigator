
import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"

import { apiFetch } from '../wrappers'

export default function CompareCollectionButton({
  baseURL,
}) {
  const navigate = useNavigate()
  const [showingPopup, setShowingPopup] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState("");
  const [selectedUnofficial, setSelectedUnofficial] = useState("");
  const [repoNames, setRepoNames] = useState([])

  const [collectionOptions, setCollectionOptions] = useState([])

  const { repo, collection, plotName } = useParams()
  /*
   . Route path="/comparison/:repo/:collection/:plotName" element={<Comparison />} />
  */
  const handleCompareOfficial = () => {
    navigate(`/comparison/${repo}/${encodeURIComponent(collection)}/${plotName}`,
      { state:
        { repo2: selectedOfficial.split(";")[0],
        collection2: selectedOfficial.split(";")[1]
       } })
  }

  const handleCompareUnofficial = () => {}

  useEffect(() => {
    apiFetch("/api/v1/repos")
      .then((data) => setRepoNames(data.repos))
      .catch((e) => {
        console.log(e);
      })
  }, [])

  useEffect(() => {
      apiFetch("/api/v1/summaries")
      .then(data => {
          data.sort((a,b) => (new Date(b.lastModified) - new Date(a.lastModified)))
          /* const collections = data.map(entry => entry.collection) */
          setCollectionOptions(data)
      })
      .catch((e) => {
          console.log(e);
    })
  }, [])

  const officialOptions = collectionOptions
    .filter((option) => !option.collection.startsWith("u/"))
  const userOptions = collectionOptions
    .filter((option) => option.collection.startsWith("u/"))

  const makeOptionString = (option) => {
    return `${encodeURIComponent(option.repo)};${encodeURIComponent(option.collection)}`;
  };

  return (
    <div>
      <div
        className="block m-5 mb-0 px-4 py-2 rounded-md text-white bg-sky-600 cursor-pointer"
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
              className="m-1 p-1 border-1"
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
            <div
              className="inline m-5 mb-0 px-4 py-2 rounded-md text-white bg-sky-600 cursor-pointer"
              onClick={handleCompareOfficial}
            >
              Compare
            </div>
          </div>
          <div className="block">
            <select
              className="m-1 p-1 border-1"
              value={selectedUnofficial}
              onChange={(e) => {
                setSelectedUnofficial(e.target.value);
              }}
            >
              <option value="">User Collections</option>
              {userOptions.map((collectionOption) => (
                <option
                  key={makeOptionString(collectionOption)}
                  value={makeOptionString(collectionOption)}
                >
                  {collectionOption.collection}
                </option>
              ))}
            </select>

            <div
              className="inline m-5 mb-0 px-4 py-2 rounded-md text-white bg-sky-600 cursor-pointer"
              onClick={handleCompareUnofficial}
            >
              Compare
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}

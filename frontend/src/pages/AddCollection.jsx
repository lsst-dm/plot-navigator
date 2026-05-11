
import { Link } from "react-router-dom";

import AddCollectionSelect from '../components/addCollectionSelect'
import { useEffect, useState } from "react";
import { apiFetch } from "../wrappers";

export default function AddCollection() {

   const [repoNames, setRepoNames] = useState([])

   useEffect(() => {
        apiFetch("/api/v1/repos")
        .then((data) => setRepoNames(data.repos))
        .catch((e) => {
            console.log(e);
      })
   }, [])

    /* REPO_URLS */
    return (
        <div>
            <div className="text-m m-5"><Link to={"/"}>-← Back to collections</Link></div>
            <div className="text-2xl m-5">Add a Collection:</div>
            <AddCollectionSelect repos={repoNames} />
        </div>

    )

}


import { Link } from "react-router-dom";

import AddCollectionSelect from '../components/addCollectionSelect'

export default function AddCollection() {

    /*
    const repoUrls = JSON.parse(process.env.REPO_URLS ?? "[]")
    */
   const repoUrls = {"testing_butler": {"blah": 123}}

    /* REPO_URLS */
    return (
        <div>
            <div className="text-m m-5"><Link to={"/"}>&lt;- Back to collections</Link></div>
            <div className="text-2xl m-5">Add a Collection:</div>
            <AddCollectionSelect repos={Object.keys(repoUrls)} />
        </div>

    )

}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import CollectionIndex from "./pages/CollectionIndex"
import Collection from "./pages/Collection"
import Plot from "./pages/Plot"
import Tract from "./pages/Tract"
import AddCollection from "./pages/AddCollection"
import Comparison from "./pages/Comparison"
import RootLayout from "./layout"

const baseurl = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={baseurl}>
      <Routes>
        <Route element={<RootLayout />} >
            <Route path="/" element={<CollectionIndex />} />
            <Route path="/collection/:encodedRepo/:collection" element={<Collection />} />

            <Route path="/plot/:repo/:collection/:plotName" element={<Plot />} />
            <Route path="/comparison/:repo/:collection/:plotName" element={<Comparison />} />
            <Route path="/tract/:repo/:collection/:tract" element={<Tract />} />

            <Route path="/addcollection" element={<AddCollection />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)

/*
            <Route path="/visit/:repo/:collection/:visit" element={<Visit />} />
            <Route path="/tract/:repo/:collection/:tract" element={<Tract />} />

            <Route path="/plot/:repo/:collection/:plotName/:dataId" element={<PlotWithDataId />} />
            <Route path="/plot/:repo/:collection/:plotName/compare/:repo2/:collection2" element={<PlotCompare />} />
            */

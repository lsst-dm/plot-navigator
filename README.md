
# Rubin Plot Navigator

The plot navigator is a web interface to viewing plots created by [analysis
tools](https://github.com/lsst/analysis_tools) and stored in the Rubin
[Butler](https://github.com/lsst/daf_butler). It is comprised of a React single-page application
frontend which talks to a back-end server built on fastapi in Python.

## React Frontend

The front end uses React Router to serve a single page application. This is compiled at
container-build time by Vite and then served as a single JavaScript artifact by the backend FastAPI server.


## FastAPI Backend

The backend Python process serves the SPA bundle along with API routes supporting the frontend. It
uses the Butler library to access the plot data. For performance, each collection that is served
must have a cached list of plots pre-generated before it is available in the front end. This cache
is stored on a object store and reduces the number of database queries required to serve the
collection overview pages.

For a collection with small numbers of plots, all of the plot references are stored in a single JSON
file. For plot dataset types with very large numbers of data IDs, the references for that particular
plot type may be saved in a plot-specific file, which is referenced from the top-level collection
cache file. This keeps the collection level file small for quick access.

# Development

Run the FastAPI development server with:

```
uv run fastapi dev lsst/plot_navigator/main.py
```

Run the auto-reloading front end with:

```
API_HOST=localhost:8000 APP_PREFIX=/plot-navigator npm run dev
```

The vite development server will listen on localhost:5173 and forward API
requests to the fastapi dev server.


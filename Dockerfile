
ARG PYTHON_VERSION="3.13"
ARG DEBIAN_VERSION="trixie"
ARG UV_VERSION="0.10"
ARG APP_PREFIX="/plot-navigator"
#ARG ASGI_PORT="8080"

#==============================================================================
# UV SOURCE IMAGE
# - The DHI version of uv is in /usr/local/bin
FROM astral/uv:${UV_VERSION} AS uv

#
# Build the frontend bundle
#



FROM node:25.9.0-alpine3.22 AS web-builder

ARG APP_PREFIX
ENV APP_PREFIX=${APP_PREFIX}

WORKDIR /workdir/frontend
COPY frontend/ .

RUN npm install && npm run build


#
# Build UV
#
FROM python:${PYTHON_VERSION}-slim-${DEBIAN_VERSION} AS build-image

# ENV UV_PYTHON_PREFERENCE=system
# ENV UV_PROJECT_ENVIRONMENT=/opt/venv
# ENV UV_FROZEN=1
# ENV UV_LINK_MODE=copy
# ENV DEBIAN_FRONTEND=noninteractive

ARG PYTHON_VERSION
ENV UV_PYTHON_INSTALL_DIR=/opt/python/dist
ENV UV_PROJECT_ENVIRONMENT=/opt/python/venv
ENV UV_PYTHON_PREFERENCE=only-managed
ENV UV_PYTHON=cpython@${PYTHON_VERSION}
ENV UV_LINK_MODE=copy


WORKDIR /workdir/backend
COPY backend/ .

RUN --mount=type=cache,target=/root/.cache/uv --mount=from=uv,source=/uv,target=/bin/uv <<ENDRUN
    set -e
    /bin/uv sync --no-dev --no-editable
ENDRUN


# -----------------
FROM gcr.io/distroless/cc-debian13:debug AS server

WORKDIR /opt/python
COPY --from=build-image /opt/python .

WORKDIR /home/nonroot
USER nonroot
COPY --from=web-builder /workdir/frontend/dist /home/nonroot/dist

ENV DIST_DIR="/home/nonroot/dist"
ENV PATH="/opt/python/venv/bin:$PATH"

ENTRYPOINT ["/opt/python/venv/bin/python3"]
CMD ["-m", "uvicorn", "lsst.plot_navigator.main:app", "--host", "0.0.0.0", "--port", "8000"]
#CMD ["-m", "lsst.plot_navigator.main.serve"]

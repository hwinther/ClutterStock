# Dependency stages copy only the manifests, so a source change keeps the npm ci layers cached.
FROM node:26-alpine AS development-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci

FROM node:26-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:26-alpine AS build-env
ARG APP_VERSION=unknown
ARG GIT_SHA=unknown
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
COPY . /app/
WORKDIR /app
ENV VITE_APP_VERSION=${APP_VERSION}
ENV VITE_GIT_SHA=${GIT_SHA}
RUN npm run build

# Pinned to the digest so Dependabot (docker, weekly) opens a PR when Google rebuilds the image with
# Debian security fixes; an unpinned tag only changed whenever the frontend happened to be rebuilt.
# The nonroot variant runs as uid 65532 by itself, not only when the cluster's securityContext says so.
FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:33c86a63859efc2ebd88ea0a355863582ec6f1220d048de62baffb2584e709b3
WORKDIR /app
COPY ./package.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
ENV NODE_ENV=production
# @react-router/serve 8 is an ES module package; its CLI launcher is bin.cjs (was bin.js in 7).
CMD ["./node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]

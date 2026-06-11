FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
# Playwright's postinstall fetches ~600MB of browser binaries from Microsoft's CDN; a single stalled
# TCP connection there hangs `npm ci` indefinitely (no timeout on the download). The dev-deps stage
# only exists to feed `npm run build` (Vite/React Router) — Playwright e2e tests run in a separate
# compose stack, not inside this container. Skipping the browser download removes the hang risk
# without affecting the production build artifact.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
ARG APP_VERSION=unknown
ARG GIT_SHA=unknown
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
ENV VITE_APP_VERSION=${APP_VERSION}
ENV VITE_GIT_SHA=${GIT_SHA}
RUN npm run build

FROM gcr.io/distroless/nodejs24-debian13
WORKDIR /app
COPY ./package.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
ENV NODE_ENV=production
# BRANCH-SCOPED (fix/coverage): exposes the gated /debug/* pages so SSE can be
# tested through the real preview proxy layers. REVERT before merging to main —
# otherwise the debug pages become reachable in production.
ENV ENABLE_DEBUG_CONFIG=true
CMD ["./node_modules/@react-router/serve/bin.js", "./build/server/index.js"]

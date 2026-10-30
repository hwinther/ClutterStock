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

FROM gcr.io/distroless/nodejs26-debian13
WORKDIR /app
COPY ./package.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
ENV NODE_ENV=production
# @react-router/serve 8 is an ES module package; its CLI launcher is bin.cjs (was bin.js in 7).
CMD ["./node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]

FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
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

FROM node:24-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]
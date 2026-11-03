# Playwright runner images for e2e/, with the browsers baked in: a job in one of these needs
# nothing from the internet except npm packages, like a runner that can only reach a container
# registry (and an internal npm registry). playwright-images.yml builds three variants to compare
# pull and setup time (e2e-image-benchmark.yml):
#
#   official        mcr.microsoft.com/playwright as is (Chromium, Firefox, WebKit) plus the tools
#                   the e2e job needs; what a "golden image" built on Microsoft's image looks like
#   chromium        node slim + Chromium and its system deps only
#   headless-shell  node slim + chromium-headless-shell only (`--only-shell`), enough for headless
#                   runs, which is all CI does
#
# PLAYWRIGHT_VERSION must match @playwright/test in e2e/package-lock.json: Playwright looks for the
# browser revision of its own version.

ARG BASE_IMAGE=node:26-bookworm-slim
FROM ${BASE_IMAGE}

ARG PLAYWRIGHT_VERSION
# Empty for the official base, which already has every browser.
ARG INSTALL_ARGS=""

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# curl and jq: the e2e job's wait and summary steps. git and zstd: checkout and the actions cache.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git jq zstd \
 && if [ -n "$INSTALL_ARGS" ]; then \
      npx -y "playwright@${PLAYWRIGHT_VERSION}" install --with-deps $INSTALL_ARGS; \
    fi \
 && rm -rf /root/.npm /tmp/* /var/lib/apt/lists/*

# Anything that still tries to download a browser at runtime fails loudly instead of quietly
# reaching the internet.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_DOWNLOAD_HOST=https://browser-downloads.invalid

LABEL org.opencontainers.image.source="https://github.com/hwinther/ClutterStock" \
      org.opencontainers.image.version="${PLAYWRIGHT_VERSION}"

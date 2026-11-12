# Tiny scratch image carrying the V8 browser-side coverage report produced by
# monocart-reporter's coverage plugin during the nightly E2E run.
# Build context: e2e/monocart-coverage, not e2e/: e2e/.dockerignore keeps the reports out of
# the e2e image's context.
# Pulled by api-docs-pages.yml on tag/release to embed under /coverage-e2e/.
#
# The V8 report is configured with `inline: true` (see playwright.config.ts) so
# index.html bundles its assets and works from both file:// and http://.
FROM scratch
COPY . /monocart-coverage

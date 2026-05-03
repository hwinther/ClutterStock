# Tiny scratch image carrying the rendered monocart-reporter E2E dashboard.
# Build context: frontend/ (so the COPY source is the monocart-report folder
# produced by Playwright's monocart-reporter at the end of a nightly run).
# Pulled by api-docs-pages.yml on tag/release to embed under /e2e-report/.
#
# A stable-named lighthouse-home.html is staged into this directory by the
# nightly workflow before the image is built, giving the Pages site a direct
# link to the latest Lighthouse report (the in-monocart attachment uses a
# content hash that changes every run).
FROM scratch
COPY monocart-report /monocart-report

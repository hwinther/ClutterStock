# Tiny scratch image carrying the rendered Allure 3 HTML report.
# Build context: e2e/allure-report (the directory produced by `allure generate`), not e2e/:
# e2e/.dockerignore keeps the reports out of the e2e image's context.
# Pulled by api-docs-pages.yml in Phase 2 to embed under the Pages site without
# re-running E2E tests at release time.
FROM scratch
COPY . /allure-report

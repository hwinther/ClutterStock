# Tiny scratch image carrying the rendered Allure 3 HTML report.
# Build context: ./allure-report (the directory produced by `allure generate`).
# Pulled by api-docs-pages.yml in Phase 2 to embed under the Pages site without
# re-running E2E tests at release time.
FROM scratch
COPY allure-report /allure-report

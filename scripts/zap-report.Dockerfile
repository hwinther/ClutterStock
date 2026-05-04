# Tiny scratch image carrying the OWASP ZAP DAST report (HTML + Markdown +
# JSON + the rendered findings badge SVG) produced by the zap-scan workflow.
# Build context: repo root.
# Pulled by api-docs-pages.yml on every deploy and embedded under /security/.
# Doubles as the air-gap distribution channel — a private registry mirror can
# host the image and downstream consumers extract the report without ever
# touching the public internet.
FROM scratch
COPY zap-report /zap-report

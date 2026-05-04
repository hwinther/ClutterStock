# Tiny scratch image carrying the e2e-derived badge SVGs produced by the
# nightly E2E workflow: monocart V8 coverage %, Lighthouse category scores.
# Build context: repo root (the badges-e2e/ folder is created there by the
# nightly workflow's badge-generation step).
# Pulled by api-docs-pages.yml on every deploy so backend / frontend badges
# (regenerated in that workflow) can be merged with the nightly-sourced ones
# before being shipped to /badges/ on Pages.
#
# This image also doubles as the air-gap distribution channel: a private
# registry that mirrors GHCR can host it, and downstream consumers extract
# the SVGs locally without ever reaching the public internet.
FROM scratch
COPY badges-e2e /badges-e2e

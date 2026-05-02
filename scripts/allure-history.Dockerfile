# Tiny scratch image carrying Allure 3's history.jsonl across CI runs.
# Build context must contain ./history.jsonl (a single file).
# Pull, `docker create`, `docker cp /history.jsonl ./`, feed into allure-results
# before `allure generate` so the trend widget can extend across runs.
FROM scratch
COPY history.jsonl /history.jsonl

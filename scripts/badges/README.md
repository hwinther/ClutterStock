# scripts/badges

Self-rendered SVG badges for coverage, Lighthouse scores, and nightly-status.
Written so the directory drops into another repo unchanged — no ClutterStock-specific
paths or repo names are baked in.

The point: **no public-internet dependency at badge-render time.** SVGs are
produced by [`badge-maker`](https://www.npmjs.com/package/badge-maker) (the same
library `shields.io` runs internally), saved to disk, and served from wherever
makes sense for the consuming repo — GitHub Pages, an internal Pages mirror, a
private wiki, or extracted from a `FROM scratch` OCI image on an air-gapped host.

## Inputs (CLI flags, all optional)

| Flag | Source | Notes |
|---|---|---|
| `--backend-summary-json <file>` | ReportGenerator `JsonSummary` (`Summary.json`) | Preferred for .NET — pre-aggregates coverage across shards |
| `--backend-cobertura <glob>` | Raw Coverlet/Cobertura XML(s) | Fallback; supports multi-shard via `**/coverage.cobertura.*.xml` |
| `--frontend-summary-json <file>` | ReportGenerator `JsonSummary` | Same idea for frontend if you run ReportGenerator there |
| `--frontend-cobertura <file>` | Vitest `cobertura-coverage.xml` | Single-file path |
| `--e2e-cobertura <file>` | monocart V8 `cobertura-coverage.xml` | Single-file path |
| `--lighthouse-json <file>` | Lighthouse JSON report | Reads `categories.{performance,accessibility,best-practices,seo}.score` |
| `--nightly-status <status>` | Free-form string | One of `success`, `failure`, `cancelled`; anything else is rendered grey |
| `--out <dir>` | Target directory | Default `./badges` |

Missing inputs are silently skipped — the same invocation can run in workflows
that have only some of the data.

## Outputs

Stable filenames written to `--out`:

- `coverage-backend.svg`
- `coverage-frontend.svg`
- `coverage-e2e.svg`
- `lighthouse-performance.svg`
- `lighthouse-accessibility.svg`
- `lighthouse-best-practices.svg`
- `lighthouse-seo.svg`
- `nightly-e2e.svg`

A JSON summary of what was produced is printed to stdout for CI logs.

## Color thresholds

shields.io-standard, locked:

| Range | Color |
|---|---|
| `<50%` | red |
| `<60%` | orange |
| `<70%` | yellow |
| `<80%` | yellowgreen |
| `<90%` | green |
| `≥90%` | brightgreen |

Status badge colors: `success` brightgreen, `failure` red, `cancelled` lightgrey.

## Local usage

```bash
cd scripts/badges
npm ci
node generate-badges.mjs \
  --frontend-cobertura ../../frontend/coverage/cobertura-coverage.xml \
  --out ./out
xmllint --noout out/*.svg   # optional sanity check
```

## Reuse in another repo

1. Copy this directory verbatim. Run `npm install`.
2. Wire your CI to call `node scripts/badges/generate-badges.mjs --<your-flags>`.
3. Pick a delivery channel:
   - **GitHub Pages**: drop the SVGs into the deployed site under `/badges/` and
     reference them with `![](https://<owner>.github.io/<repo>/badges/coverage-frontend.svg)`.
   - **`FROM scratch` GHCR image** (recommended for air-gap): build a one-line
     image (`COPY badges /badges`) and `docker push`. Mirrors / private registries
     can pull it; consumers extract the SVGs and re-host on internal Pages /
     wikis. ClutterStock's `scripts/badges-e2e.Dockerfile` is the reference.
4. Update README markdown links to point at your delivery URL.

The only per-repo edit is the badge URL in your README. The renderer, threshold
table, and filenames stay identical across repos.

## Air-gap recipe

On a host with no public internet but access to an internal OCI registry that
mirrors GHCR (Harbor, Artifactory, JFrog, etc.):

```bash
docker pull internal-mirror.example/<owner>/<repo>/badges-e2e:latest
cid=$(docker create internal-mirror.example/<owner>/<repo>/badges-e2e:latest /badges-e2e)
docker cp "$cid:/badges-e2e" ./badges
docker rm "$cid"
# Now serve ./badges/*.svg from whatever internal Pages / wiki / static host you have.
```

The SVGs are pure text — no JavaScript, no external font references. They render
in any browser fully offline.

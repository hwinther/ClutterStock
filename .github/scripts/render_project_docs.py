#!/usr/bin/env python3
"""
Render Markdown under docs/ to static HTML for GitHub Pages.

- Reads every docs/**/*.md (relative to repo root).
- Extracts fenced ```mermaid blocks, writes .mmd files under api-docs/project-docs/diagrams/,
  runs mermaid-cli in Docker to produce PNGs, replaces fences with Markdown images.
- Runs pandoc (Docker) on a processed copy to emit api-docs/project-docs/<slug>.html.
- Writes api-docs/project-docs/index.html linking to each page.

Environment variables (required in CI; defaults are for local testing):
  PANDOC_DOCKER_IMAGE       e.g. pandoc/minimal:3.7
  MERMAID_CLI_DOCKER_IMAGE  e.g. minlag/mermaid-cli:11.4.2
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_PANDOC_IMAGE = "pandoc/minimal:3.7"
DEFAULT_MERMAID_IMAGE = "minlag/mermaid-cli:11.4.2"

MERMAID_FENCE = re.compile(r"```mermaid[ \t]*\r?\n(.*?)```", re.DOTALL)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _slug_for(rel_md: Path) -> str:
    rel_no_suffix = rel_md.with_suffix("")
    return rel_no_suffix.as_posix().replace("/", "_")


def _run(cmd: list[str], *, cwd: Path) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def _docker_mermaid(
    workspace: Path,
    image: str,
    input_rel: Path,
    output_rel: Path,
) -> None:
    in_posix = input_rel.as_posix()
    out_posix = output_rel.as_posix()
    cmd = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{workspace}:/data",
        "-w",
        "/data",
        image,
        "-i",
        f"/data/{in_posix}",
        "-o",
        f"/data/{out_posix}",
        "-b",
        "transparent",
        "-w",
        "1920",
    ]
    _run(cmd, cwd=workspace)


def _docker_pandoc(
    workspace: Path,
    image: str,
    input_rel: Path,
    output_rel: Path,
) -> None:
    in_posix = input_rel.as_posix()
    out_posix = output_rel.as_posix()
    # pandoc/* Docker images set ENTRYPOINT to pandoc; do not pass "pandoc" again
    # or the first input path becomes the literal word "pandoc" and fails with
    # withBinaryFile: does not exist.
    cmd = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{workspace}:/data",
        "-w",
        "/data",
        image,
        in_posix,
        "-o",
        out_posix,
        "-f",
        "gfm",
        "-t",
        "html",
        "-s",
        "--metadata",
        f"title={output_rel.stem}",
    ]
    _run(cmd, cwd=workspace)


def _replace_mermaid_blocks(
    text: str,
    *,
    slug: str,
    diagrams_dir: Path,
) -> tuple[str, list[tuple[Path, Path]]]:
    """Return processed markdown and list of (mmd_rel, png_rel) under workspace."""
    matches = list(MERMAID_FENCE.finditer(text))
    if not matches:
        return text, []

    diagrams_dir.mkdir(parents=True, exist_ok=True)
    diagram_paths: list[tuple[Path, Path]] = []
    pieces: list[str] = []
    last = 0
    for i, m in enumerate(matches, start=1):
        body = m.group(1).strip("\r\n")
        mmd_rel = diagrams_dir / f"{slug}_{i}.mmd"
        png_rel = diagrams_dir / f"{slug}_{i}.png"
        mmd_rel.write_text(body + ("\n" if not body.endswith("\n") else ""), encoding="utf-8")
        diagram_paths.append((mmd_rel, png_rel))
        pieces.append(text[last : m.start()])
        # Paths must be valid from the emitted HTML (project-docs/<slug>.html):
        # ../diagrams/ incorrectly resolves to site /diagrams/; use diagrams/ instead.
        pieces.append(f"![](diagrams/{slug}_{i}.png)\n\n")
        last = m.end()
    pieces.append(text[last:])
    return "".join(pieces), diagram_paths


def main() -> int:
    root = _repo_root()
    docs_dir = root / "docs"
    out_root = root / "api-docs" / "project-docs"

    pandoc_image = os.environ.get("PANDOC_DOCKER_IMAGE", DEFAULT_PANDOC_IMAGE)
    mermaid_image = os.environ.get("MERMAID_CLI_DOCKER_IMAGE", DEFAULT_MERMAID_IMAGE)

    if not docs_dir.is_dir():
        print(f"error: missing docs directory: {docs_dir}", file=sys.stderr)
        return 1

    md_files = sorted(p for p in docs_dir.rglob("*.md") if p.is_file())
    if not md_files:
        print("error: no markdown files under docs/", file=sys.stderr)
        return 1

    if out_root.exists():
        shutil.rmtree(out_root)
    out_root.mkdir(parents=True, exist_ok=True)
    (out_root / "diagrams").mkdir(parents=True, exist_ok=True)

    for src in md_files:
        rel = src.relative_to(docs_dir)
        slug = _slug_for(rel)
        raw = src.read_text(encoding="utf-8")
        processed, diagrams = _replace_mermaid_blocks(
            raw,
            slug=slug,
            diagrams_dir=out_root / "diagrams",
        )

        for mmd_rel, png_rel in diagrams:
            _docker_mermaid(
                root,
                mermaid_image,
                mmd_rel.relative_to(root),
                png_rel.relative_to(root),
            )
            mmd_rel.unlink(missing_ok=True)

        # Source beside final HTML so diagrams/foo.png resolves to project-docs/diagrams/.
        md_build_rel = Path("api-docs") / "project-docs" / f".render.{slug}.md"
        md_build_abs = root / md_build_rel
        md_build_abs.write_text(processed, encoding="utf-8")

        html_rel = Path("api-docs") / "project-docs" / f"{slug}.html"
        _docker_pandoc(root, pandoc_image, md_build_rel, html_rel)
        md_build_abs.unlink(missing_ok=True)

    links = []
    for src in md_files:
        rel = src.relative_to(docs_dir)
        slug = _slug_for(rel)
        title = rel.as_posix()
        links.append(f'<li><a href="{slug}.html">{title}</a></li>')

    index_html = (
        "<!DOCTYPE html>\n"
        "<html lang=\"en\"><head><meta charset=\"utf-8\"/>"
        "<title>Project docs</title></head><body>\n"
        "<h1>Project docs</h1>\n<ul>\n"
        + "\n".join(links)
        + "\n</ul>\n</body></html>\n"
    )
    (out_root / "index.html").write_text(index_html, encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

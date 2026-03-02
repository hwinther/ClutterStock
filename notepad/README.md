# Plate Notepad

Plate Notepad is a simple desktop text editor built with **Tauri**, **React**, **TypeScript**, and **Plate** (a rich-text framework on top of Slate).

It behaves like a basic Notepad-style app while using Plate under the hood, and it saves/loads **plain `.txt` files** so you can still open them in classic Notepad or any other text editor.

## Stack

- Tauri 2 (Rust backend)
- React + TypeScript (Vite) frontend in `frontend`
- Plate editor (`@udecode/plate`) for the editing surface

## Project layout

- `frontend/` – Vite React+TS SPA hosting the Plate editor and toolbar UI
  - `src/App.tsx` – application shell, toolbar, and file wiring
  - `src/PlateNotepad.tsx` – Plate-based editor with plain-text serialization
  - `src/fileApi.ts` – thin wrapper for calling Tauri commands from the frontend
- `src-tauri/` – Tauri Rust backend
  - `src/main.rs` – Tauri setup and file open/save commands
- `tauri.conf.json` – Tauri configuration (dev/build commands and window config)

## Running in development

From the repo root:

```bash
cd notepad/frontend
npm install
```

In one terminal, start the frontend dev server:

```bash
cd notepad/frontend
npm run dev
```

In another terminal, run Tauri:

```bash
cd notepad/frontend
cargo tauri dev
```

This should open a desktop window labeled **Plate Notepad** that hosts the React+Plate editor.

> Note: You need a working Rust toolchain and Tauri prerequisites installed on Windows (Rust, Node, WebView2, etc.).

## Building a desktop app

From the `notepad` directory:

```bash
cd notepad/frontend
cargo tauri build
```

This will:

- Build the React app (`npm run build` in `frontend`)
- Bundle the Tauri application into a desktop binary/installer for Windows

## Current features

- New: clears the current document.
- Open: choose a `.txt` file and load its contents into the editor.
- Save: serializes the current Plate document to plain text (one paragraph per line) and writes it to disk. If the file has not been saved before, a Save dialog will be shown.
- Title bar shows the current file path and an asterisk (`*`) when there are unsaved changes.

The on-disk format is plain text, so files remain compatible with other editors.


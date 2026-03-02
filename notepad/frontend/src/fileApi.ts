import { invoke } from '@tauri-apps/api/core'

export type OpenFileResult = {
  path: string
  contents: string
}

export async function openFile(): Promise<OpenFileResult | null> {
  const result = await invoke<[string, string] | null>('open_file')
  if (!result) return null
  const [path, contents] = result
  return { path, contents }
}

export async function saveFile(path: string | null, contents: string): Promise<string> {
  const newPath = await invoke<string>('save_file', { path, contents })
  return newPath
}

/** Path passed when app was launched via file association (e.g. double-click .json). */
export async function getInitialFilePath(): Promise<string | null> {
  return invoke<string | null>('get_initial_file_path')
}

/** Load file at path without dialog (used when opening via file association). */
export async function loadFileAtPath(path: string): Promise<OpenFileResult> {
  const [filePath, contents] = await invoke<[string, string]>('load_file_at_path', { path })
  return { path: filePath, contents }
}


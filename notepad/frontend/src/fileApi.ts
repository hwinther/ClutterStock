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


import React, { useCallback, useEffect, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import './style.css'
import { PlateNotepad } from './PlateNotepad'
import { getInitialFilePath, loadFileAtPath, openFile, saveFile } from './fileApi'

const appWindow = getCurrentWindow()

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  // When app is launched via file association (e.g. double-click .json), open that file.
  useEffect(() => {
    let cancelled = false
    getInitialFilePath()
      .then((path) => {
        if (cancelled || !path) return
        return loadFileAtPath(path)
      })
      .then((result) => {
        if (cancelled || !result) return
        window.dispatchEvent(
          new CustomEvent('plate-notepad:load', {
            detail: { contents: result.contents },
          }),
        )
        setCurrentPath(result.path)
        setDirty(false)
      })
      .catch((err) => console.error('Failed to open initial file', err))
    return () => {
      cancelled = true
    }
  }, [])

  const handleNew = useCallback(() => {
    window.dispatchEvent(new CustomEvent('plate-notepad:new'))
    setCurrentPath(null)
    setDirty(false)
  }, [])

  const handleOpen = useCallback(async () => {
    try {
      const result = await openFile()
      if (!result) return
      window.dispatchEvent(
        new CustomEvent('plate-notepad:load', {
          detail: { contents: result.contents },
        }),
      )
      setCurrentPath(result.path)
      setDirty(false)
    } catch (err) {
      console.error('Failed to open file', err)
    }
  }, [])

  const handleSave = useCallback(async () => {
    try {
      const serialized = await new Promise<string>((resolve) => {
        const listener = (event: Event) => {
          const custom = event as CustomEvent<string>
          window.removeEventListener('plate-notepad:serialize', listener)
          resolve(custom.detail)
        }

        window.addEventListener('plate-notepad:serialize', listener, { once: true })
        window.dispatchEvent(new CustomEvent('plate-notepad:request-serialize'))
      })

      const newPath = await saveFile(currentPath, serialized)
      setCurrentPath(newPath)
      setDirty(false)
    } catch (err) {
      console.error('Failed to save file', err)
    }
  }, [currentPath])

  const handleContentChanged = useCallback(() => {
    setDirty(true)
  }, [])

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title" data-tauri-drag-region>
          Plate Notepad
          {currentPath ? ` - ${currentPath}` : ''}
          {dirty ? ' *' : ''}
        </div>
        <div className="app-toolbar">
          <button onClick={handleNew}>New</button>
          <button onClick={handleOpen}>Open</button>
          <button onClick={handleSave} disabled={!dirty}>
            Save
          </button>
        </div>
        <div className="window-controls">
          <button
            className="window-btn"
            onClick={() => appWindow.minimize()}
            title="Minimize"
            aria-label="Minimize"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path fill="currentColor" d="M0 5h12v2H0z" />
            </svg>
          </button>
          <button
            className="window-btn"
            onClick={() => appWindow.toggleMaximize()}
            title="Maximize"
            aria-label="Maximize"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path fill="currentColor" d="M0 0v12h12V0H0zm11 11H1V1h10v10z" />
            </svg>
          </button>
          <button
            className="window-btn window-btn-close"
            onClick={() => appWindow.close()}
            title="Close"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path fill="currentColor" d="M6 4.586L10.293.293l1.414 1.414L7.414 6l4.293 4.293-1.414 1.414L6 7.414l-4.293 4.293-1.414-1.414L4.586 6 .293 1.707 1.707.293 6 4.586z" />
            </svg>
          </button>
        </div>
      </header>
      <main className="app-main">
        <PlateNotepad onChange={handleContentChanged} />
      </main>
    </div>
  )
}

export default App


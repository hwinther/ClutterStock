import React, { useCallback, useState } from 'react'
import './style.css'
import { PlateNotepad } from './PlateNotepad'
import { openFile, saveFile } from './fileApi'

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

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
        <div className="app-title">
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
      </header>
      <main className="app-main">
        <PlateNotepad onChange={handleContentChanged} />
      </main>
    </div>
  )
}

export default App


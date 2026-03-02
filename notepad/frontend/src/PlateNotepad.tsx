import React, { useCallback, useEffect, useState } from 'react'
import { createEditor, Editor, Text, type Descendant } from 'slate'
import { Slate, Editable, withReact, type RenderLeafProps } from 'slate-react'

type EditorValue = Descendant[]

const initialValue: EditorValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  } as any,
]

export interface PlateNotepadProps {
  onChange?: () => void
}

export const PlateNotepad: React.FC<PlateNotepadProps> = ({ onChange }) => {
  const [editor] = useState(() => withReact(createEditor()))
  const [value, setValue] = useState<EditorValue>(initialValue)
  const [docKey, setDocKey] = useState(0)

  useEffect(() => {
    const handleNew = () => {
      setValue(initialValue)
      setDocKey((key) => key + 1)
    }

    const handleLoad = (event: Event) => {
      const custom = event as CustomEvent<{ contents: string }>
      try {
        const parsed = JSON.parse(custom.detail.contents) as EditorValue
        // Very light validation: must be an array
        if (Array.isArray(parsed)) {
          setValue(parsed)
          setDocKey((key) => key + 1)
          return
        }
      } catch {
        // Optional: fallback if file is not JSON – e.g. treat as plain text
        const lines = custom.detail.contents.split(/\r?\n/)
        const next: EditorValue = lines.map((line) => ({
          type: 'paragraph',
          children: [{ text: line }],
        }))
        setValue(next.length ? next : initialValue)
        setDocKey((key) => key + 1)
        return
      }
    }

    const handleRequestSerialize = () => {
      const json = JSON.stringify(value)
      window.dispatchEvent(new CustomEvent('plate-notepad:serialize', { detail: json }))
    }

    window.addEventListener('plate-notepad:new', handleNew)
    window.addEventListener('plate-notepad:load', handleLoad as EventListener)
    window.addEventListener(
      'plate-notepad:request-serialize',
      handleRequestSerialize as EventListener,
    )

    return () => {
      window.removeEventListener('plate-notepad:new', handleNew)
      window.removeEventListener('plate-notepad:load', handleLoad as EventListener)
      window.removeEventListener(
        'plate-notepad:request-serialize',
        handleRequestSerialize as EventListener,
      )
    }
  }, [value])

  const handleChange = useCallback(
    (newValue: EditorValue) => {
      setValue(newValue)
      onChange?.()
    },
    [onChange],
  )

  const isMarkActive = useCallback(
    (format: 'bold' | 'italic' | 'underline') => {
      const [match] = Editor.nodes(editor, {
        match: (n) => Text.isText(n) && (n as any)[format] === true,
        universal: true,
      })
      return !!match
    },
    [editor],
  )

  const toggleMark = useCallback(
    (format: 'bold' | 'italic' | 'underline') => {
      const active = isMarkActive(format)
      if (active) {
        Editor.removeMark(editor, format)
      } else {
        Editor.addMark(editor, format, true)
      }
    },
    [editor, isMarkActive],
  )

  const renderElement = useCallback((props: any) => {
    const { attributes, children, element } = props
    switch (element.type) {
      case 'paragraph':
      default:
        return <p {...attributes}>{children}</p>
    }
  }, [])

  const renderLeaf = useCallback(
    (props: RenderLeafProps) => {
      const { attributes, children, leaf } = props

      let content = children
      if ((leaf as any).bold) {
        content = <strong>{content}</strong>
      }
      if ((leaf as any).italic) {
        content = <em>{content}</em>
      }
      if ((leaf as any).underline) {
        content = <u>{content}</u>
      }

      return (
        <span {...attributes}>
          {content}
        </span>
      )
    },
    [],
  )

  return (
    <div className="editor-container">
      <Slate key={docKey} editor={editor} initialValue={value} onChange={handleChange}>
        <div className="editor-toolbar">
          <button
            type="button"
            className={isMarkActive('bold') ? 'active' : ''}
            onMouseDown={(event) => {
              event.preventDefault()
              toggleMark('bold')
            }}
          >
            B
          </button>
          <button
            type="button"
            className={isMarkActive('italic') ? 'active' : ''}
            onMouseDown={(event) => {
              event.preventDefault()
              toggleMark('italic')
            }}
          >
            I
          </button>
          <button
            type="button"
            className={isMarkActive('underline') ? 'active' : ''}
            onMouseDown={(event) => {
              event.preventDefault()
              toggleMark('underline')
            }}
          >
            U
          </button>
        </div>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
            if (!event.ctrlKey && !event.metaKey) return

            const key = event.key.toLowerCase()
            if (key === 'b') {
              event.preventDefault()
              toggleMark('bold')
            } else if (key === 'i') {
              event.preventDefault()
              toggleMark('italic')
            } else if (key === 'u') {
              event.preventDefault()
              toggleMark('underline')
            }
          }}
        />
      </Slate>
    </div>
  )
}


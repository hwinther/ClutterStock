import React, { useCallback, useEffect, useState } from 'react'
import { createEditor, Editor, Text, Transforms, type Descendant } from 'slate'
import { Slate, Editable, withReact, type RenderLeafProps } from 'slate-react'

type EditorValue = Descendant[]

const initialValue: EditorValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  } as any,
]

type MarkFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'superscript' | 'subscript'
type BlockFormat =
  | 'paragraph'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'block-quote'
  | 'bulleted-list'
  | 'numbered-list'
  | 'code-block'

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
        if (Array.isArray(parsed)) {
          setValue(parsed)
          setDocKey((key) => key + 1)
          return
        }
      } catch {
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
    (format: MarkFormat) => {
      const [match] = Editor.nodes(editor, {
        match: (n) => Text.isText(n) && (n as any)[format] === true,
        universal: true,
      })
      return !!match
    },
    [editor],
  )

  const toggleMark = useCallback(
    (format: MarkFormat) => {
      const active = isMarkActive(format)
      if (active) {
        Editor.removeMark(editor, format)
      } else {
        Editor.addMark(editor, format, true)
      }
    },
    [editor, isMarkActive],
  )

  const isBlockActive = useCallback(
    (format: BlockFormat) => {
      if (format === 'bulleted-list' || format === 'numbered-list') {
        const [match] = Editor.nodes(editor, {
          match: (n) => (n as any).type === 'list-item',
        })
        if (!match) return false
        const [, path] = match
        const [parent] = Editor.parent(editor, path)
        return (parent as any).type === format
      }
      const [match] = Editor.nodes(editor, {
        match: (n) => (n as any).type === format,
      })
      return !!match
    },
    [editor],
  )

  const toggleBlock = useCallback(
    (format: BlockFormat) => {
      if (format === 'bulleted-list' || format === 'numbered-list') {
        const isList = isBlockActive('bulleted-list') || isBlockActive('numbered-list')
        const isCurrentList =
          format === 'bulleted-list' ? isBlockActive('bulleted-list') : isBlockActive('numbered-list')

        if (isCurrentList) {
          Transforms.unwrapNodes(editor, {
            match: (n) =>
              (n as any).type === 'bulleted-list' || (n as any).type === 'numbered-list',
          })
          Transforms.setNodes(editor, { type: 'paragraph' }, { match: (n) => (n as any).type === 'list-item' })
        } else if (isList) {
          Transforms.setNodes(editor, { type: format }, {
            match: (n) =>
              (n as any).type === 'bulleted-list' || (n as any).type === 'numbered-list',
          })
        } else {
          Transforms.setNodes(editor, { type: 'list-item' })
          Transforms.wrapNodes(editor, { type: format, children: [] })
        }
      } else {
        const isActive = isBlockActive(format)
        Transforms.setNodes(editor, {
          type: isActive ? 'paragraph' : format,
        })
      }
    },
    [editor, isBlockActive],
  )

  const renderElement = useCallback((props: any) => {
    const { attributes, children, element } = props
    switch (element.type) {
      case 'heading-one':
        return (
          <h1 {...attributes} className="slate-heading-one">
            {children}
          </h1>
        )
      case 'heading-two':
        return (
          <h2 {...attributes} className="slate-heading-two">
            {children}
          </h2>
        )
      case 'heading-three':
        return (
          <h3 {...attributes} className="slate-heading-three">
            {children}
          </h3>
        )
      case 'block-quote':
        return (
          <blockquote {...attributes} className="slate-block-quote">
            {children}
          </blockquote>
        )
      case 'bulleted-list':
        return (
          <ul {...attributes} className="slate-bulleted-list">
            {children}
          </ul>
        )
      case 'numbered-list':
        return (
          <ol {...attributes} className="slate-numbered-list">
            {children}
          </ol>
        )
      case 'list-item':
        return (
          <li {...attributes} className="slate-list-item">
            {children}
          </li>
        )
      case 'code-block':
        return (
          <pre {...attributes} className="slate-code-block">
            <code>{children}</code>
          </pre>
        )
      case 'paragraph':
      default:
        return <p {...attributes}>{children}</p>
    }
  }, [])

  const renderLeaf = useCallback(
    (props: RenderLeafProps) => {
      const { attributes, children, leaf } = props

      let content = children
      if ((leaf as any).bold) content = <strong>{content}</strong>
      if ((leaf as any).italic) content = <em>{content}</em>
      if ((leaf as any).underline) content = <u>{content}</u>
      if ((leaf as any).strikethrough) content = <s>{content}</s>
      if ((leaf as any).code) content = <code className="slate-inline-code">{content}</code>
      if ((leaf as any).superscript) content = <sup>{content}</sup>
      if ((leaf as any).subscript) content = <sub>{content}</sub>

      return <span {...attributes}>{content}</span>
    },
    [],
  )

  const BlockButton = ({
    format,
    label,
    title,
  }: {
    format: BlockFormat
    label: string
    title: string
  }) => {
    const isActive = isBlockActive(format)
    return (
      <button
        type="button"
        className={isActive ? 'active' : ''}
        title={title}
        onMouseDown={(e) => {
          e.preventDefault()
          toggleBlock(format)
        }}
      >
        {label}
      </button>
    )
  }

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase()
        if (key === 'b') {
          event.preventDefault()
          toggleMark('bold')
          return
        }
        if (key === 'i') {
          event.preventDefault()
          toggleMark('italic')
          return
        }
        if (key === 'u') {
          event.preventDefault()
          toggleMark('underline')
          return
        }
        if (key === 's' && !event.shiftKey) {
          event.preventDefault()
          toggleMark('strikethrough')
          return
        }
        if (key === '`' || key === 'k') {
          event.preventDefault()
          toggleMark('code')
          return
        }
      }
    },
    [toggleMark],
  )

  return (
    <div className="editor-container">
      <Slate key={docKey} editor={editor} initialValue={value} onChange={handleChange}>
        <div className="editor-toolbar">
          <button
            type="button"
            className={isMarkActive('bold') ? 'active' : ''}
            title="Bold (Ctrl+B)"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('bold')
            }}
          >
            B
          </button>
          <button
            type="button"
            className={isMarkActive('italic') ? 'active' : ''}
            title="Italic (Ctrl+I)"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('italic')
            }}
          >
            I
          </button>
          <button
            type="button"
            className={isMarkActive('underline') ? 'active' : ''}
            title="Underline (Ctrl+U)"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('underline')
            }}
          >
            U
          </button>
          <button
            type="button"
            className={isMarkActive('strikethrough') ? 'active' : ''}
            title="Strikethrough (Ctrl+S)"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('strikethrough')
            }}
          >
            S̶
          </button>
          <button
            type="button"
            className={isMarkActive('code') ? 'active' : ''}
            title="Code (Ctrl+K)"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('code')
            }}
          >
            {'</>'}
          </button>
          <button
            type="button"
            className={isMarkActive('superscript') ? 'active' : ''}
            title="Superscript"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('superscript')
            }}
          >
            x²
          </button>
          <button
            type="button"
            className={isMarkActive('subscript') ? 'active' : ''}
            title="Subscript"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleMark('subscript')
            }}
          >
            x₂
          </button>
          <span className="toolbar-sep" />
          <BlockButton format="heading-one" label="H1" title="Heading 1" />
          <BlockButton format="heading-two" label="H2" title="Heading 2" />
          <BlockButton format="heading-three" label="H3" title="Heading 3" />
          <BlockButton format="block-quote" label="“" title="Block quote" />
          <BlockButton format="bulleted-list" label="•" title="Bullet list" />
          <BlockButton format="numbered-list" label="1." title="Numbered list" />
          <BlockButton format="code-block" label="```" title="Code block" />
        </div>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
        />
      </Slate>
    </div>
  )
}


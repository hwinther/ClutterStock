import React, { useCallback, useEffect } from 'react'
import type { Value } from 'platejs'
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react'
import { CodeBlockPlugin } from '@platejs/code-block/react'
import { IndentPlugin } from '@platejs/indent/react'
import { ListStyleType, toggleList, someList } from '@platejs/list'
import { ListPlugin } from '@platejs/list/react'
import { KEYS } from 'platejs'
import { Plate, PlateContent, usePlateEditor, useEditorRef, useEditorSelector } from 'platejs/react'

const initialValue: Value = [
  {
    type: 'p',
    children: [{ text: '' }],
  },
]

const SLATE_TO_PLATE: Record<string, string> = {
  paragraph: 'p',
  'heading-one': 'h1',
  'heading-two': 'h2',
  'heading-three': 'h3',
  'block-quote': 'blockquote',
  'bulleted-list': 'ul',
  'numbered-list': 'ol',
  'list-item': 'li',
  'code-block': 'code_block',
}

function migrateSlateToPlate(nodes: unknown): Value {
  if (!Array.isArray(nodes)) return initialValue
  const migrate = (node: unknown): unknown => {
    if (!node || typeof node !== 'object') return node
    const n = node as Record<string, unknown>
    const type = n.type as string
    const mapped = SLATE_TO_PLATE[type] ?? type
    const children = Array.isArray(n.children)
      ? (n.children as unknown[]).map(migrate)
      : n.children
    if (mapped !== type) {
      return { ...n, type: mapped, children }
    }
    return { ...n, ...(children !== undefined && { children }) }
  }
  const result = nodes.map(migrate) as Value
  return result.length > 0 ? result : initialValue
}

function toPlateValue(contents: string): Value {
  try {
    const parsed = JSON.parse(contents) as unknown
    return migrateSlateToPlate(parsed)
  } catch {
    const lines = contents.split(/\r?\n/)
    return lines.map((line) => ({
      type: 'p',
      children: [{ text: line }],
    })) as Value
  }
}

export interface PlateNotepadProps {
  onChange?: () => void
}

export const PlateNotepad: React.FC<PlateNotepadProps> = ({ onChange }) => {
  const editor = usePlateEditor({
    id: 'plate-notepad',
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      SubscriptPlugin,
      SuperscriptPlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
      BlockquotePlugin,
      CodeBlockPlugin,
      IndentPlugin.configure({
        inject: {
          targetPlugins: [KEYS.p, ...KEYS.heading, KEYS.blockquote, KEYS.codeBlock],
        },
      }),
      ListPlugin.configure({
        inject: {
          targetPlugins: [KEYS.p, ...KEYS.heading, KEYS.blockquote, KEYS.codeBlock],
        },
      }),
    ],
    value: initialValue,
  })

  useEffect(() => {
    const handleNew = () => {
      editor.tf.setValue(initialValue)
    }

    const handleLoad = (event: Event) => {
      const custom = event as CustomEvent<{ contents: string }>
      const value = toPlateValue(custom.detail.contents)
      editor.tf.setValue(value)
    }

    const handleRequestSerialize = () => {
      const value = editor.children
      const json = JSON.stringify(value)
      window.dispatchEvent(new CustomEvent('plate-notepad:serialize', { detail: json }))
    }

    window.addEventListener('plate-notepad:new', handleNew)
    window.addEventListener('plate-notepad:load', handleLoad as EventListener)
    window.addEventListener('plate-notepad:request-serialize', handleRequestSerialize as EventListener)

    return () => {
      window.removeEventListener('plate-notepad:new', handleNew)
      window.removeEventListener('plate-notepad:load', handleLoad as EventListener)
      window.removeEventListener('plate-notepad:request-serialize', handleRequestSerialize as EventListener)
    }
  }, [editor])

  return (
    <div className="editor-container">
      <Plate
        editor={editor}
        onChange={({ value }) => {
          if (value && value.length > 0) onChange?.()
        }}
      >
        <div className="editor-toolbar">
          <MarkButton nodeType="bold" label="B" title="Bold (Ctrl+B)" />
          <MarkButton nodeType="italic" label="I" title="Italic (Ctrl+I)" />
          <MarkButton nodeType="underline" label="U" title="Underline (Ctrl+U)" />
          <MarkButton nodeType="strikethrough" label="S̶" title="Strikethrough (Ctrl+S)" />
          <MarkButton nodeType="code" label={'</>'} title="Code (Ctrl+K)" />
          <MarkButton nodeType="superscript" label="x²" title="Superscript" />
          <MarkButton nodeType="subscript" label="x₂" title="Subscript" />
          <span className="toolbar-sep" />
          <BlockButton type="h1" label="H1" title="Heading 1" />
          <BlockButton type="h2" label="H2" title="Heading 2" />
          <BlockButton type="h3" label="H3" title="Heading 3" />
          <BlockButton type="blockquote" label={'"'} title="Block quote" />
          <ListButton listStyleType={ListStyleType.Disc} label="•" title="Bullet list" />
          <ListButton listStyleType={ListStyleType.Decimal} label="1." title="Numbered list" />
          <BlockButton type="code_block" label="```" title="Code block" />
        </div>
        <PlateContent
          className="editor-content"
          placeholder="Type here..."
          renderElement={renderElement}
        />
      </Plate>
    </div>
  )
}

function MarkButton({ nodeType, label, title }: { nodeType: string; label: string; title: string }) {
  const editor = useEditorRef()
  const isActive = useEditorSelector(
    (e) => !!e.marks && (e.marks as Record<string, unknown>)[nodeType] === true,
    [nodeType],
  )
  const toggle = useCallback(() => {
    if (editor) (editor.tf as unknown as Record<string, { toggle: () => void }>)[nodeType]?.toggle()
  }, [editor, nodeType])

  return (
    <button type="button" className={isActive ? 'active' : ''} title={title} onMouseDown={(e) => { e.preventDefault(); toggle() }}>
      {label}
    </button>
  )
}

function BlockButton({ type, label, title }: { type: string; label: string; title: string }) {
  const editor = useEditorRef()
  const isActive = useEditorSelector(
    (e) => {
      const [match] = Array.from(e.api.nodes({ match: (n: { type?: string }) => n.type === type }))
      return !!match
    },
    [type],
  )
  const toggle = useCallback(() => {
    if (editor) (editor.tf as unknown as Record<string, { toggle: () => void }>)[type]?.toggle()
  }, [editor, type])
  return (
    <button type="button" className={isActive ? 'active' : ''} title={title} onMouseDown={(e) => { e.preventDefault(); toggle() }}>
      {label}
    </button>
  )
}

function ListButton({ listStyleType, label, title }: { listStyleType: string; label: string; title: string }) {
  const editor = useEditorRef()
  const pressed = useEditorSelector((e) => someList(e, listStyleType), [listStyleType])

  return (
    <button
      type="button"
      className={pressed ? 'active' : ''}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        if (editor) toggleList(editor, { listStyleType })
      }}
    >
      {label}
    </button>
  )
}

function renderElement(props: { attributes: React.HTMLAttributes<HTMLElement>; children: React.ReactNode; element: { type?: string } }) {
  const { attributes, children, element } = props
  const type = element.type ?? 'p'

  const className = {
    h1: 'slate-heading-one',
    h2: 'slate-heading-two',
    h3: 'slate-heading-three',
    blockquote: 'slate-block-quote',
    code_block: 'slate-code-block',
  }[type]

  switch (type) {
    case 'h1':
      return <h1 {...attributes} className={className}>{children}</h1>
    case 'h2':
      return <h2 {...attributes} className={className}>{children}</h2>
    case 'h3':
      return <h3 {...attributes} className={className}>{children}</h3>
    case 'blockquote':
      return <blockquote {...attributes} className={className}>{children}</blockquote>
    case 'code_block':
      return <pre {...attributes} className={className}><code>{children}</code></pre>
    default:
      return <p {...attributes}>{children}</p>
  }
}

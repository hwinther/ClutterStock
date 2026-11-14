import type { ComponentProps } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ItemResponse, LocationResponse, RoomResponse } from '~/api/client'
import { renderWithAction } from '~/test/router'
import { TuiItemEdit } from './tui-item-edit'

const locations = [
  { id: 1, name: 'Home' },
  { id: 2, name: 'Cabin' },
  { id: 3, name: 'Empty' },
] as LocationResponse[]
const rooms = [
  { id: 10, name: 'Office', locationId: 1 },
  { id: 20, name: 'Shed', locationId: 2 },
] as RoomResponse[]
const item = {
  id: 7,
  name: 'Desk lamp',
  category: 'Lighting',
  description: 'Brass',
  notes: 'Needs a bulb',
  roomId: 10,
} as ItemResponse

function setup(respond?: (form: FormData) => unknown, props: Partial<ComponentProps<typeof TuiItemEdit>> = {}) {
  const callbacks = { onCancel: vi.fn(), onSaved: vi.fn(), onDelete: vi.fn() }
  const view = renderWithAction(
    <TuiItemEdit item={item} rooms={rooms} locations={locations} {...callbacks} {...props} />,
    respond,
  )
  return { ...view, ...callbacks }
}

// The name field comes first and has no label of its own (the TUI prints "name :" beside it).
const nameInput = () => screen.getAllByRole('textbox')[0]!
const save = () => fireEvent.click(screen.getByRole('button', { name: /\[\^S\]/ }))

describe('TuiItemEdit', () => {
  it('fills the fields from the item and groups rooms by location', () => {
    setup()
    expect(screen.getByText('─[ edit · #7 ]─')).toBeInTheDocument()
    expect(nameInput()).toHaveValue('Desk lamp')
    expect(nameInput()).toHaveFocus()
    expect(screen.getByDisplayValue('Lighting')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Needs a bulb')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Room' }))
    expect(screen.getByText('── Home ──')).toBeInTheDocument()
    expect(screen.getByText('── Cabin ──')).toBeInTheDocument()
    expect(screen.queryByText('── Empty ──')).not.toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('option', { name: /Shed/ }))
    expect(screen.getByText('Cabin')).toBeInTheDocument()
  })

  it('shows a dash for the location of an item without a room', () => {
    setup(undefined, { item: { ...item, roomId: undefined } })
    // One for the room picker, one for the location.
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('names unnamed locations and rooms', () => {
    setup(undefined, {
      locations: [{ id: 1 }] as LocationResponse[],
      rooms: [{ id: 10, locationId: 1 }] as RoomResponse[],
    })
    expect(screen.getByText('—')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Room' }))
    expect(screen.getByText('── Location ──')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Room/ })).toBeInTheDocument()
  })

  it('requires a name', () => {
    const { action } = setup()
    fireEvent.change(nameInput(), { target: { value: '   ' } })
    save()
    expect(screen.getByText('! name is required')).toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('saves with Ctrl+S and reports the saved item', async () => {
    const saved = { ...item, name: 'Floor lamp' }
    const { submissions, onSaved } = setup(() => ({ ok: true, intent: 'update-item', item: saved }))
    fireEvent.change(nameInput(), { target: { value: 'Floor lamp' } })

    fireEvent.keyDown(nameInput(), { key: 's', ctrlKey: true })
    expect(await screen.findByText('[^S] saving…')).toBeInTheDocument()

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved))
    expect(submissions[0]).toEqual({
      _intent: 'update-item',
      itemId: '7',
      name: 'Floor lamp',
      category: 'Lighting',
      roomId: '10',
      description: 'Brass',
      notes: 'Needs a bulb',
    })
  })

  it('saves with Cmd+Enter too', async () => {
    const { action } = setup()
    fireEvent.keyDown(nameInput(), { key: 'Enter', metaKey: true })
    await waitFor(() => expect(action).toHaveBeenCalled())
  })

  it("shows the server's error and does not report a save", async () => {
    const { onSaved } = setup(() => ({ ok: false, error: 'Room not found' }))
    save()
    expect(await screen.findByText('! Room not found')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('does not report a save for another intent', async () => {
    const { onSaved, action } = setup(() => ({ ok: true, intent: 'delete-item' }))
    save()
    await waitFor(() => expect(action).toHaveBeenCalled())
    expect(await screen.findByText('[^S] save')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('cancels with Escape or the button and deletes with the button', () => {
    const { onCancel, onDelete, action } = setup()
    fireEvent.keyDown(nameInput(), { key: 'Escape' })
    fireEvent.keyDown(nameInput(), { key: 's' })
    fireEvent.click(screen.getByRole('button', { name: '[Esc] cancel' }))
    fireEvent.click(screen.getByRole('button', { name: '[d] delete' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(action).not.toHaveBeenCalled()
  })
})

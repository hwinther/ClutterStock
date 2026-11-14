import type { ComponentProps } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ItemResponse, LocationResponse, RoomResponse } from '~/api/client'
import { renderWithAction } from '~/test/router'
import { ItemEditPanel } from './item-edit-panel'

const locations = [
  { id: 1, name: 'Home' },
  { id: 2, name: 'Cabin' },
  { id: 3, name: 'Empty' },
] as LocationResponse[]
const rooms = [
  { id: 10, name: 'Office', locationId: 1 },
  { id: 11, name: 'Kitchen', locationId: 1 },
  { id: 20, name: 'Shed', locationId: 2 },
  { id: 30, name: 'Loose' },
] as RoomResponse[]
const item = {
  id: 7,
  name: 'Desk lamp',
  category: 'Lighting',
  description: 'Brass',
  notes: 'Needs a bulb',
  roomId: 10,
} as ItemResponse

type Props = ComponentProps<typeof ItemEditPanel>

function setup(props: Partial<Props> = {}, respond?: (form: FormData) => unknown) {
  const callbacks = { onClose: vi.fn(), onSaved: vi.fn(), onDeleted: vi.fn() }
  const view = renderWithAction(
    <ItemEditPanel rooms={rooms} locations={locations} {...callbacks} {...props} />,
    respond,
  )
  return { ...view, ...callbacks }
}

const nameInput = () => screen.getByPlaceholderText('e.g. Vintage Lamp')
const roomSelect = () => screen.getByRole('combobox')
const submit = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }))

describe('ItemEditPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('new item', () => {
    it('offers the rooms grouped by location and starts on the default room', () => {
      setup({ defaultRoomId: 20 })
      expect(screen.getByText('NEW ITEM')).toBeInTheDocument()
      expect(roomSelect()).toHaveValue('20')
      expect(screen.getByRole('group', { name: 'Home' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Cabin' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Empty' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Delete item' })).not.toBeInTheDocument()
      expect(screen.queryByTitle('New room')).not.toBeInTheDocument()
    })

    it('starts on the first room without a default', () => {
      setup()
      expect(roomSelect()).toHaveValue('10')
    })

    it('asks for a new room', () => {
      const onNewRoom = vi.fn()
      setup({ onNewRoom })
      fireEvent.click(screen.getByTitle('New room'))
      expect(onNewRoom).toHaveBeenCalledWith()
    })

    it('requires a name', () => {
      const { action } = setup()
      // Blank but not empty, so the browser's own required check lets the submit through.
      fireEvent.change(nameInput(), { target: { value: '   ' } })
      submit('Create item')
      expect(screen.getByText('Name is required.')).toBeInTheDocument()
      expect(action).not.toHaveBeenCalled()
    })

    it('creates the item and reports it', async () => {
      const created = { id: 8, name: 'Kettle', roomId: 11 } as ItemResponse
      const { submissions, onSaved } = setup({}, () => ({ ok: true, intent: 'create-item', item: created }))
      fireEvent.change(nameInput(), { target: { value: 'Kettle' } })
      fireEvent.change(roomSelect(), { target: { value: '11' } })

      submit('Create item')
      expect(await screen.findByRole('button', { name: 'Saving…' })).toBeInTheDocument()

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(created))
      expect(submissions[0]).toMatchObject({ _intent: 'create-item', roomId: '11', name: 'Kettle' })
      expect(submissions[0]).not.toHaveProperty('itemId')
    })
  })

  describe('existing item', () => {
    it("shows the item's room and location read-only", () => {
      setup({ item })
      expect(screen.getByText('EDIT ITEM #7')).toBeInTheDocument()
      expect(screen.getByText('Home / Office')).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g. Brass table lamp, 1980s')).toHaveValue('Brass')
    })

    it('shows only the room name when the room has no location, and a dash for an unknown room', () => {
      const { unmount } = setup({ item: { ...item, roomId: 30 } })
      expect(screen.getByText('Loose')).toBeInTheDocument()
      unmount()
      setup({ item: { ...item, roomId: 99 } })
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('saves changes, carrying the room id, and reports the saved item', async () => {
      const saved = { ...item, notes: '' }
      const { submissions, onSaved } = setup({ item }, () => ({
        ok: true,
        intent: 'update-item',
        item: saved,
      }))
      submit('Save changes')
      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved))
      expect(submissions[0]).toMatchObject({
        _intent: 'update-item',
        itemId: '7',
        roomId: '10',
        name: 'Desk lamp',
      })
    })

    it('sends no room for an item without one', async () => {
      const { submissions, action } = setup({ item: { ...item, roomId: undefined } })
      submit('Save changes')
      await waitFor(() => expect(action).toHaveBeenCalled())
      expect(submissions[0]).not.toHaveProperty('roomId')
    })

    it("shows the server's error", async () => {
      const { onSaved } = setup({ item }, () => ({ ok: false, error: 'Conflict' }))
      submit('Save changes')
      expect(await screen.findByText('Conflict')).toBeInTheDocument()
      expect(onSaved).not.toHaveBeenCalled()
    })

    it('deletes after confirming', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const { submissions, onDeleted } = setup({ item }, () => ({ ok: true, intent: 'delete-item' }))
      submit('Delete item')
      await waitFor(() => expect(onDeleted).toHaveBeenCalled())
      expect(submissions[0]).toEqual({ _intent: 'delete-item', itemId: '7' })
    })

    it('keeps the item when the delete is not confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const { action } = setup({ item })
      submit('Delete item')
      expect(action).not.toHaveBeenCalled()
    })

    it('closes from the cancel button', () => {
      const { onClose } = setup({ item })
      submit('Cancel')
      expect(onClose).toHaveBeenCalled()
    })
  })
})

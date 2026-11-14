import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LocationResponse, RoomResponse } from '~/api/client'
import { renderWithAction } from '~/test/router'
import { RoomFormPanel } from './room-form-panel'

const locations = [
  { id: 1, name: 'Home' },
  { id: 2, name: 'Cabin' },
] as LocationResponse[]

function setup(props: { locations?: LocationResponse[]; defaultLocationId?: number } = {}, respond?: () => unknown) {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  const view = renderWithAction(
    <RoomFormPanel
      locations={props.locations ?? locations}
      defaultLocationId={props.defaultLocationId}
      onClose={onClose}
      onCreated={onCreated}
    />,
    respond,
  )
  return { ...view, onClose, onCreated }
}

const nameInput = () => screen.getByPlaceholderText('e.g. Garage, Living Room')
const create = () => fireEvent.click(screen.getByRole('button', { name: 'Create room' }))

describe('RoomFormPanel', () => {
  it('offers the locations and starts on the default one', () => {
    setup({ defaultLocationId: 2 })
    expect(screen.getByText('NEW ROOM')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('2')
    expect(screen.getByRole('option', { name: 'Home' })).toBeInTheDocument()
  })

  it('starts on the first location without a default', () => {
    setup()
    expect(screen.getByRole('combobox')).toHaveValue('1')
  })

  it('requires a name', () => {
    const { action } = setup()
    // Blank but not empty, so the browser's own required check lets the submit through.
    fireEvent.change(nameInput(), { target: { value: '  ' } })
    create()
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('requires a location', () => {
    const { action } = setup({ locations: [] })
    fireEvent.change(nameInput(), { target: { value: 'Garage' } })
    create()
    expect(screen.getByText('Select a location.')).toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('creates the room and reports it', async () => {
    const room = { id: 9, name: 'Garage', locationId: 2 } as RoomResponse
    const { submissions, onCreated } = setup({}, () => ({ ok: true, intent: 'create-room', room }))
    fireEvent.change(nameInput(), { target: { value: 'Garage' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. North-facing bedroom'), { target: { value: 'Cold' } })
    create()

    expect(await screen.findByRole('button', { name: 'Creating…' })).toBeInTheDocument()
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(room))
    expect(submissions[0]).toEqual({ _intent: 'create-room', locationId: '2', name: 'Garage', description: 'Cold' })
  })

  it("shows the server's error and reports nothing", async () => {
    const { onCreated } = setup({}, () => ({ ok: false, error: 'Duplicate name' }))
    fireEvent.change(nameInput(), { target: { value: 'Garage' } })
    create()
    expect(await screen.findByText('Duplicate name')).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('closes from the cancel button and the header', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: '×' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LocationResponse } from '~/api/client'
import { renderWithAction } from '~/test/router'
import { LocationFormPanel } from './location-form-panel'

function setup(respond?: () => unknown) {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  const view = renderWithAction(<LocationFormPanel onClose={onClose} onCreated={onCreated} />, respond)
  return { ...view, onClose, onCreated }
}

const nameInput = () => screen.getByPlaceholderText('e.g. Home, Storage Unit')
const create = () => fireEvent.click(screen.getByRole('button', { name: 'Create location' }))

describe('LocationFormPanel', () => {
  it('requires a name', () => {
    const { action } = setup()
    // Blank but not empty, so the browser's own required check lets the submit through.
    fireEvent.change(nameInput(), { target: { value: '  ' } })
    create()
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(action).not.toHaveBeenCalled()
  })

  it('creates the location and reports it', async () => {
    const location = { id: 3, name: 'Storage' } as LocationResponse
    const { submissions, onCreated } = setup(() => ({ ok: true, intent: 'create-location', location }))
    fireEvent.change(nameInput(), { target: { value: 'Storage' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Main house on Oak Street'), { target: { value: 'Unit 4' } })
    create()

    expect(await screen.findByRole('button', { name: 'Creating…' })).toBeInTheDocument()
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(location))
    expect(submissions[0]).toEqual({ _intent: 'create-location', name: 'Storage', description: 'Unit 4' })
  })

  it("shows the server's error and reports nothing", async () => {
    const { onCreated } = setup(() => ({ ok: false, error: 'Duplicate name' }))
    fireEvent.change(nameInput(), { target: { value: 'Storage' } })
    create()
    expect(await screen.findByText('Duplicate name')).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('closes from the cancel button and the header', () => {
    const { onClose } = setup()
    expect(screen.getByText('NEW LOCATION')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: '×' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

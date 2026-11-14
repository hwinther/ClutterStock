import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ItemResponse, LocationResponse, RoomResponse } from '~/api/client'
import { Win98Tree } from './win98-tree'

const locations = [{ id: 1, name: 'Home' }, { id: 2, name: 'Cabin' }, { id: null }] as LocationResponse[]
const rooms = [
  { id: 10, name: 'Office', locationId: 1 },
  { id: 11, locationId: 1 },
] as RoomResponse[]
const items = [
  { id: 1, roomId: 10, category: 'Tools' },
  { id: 2, roomId: 10, category: 'Books' },
  { id: 3, roomId: 11, category: 'Tools' },
] as ItemResponse[]

function setup(props: Partial<ComponentProps<typeof Win98Tree>> = {}) {
  const callbacks = { onSelectRoom: vi.fn(), onSelectCategory: vi.fn(), onAddRoom: vi.fn() }
  const view = render(
    <Win98Tree
      locations={locations}
      rooms={rooms}
      items={items}
      categories={['Tools', 'Books']}
      filterRoomId={null}
      filterCategory={null}
      {...callbacks}
      {...props}
    />,
  )
  return { ...view, ...callbacks }
}

// Room and category rows are buttons; the root and location rows are not, so those are reached
// through their chevrons (root first, then each location with rooms) and icons.
const row = (label: RegExp) => screen.getByRole('button', { name: label })
const [ROOT, HOME] = [0, 1]
const expanded = () => screen.getAllByText('▼')

describe('Win98Tree', () => {
  it('shows locations, their rooms with item counts and the categories', () => {
    setup({ filterRoomId: 10, filterCategory: 'Books' })
    expect(row(/Office \(2\)/)).toBeInTheDocument()
    expect(row(/Room \(1\)/)).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getAllByText('No rooms yet')).toHaveLength(2)
    expect(row(/Tools \(2\)/)).toBeInTheDocument()
    expect(row(/Office \(2\)/)).toHaveClass('win98-tree-row--selected')
    expect(row(/Books \(1\)/)).toHaveClass('win98-tree-row--selected')
    expect(row(/Tools \(2\)/)).not.toHaveClass('win98-tree-row--selected')
    // Only the root and Home have rooms to fold.
    expect(expanded()).toHaveLength(2)
  })

  it('selects rooms and categories', () => {
    const { onSelectRoom, onSelectCategory } = setup()
    fireEvent.click(row(/Office \(2\)/))
    fireEvent.click(row(/Tools \(2\)/))
    expect(onSelectRoom).toHaveBeenCalledWith(10)
    expect(onSelectCategory).toHaveBeenCalledWith('Tools')
  })

  it('adds a room to a location', () => {
    const { onAddRoom } = setup()
    const [homeAdd, cabinAdd, unsavedAdd] = screen.getAllByTitle('New room')
    fireEvent.click(cabinAdd!)
    fireEvent.click(homeAdd!)
    fireEvent.click(unsavedAdd!)
    expect(onAddRoom.mock.calls).toEqual([[2], [1]])
  })

  it('collapses a location from its chevron or its icon', () => {
    setup()
    fireEvent.click(expanded()[HOME]!)
    expect(screen.queryByText(/Office/)).not.toBeInTheDocument()
    expect(screen.getByText('▶')).toBeInTheDocument()

    const [homeIcon, , unsavedIcon] = screen.getAllByText('🏠')
    fireEvent.click(homeIcon!)
    expect(row(/Office \(2\)/)).toBeInTheDocument()

    // A location that was never saved has no id to fold by.
    fireEvent.click(unsavedIcon!)
    expect(screen.getAllByText('No rooms yet')).toHaveLength(2)
  })

  it('collapses the whole tree and the categories', () => {
    setup()
    fireEvent.click(expanded()[ROOT]!)
    expect(screen.queryByText('Home')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '▼ Categories' }))
    expect(screen.queryByText(/Tools/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '▶ Categories' }))
    expect(row(/Tools \(2\)/)).toBeInTheDocument()
  })

  it('leaves out the categories section when there are none', () => {
    setup({ categories: [] })
    expect(screen.queryByText(/Categories/)).not.toBeInTheDocument()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ItemResponse, LocationResponse, RoomResponse } from '~/api/client'
import { TuiItemDetail } from './tui-item-detail'
import { TuiItemTable } from './tui-item-table'

const office = { id: 10, name: 'Office', locationId: 1 } as RoomResponse
const items = [
  { id: 7, name: 'Desk lamp', roomId: 10, category: 'Lighting', updatedAtUtc: '2026-03-04T10:00:00Z' },
  { id: 8, createdAtUtc: 'not a date' },
  { id: 9, name: 'Chair', roomId: 99 },
] as ItemResponse[]

describe('TuiItemTable', () => {
  it('lists the items with room, category and date, and marks the selection', () => {
    render(<TuiItemTable items={items} roomById={{ 10: office }} selectedId={7} onSelect={vi.fn()} totalCount={12} />)
    expect(screen.getByText('─[ items · 3 of 12 ]─')).toBeInTheDocument()

    const [lamp, unnamed, chair] = screen.getAllByRole('button')
    expect(lamp).toHaveAttribute('data-selected', 'true')
    expect(lamp).toHaveTextContent(/^007▶ Desk lampOfficeLighting2026-03-04$/)
    expect(unnamed).toHaveTextContent(/^008\s+————$/)
    expect(chair).not.toHaveAttribute('data-selected')
    expect(chair).toHaveTextContent(/Chair—/)
  })

  it('selects an item on click and shows the plain count without a filter', () => {
    const onSelect = vi.fn()
    render(<TuiItemTable items={items} roomById={{}} onSelect={onSelect} totalCount={3} />)
    expect(screen.getByText('─[ items · 3 ]─')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button')[2]!)
    expect(onSelect).toHaveBeenCalledWith(items[2])
  })
})

describe('TuiItemDetail', () => {
  const home = { id: 1, name: 'Home' } as LocationResponse

  it('shows the item and offers edit and delete', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <TuiItemDetail
        item={{ ...items[0]!, description: 'Brass', notes: 'Needs a bulb' }}
        room={office}
        location={home}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )
    expect(screen.getByText('─[ detail · #7 ]─')).toBeInTheDocument()
    expect(screen.getByText('Needs a bulb')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '[e]dit' }))
    fireEvent.click(screen.getByRole('button', { name: '[d]elete' }))
    expect(onEdit).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalled()
  })

  it('fills in what the item lacks', () => {
    render(<TuiItemDetail item={{ id: 8 } as ItemResponse} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getAllByText('—')).toHaveLength(4)
    expect(screen.getByText('(none)')).toBeInTheDocument()
    expect(screen.getByText('(none — press [e] to edit)')).toBeInTheDocument()
  })
})

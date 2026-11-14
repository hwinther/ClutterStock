import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LocationResponse, RoomResponse } from '~/api/client'
import { CDEFootRow, CDEMenuBar, Win98AddressBar, Win98MenuBar, Win98StatusBar } from './theme-chrome'

const home = { id: 1, name: 'Home' } as LocationResponse
const office = { id: 10, name: 'Office', locationId: 1 } as RoomResponse

describe('theme chrome', () => {
  it('CDE menu bar lists its menus', () => {
    render(<CDEMenuBar />)
    expect(screen.getByText('Selected')).toBeInTheDocument()
  })

  it('CDE foot row: only Add does something', () => {
    const onNewItem = vi.fn()
    render(<CDEFootRow onNewItem={onNewItem} />)
    fireEvent.click(screen.getByRole('button', { name: 'Items' }))
    expect(onNewItem).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onNewItem).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Items' })).toHaveClass('cde-footrow-btn--primary')
  })

  it('Win98 menu bar underlines each access key', () => {
    render(<Win98MenuBar />)
    expect(screen.getByText('T', { selector: 'u' })).toBeInTheDocument()
    expect(screen.getByText('ools')).toBeInTheDocument()
  })

  it.each([
    [undefined, undefined, 'C:\\ClutterStock\\All Items'],
    [home, undefined, 'C:\\ClutterStock\\Home'],
    [home, office, 'C:\\ClutterStock\\Home\\Office'],
    [undefined, office, 'C:\\ClutterStock\\All Items'],
  ])('Win98 address bar for %o / %o is %s', (location, room, path) => {
    render(<Win98AddressBar location={location} room={room} />)
    expect(screen.getByText(path)).toBeInTheDocument()
  })

  it.each([
    [undefined, undefined, 'All Items'],
    [home, undefined, 'Home'],
    [home, office, 'Home\\Office'],
  ])('Win98 status bar for %o / %o shows %s', (location, room, path) => {
    render(<Win98StatusBar count={4} location={location} room={room} />)
    expect(screen.getByText('4 object(s)')).toBeInTheDocument()
    expect(screen.getByText(path)).toBeInTheDocument()
    expect(screen.getByText(new Date().toLocaleDateString())).toBeInTheDocument()
  })
})

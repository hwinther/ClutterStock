import type { ComponentProps } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ItemResponse, LocationResponse, RoomResponse } from '~/api/client'
import type { SessionUser } from '~/lib/session.server'
import { TuiTerminal } from './tui-terminal'

const locations = [{ id: 1, name: 'Home' }] as LocationResponse[]
const rooms = [
  { id: 10, name: 'Office', locationId: 1 },
  { id: 11, name: 'Shed', locationId: 99 },
] as RoomResponse[]
const items = [
  { id: 7, name: 'Desk lamp', roomId: 10, category: 'Lighting' },
  { id: 8, name: 'A very long item name that will not fit', category: null },
] as ItemResponse[]

type Props = ComponentProps<typeof TuiTerminal>

function renderTerminal(props: Partial<Props> = {}, user: SessionUser | null = null) {
  const onClose = vi.fn()
  const onFilter = vi.fn()
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        path: '/',
        loader: () => ({ user }),
        element: (
          <TuiTerminal
            open
            onClose={onClose}
            onFilter={onFilter}
            items={items}
            rooms={rooms}
            locations={locations}
            currentFilter=""
            {...props}
          />
        ),
      },
      { path: '/auth/signout', element: <p>signed out</p> },
    ],
    // Start hydrated, as after SSR, so the root loader data is there on the first render.
    { initialEntries: ['/'], hydrationData: { loaderData: { root: { user } } } },
  )
  render(<RouterProvider router={router} />)
  const input = screen.queryByRole('textbox', { name: 'Command' })
  return { input: input!, onClose, onFilter, router }
}

// The submit event bubbles from the input to the prompt's form.
function run(input: HTMLElement, command: string) {
  fireEvent.change(input, { target: { value: command } })
  fireEvent.submit(input)
}

// The scrollback lines have no role to query them by.
const lines = () =>
  // eslint-disable-next-line testing-library/no-node-access -- see above
  Array.from(document.querySelectorAll('.tui-terminal-line'), (el) => el.textContent ?? '')

describe('TuiTerminal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing while closed', () => {
    renderTerminal({ open: false })
    expect(screen.queryByRole('region', { name: 'Terminal' })).not.toBeInTheDocument()
  })

  it('focuses the prompt and shows the intro', () => {
    const { input } = renderTerminal()
    expect(input).toHaveFocus()
    expect(lines()[0]).toBe('clutter:stock terminal')
  })

  it('echoes commands, lists help and clears the scrollback', () => {
    const { input } = renderTerminal()

    run(input, '  help ')
    expect(lines()).toContain('$ help')
    expect(lines()).toContain('  filter <text>       narrow visible items')
    expect(input).toHaveValue('')

    run(input, '   ')
    run(input, 'cls')
    expect(lines()).toEqual([])
  })

  it.each([
    ['rm -rf /', "unknown command: rm  (try 'help')"],
    ['list', 'usage: list rooms | list items'],
    ['filter', 'filter is empty'],
    ['whoami', '(unauthenticated)'],
  ])('answers %s with %s', (command, answer) => {
    const { input } = renderTerminal()
    run(input, command)
    expect(lines().at(-1)).toBe(answer)
  })

  it('lists rooms with their location and item count', () => {
    const { input } = renderTerminal()
    run(input, 'LIST Rooms')
    const out = lines()
    expect(out).toContainEqual(expect.stringMatching(/^ID {3}LOCATION/))
    expect(out).toContainEqual(expect.stringMatching(/^10 {3}Home +Office +1$/))
    expect(out).toContainEqual(expect.stringMatching(/^11 {3}— +Shed +0$/))
    expect(out.at(-1)).toBe('2 rooms')
  })

  it('lists items, cutting long names', () => {
    const { input } = renderTerminal()
    run(input, 'list items')
    const out = lines()
    expect(out).toContainEqual(expect.stringMatching(/^007 {3}Desk lamp +Office +Lighting$/))
    expect(out).toContainEqual(expect.stringMatching(/^008 {3}A very long item name that …—/))
    expect(out.at(-1)).toBe('2 items')
  })

  it('caps the item list at 200 and says how many are left', () => {
    const many = Array.from({ length: 205 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    })) as ItemResponse[]
    const { input } = renderTerminal({ items: many })
    run(input, 'list items')
    expect(lines().slice(-2)).toEqual(["… 5 more (use 'filter <text>' to narrow)", '205 items'])
  })

  it('says when there are no rooms or items', () => {
    const { input } = renderTerminal({ items: [], rooms: [] })
    run(input, 'list rooms')
    expect(lines().at(-1)).toBe('(no rooms)')
    run(input, 'list items')
    expect(lines().at(-1)).toBe('(no items)')
  })

  it('counts one room and one item in the singular', () => {
    const { input } = renderTerminal({ items: [items[0]!], rooms: [rooms[0]!] })
    run(input, 'list rooms')
    expect(lines().at(-1)).toBe('1 room')
    run(input, 'list items')
    expect(lines().at(-1)).toBe('1 item')
  })

  it('sets and clears the filter', () => {
    const { input, onFilter } = renderTerminal({ currentFilter: 'lamp' })
    run(input, 'filter desk lamp')
    expect(onFilter).toHaveBeenLastCalledWith('desk lamp')
    expect(lines().at(-1)).toBe('filter set: "desk lamp"')
    run(input, 'filter')
    expect(onFilter).toHaveBeenLastCalledWith('')
    expect(lines().at(-1)).toBe('filter cleared (was "lamp")')
  })

  it('shows the signed-in user for whoami', () => {
    const { input } = renderTerminal(
      {},
      {
        sub: 'abc',
        name: 'Ada',
        preferred_username: 'ada',
        email: 'ada@example.test',
        groups: ['clutterstock-users', ''],
      },
    )
    run(input, 'whoami')
    expect(lines().slice(-5)).toEqual([
      'user      : Ada',
      'username  : ada',
      'email     : ada@example.test',
      'groups    : clutterstock-users',
      'sub       : abc',
    ])
  })

  it('fills in what the user lacks', () => {
    const { input } = renderTerminal({}, { sub: 'abc' })
    run(input, 'whoami')
    expect(lines().slice(-5, -1)).toEqual([
      'user      : abc',
      'username  : (none)',
      'email     : (none)',
      'groups    : (none)',
    ])
  })

  it('closes on exit, Escape and the close button', () => {
    const { input, onClose } = renderTerminal()
    run(input, ':q')
    fireEvent.keyDown(input, { key: 'Escape' })
    fireEvent.keyDown(input, { key: 'a' })
    fireEvent.click(screen.getByRole('button', { name: 'Close terminal' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('signs out after showing a message', async () => {
    const { input, onClose, router } = renderTerminal()
    vi.useFakeTimers()
    run(input, 'logout')
    expect(lines().at(-1)).toBe('signing out…')
    expect(onClose).toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    expect(router.state.location.pathname).toBe('/auth/signout')
  })
})

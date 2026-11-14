import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionUser } from '~/lib/session.server'
import { SiteHeader } from './site-header'

const ada: SessionUser = {
  sub: 'abc',
  name: 'ada lovelace',
  preferred_username: 'ada',
  email: 'ada@example.test',
  groups: ['clutterstock-users'],
}

function renderHeader(user: SessionUser | null) {
  const router = createMemoryRouter(
    [
      { id: 'root', path: '/', loader: () => ({ user }), element: <SiteHeader /> },
      { path: '/auth/signin', element: <p>sign-in page</p> },
      { path: '/auth/signout', element: <p>sign-out page</p> },
    ],
    // Start hydrated, as after SSR, so the first render happens inside render()'s act.
    { initialEntries: ['/'], hydrationData: { loaderData: { root: { user } } } },
  )
  render(<RouterProvider router={router} />)
  return { router }
}

const toggle = () => screen.getByTitle(/^Theme:/)
const html = document.documentElement
// useTheme hears about data-theme changes through a MutationObserver, which reports after the change;
// findBy waits for the re-render it causes.
const settled = (label: string) => screen.findByText(`[${label}]`, { exact: false })
// The account <dialog> is out of the accessibility tree while closed.
const accountDialog = () => screen.getByRole('dialog', { hidden: true })

describe('SiteHeader', () => {
  beforeEach(() => {
    localStorage.clear()
    html.removeAttribute('data-theme')
  })

  it('cycles SYS → TUI → W98 → CDE → SYS and stores the choice', async () => {
    renderHeader(null)
    expect(toggle()).toHaveTextContent('[SYS]')

    fireEvent.click(toggle())
    await settled('TUI')
    expect(html).toHaveAttribute('data-theme', 'tui')
    expect(localStorage.getItem('cs-theme')).toBe('tui')

    fireEvent.click(toggle())
    await settled('W98')
    fireEvent.click(toggle())
    await settled('CDE')
    expect(toggle()).toHaveAttribute('title', 'Theme: cde — click to cycle')

    fireEvent.click(toggle())
    await settled('SYS')
    expect(html).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem('cs-theme')).toBeNull()
  })

  it('starts from the stored theme', async () => {
    localStorage.setItem('cs-theme', 'win98')
    renderHeader(null)
    await settled('W98')
    expect(html).toHaveAttribute('data-theme', 'win98')
  })

  it('falls back to SYS for a stored value it does not know', async () => {
    localStorage.setItem('cs-theme', 'neon')
    renderHeader(null)
    expect(await settled('SYS')).toBe(toggle())
  })

  it('offers sign-in to an anonymous visitor', () => {
    const { router } = renderHeader(null)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(router.state.location.pathname).toBe('/auth/signin')
  })

  it("shows the user's initial and opens the account dialog", () => {
    renderHeader(ada)
    const pill = screen.getByRole('button', { name: /ada lovelace \(account\)/ })
    expect(pill).toHaveTextContent(/^A/)

    fireEvent.click(pill)
    expect(accountDialog()).toHaveAttribute('open')
    expect(screen.getByText('@ada')).toBeInTheDocument()
    expect(screen.getByText('ada@example.test')).toBeInTheDocument()
    expect(screen.getByText('clutterstock-users')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(accountDialog()).not.toHaveAttribute('open')
  })

  it('closes the dialog on a backdrop click but not a click inside', () => {
    renderHeader(ada)
    fireEvent.click(screen.getByRole('button', { name: /\(account\)/ }))

    fireEvent.click(screen.getByText('Email'))
    expect(accountDialog()).toHaveAttribute('open')
    fireEvent.click(accountDialog())
    expect(accountDialog()).not.toHaveAttribute('open')
  })

  it('signs out from the account dialog', () => {
    const { router } = renderHeader(ada)
    fireEvent.click(screen.getByRole('button', { name: /\(account\)/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(router.state.location.pathname).toBe('/auth/signout')
  })

  it('names a user by username without a name', () => {
    renderHeader({ sub: 'x', preferred_username: 'bob' })
    expect(screen.getByRole('button', { name: /^B\s*bob/ })).toBeInTheDocument()
  })

  it('uses the terminal account panel under the TUI theme', async () => {
    localStorage.setItem('cs-theme', 'tui')
    renderHeader(ada)
    await settled('TUI')

    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByRole('dialog', { name: 'Account' })).toBeInTheDocument()
    const open = screen.getAllByRole('dialog', { hidden: true }).filter((d) => d.hasAttribute('open'))
    expect(open).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.queryByRole('dialog', { name: 'Account' })).not.toBeInTheDocument()
  })
})

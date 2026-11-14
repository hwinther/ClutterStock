import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CategoryTag } from './category-tag'
import { HelpOverlay } from './help-overlay'
import { ItemThumb } from './item-thumb'
import { SiteFooter } from './site-footer'
import { Sparkline } from './sparkline'
import { TuiSearchBar } from './tui-search-bar'
import { TuiPanel, TuiStatusBar } from './tui-widgets'

// useTheme reads data-theme on <html> in an effect (flushed by render), so set it first.
function inTheme(theme: string | null, ui: React.ReactElement) {
  if (theme) document.documentElement.setAttribute('data-theme', theme)
  else document.documentElement.removeAttribute('data-theme')
  return render(ui)
}

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  vi.unstubAllEnvs()
})

describe('CategoryTag', () => {
  it.each([
    ['tui', '[Lighting]'],
    ['win98', 'Lighting'],
    ['cde', 'Lighting'],
    [null, 'Lighting'],
  ])('in theme %s reads %s', (theme, text) => {
    inTheme(theme, <CategoryTag name="Lighting" />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('falls back to a neutral colour for an unknown category', () => {
    inTheme(null, <CategoryTag name="Gizmos" />)
    expect(screen.getByText('Gizmos')).toHaveStyle({ background: 'rgba(120, 120, 140, 0.1)' })
  })
})

describe('ItemThumb', () => {
  it.each([
    ['tui', '##'],
    ['win98', '📄'],
    ['cde', '▣'],
  ])('in theme %s shows %s', (theme, glyph) => {
    inTheme(theme, <ItemThumb name="Lamp" />)
    expect(screen.getByText(glyph)).toBeInTheDocument()
  })

  it('draws a gradient from the name otherwise', () => {
    const { container } = inTheme(null, <ItemThumb name="Lamp" />)
    // eslint-disable-next-line testing-library/no-node-access -- a bare styled div
    expect((container.firstChild as HTMLElement).style.background).toContain('linear-gradient')
  })
})

describe('Sparkline', () => {
  it('draws seven points across the width', () => {
    const { container } = render(<Sparkline seed={12} />)
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- SVG has no role
    const points = container.querySelector('polyline')!.getAttribute('points')!.split(' ')
    expect(points).toHaveLength(7)
    expect(points[0]).toMatch(/^0\.0,/)
    expect(points.at(-1)).toMatch(/^56\.0,/)
  })
})

describe('TuiSearchBar', () => {
  it('focuses, filters, and closes clearing or keeping', () => {
    const onChange = vi.fn()
    const onClose = vi.fn()
    render(<TuiSearchBar value="lamp" onChange={onChange} onClose={onClose} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveFocus()

    fireEvent.change(input, { target: { value: 'lamps' } })
    expect(onChange).toHaveBeenCalledWith('lamps')
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Escape' })
    fireEvent.keyDown(input, { key: 'a' })
    expect(onClose.mock.calls).toEqual([[false], [true]])
  })
})

describe('HelpOverlay', () => {
  it('lists the shortcuts and closes on Escape, ?, the button and the backdrop', () => {
    const onClose = vi.fn()
    render(<HelpOverlay onClose={onClose} />)
    expect(screen.getByText('── terminal ──')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.keyDown(window, { key: '?' })
    fireEvent.keyDown(window, { key: 'x' })
    fireEvent.click(screen.getByRole('button', { name: '[Esc] close' }))
    fireEvent.click(screen.getByText('── move ──'))
    fireEvent.click(screen.getByRole('dialog', { name: 'Keyboard shortcuts' }))
    expect(onClose).toHaveBeenCalledTimes(4)
  })
})

describe('TuiPanel and TuiStatusBar', () => {
  it('renders the panel as the given tag with an optional title', () => {
    render(
      <TuiPanel as="aside" title="─[ rooms ]─">
        body
      </TuiPanel>,
    )
    expect(screen.getByRole('complementary')).toHaveTextContent('─[ rooms ]─body')
  })

  it('opens the terminal from the status bar', () => {
    const onOpenTerminal = vi.fn()
    render(<TuiStatusBar onOpenTerminal={onOpenTerminal} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open terminal' }))
    expect(onOpenTerminal).toHaveBeenCalled()
  })
})

describe('SiteFooter', () => {
  it('shows the version line with the full sha as its title', () => {
    vi.stubEnv('VITE_APP_VERSION', '1.2.3')
    vi.stubEnv('VITE_GIT_SHA', 'abcdef0123456789')
    render(<SiteFooter />)
    expect(screen.getByText('1.2.3 · abcdef0')).toHaveAttribute('title', 'abcdef0123456789')
  })

  it('renders nothing without a version in a build', () => {
    vi.stubEnv('VITE_APP_VERSION', '')
    vi.stubEnv('VITE_GIT_SHA', '')
    vi.stubEnv('DEV', false)
    const { container } = render(<SiteFooter />)
    expect(container).toBeEmptyDOMElement()
  })
})

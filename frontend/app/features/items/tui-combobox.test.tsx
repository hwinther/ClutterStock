import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TuiCombobox, type TuiComboboxOption } from './tui-combobox'

const options: TuiComboboxOption[] = [
  { kind: 'group', label: 'Home' },
  { kind: 'option', label: 'Office', value: 1 },
  { kind: 'option', label: 'Kitchen', value: 2 },
  { kind: 'group', label: 'Cabin' },
  { kind: 'option', label: 'Shed', value: 3 },
]

function Harness({
  initial = 2,
  onChange = vi.fn(),
  disabled = false,
  opts = options,
}: {
  readonly initial?: number | null
  readonly onChange?: (v: number) => void
  readonly disabled?: boolean
  readonly opts?: TuiComboboxOption[]
}) {
  const [value, setValue] = useState<number | null>(initial)
  return (
    <form aria-label="item">
      <TuiCombobox
        name="roomId"
        value={value}
        options={opts}
        disabled={disabled}
        ariaLabel="Room"
        onChange={(v) => {
          setValue(v)
          onChange(v)
        }}
      />
      <p>outside</p>
    </form>
  )
}

const trigger = () => screen.getByRole('button', { name: 'Room' })
const listbox = () => screen.queryByRole('listbox')
const highlighted = () => screen.getAllByRole('option').find((o) => o.dataset.highlighted === 'true')
// The value travels in a hidden input, which only the form's data shows.
const submitted = () => new FormData(screen.getByRole('form', { name: 'item' }) as HTMLFormElement).get('roomId')

describe('TuiCombobox', () => {
  it('shows the current option and keeps it in a hidden input', () => {
    render(<Harness />)
    expect(trigger()).toHaveTextContent('Kitchen')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(submitted()).toBe('2')
  })

  it('shows a dash and an empty value with nothing selected', () => {
    render(<Harness initial={null} />)
    expect(trigger()).toHaveTextContent('—')
    expect(submitted()).toBe('')
  })

  it('opens on click with groups and the selection marked', () => {
    render(<Harness />)
    fireEvent.click(trigger())

    expect(listbox()).toBeInTheDocument()
    expect(screen.getByText('── Cabin ──')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Kitchen/ })).toHaveAttribute('aria-selected', 'true')
    expect(highlighted()).toHaveTextContent('Kitchen')

    fireEvent.click(trigger())
    expect(listbox()).not.toBeInTheDocument()
  })

  it('moves through the options with the keyboard and wraps around', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    expect(highlighted()).toHaveTextContent('Kitchen')

    fireEvent.keyDown(trigger(), { key: 'j' })
    expect(highlighted()).toHaveTextContent('Shed')
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    expect(highlighted()).toHaveTextContent('Office')
    fireEvent.keyDown(trigger(), { key: 'k' })
    expect(highlighted()).toHaveTextContent('Shed')
    fireEvent.keyDown(trigger(), { key: 'Home' })
    expect(highlighted()).toHaveTextContent('Office')
    fireEvent.keyDown(trigger(), { key: 'ArrowUp' })
    expect(highlighted()).toHaveTextContent('Shed')
    fireEvent.keyDown(trigger(), { key: 'End' })
    fireEvent.keyDown(trigger(), { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(3)
    expect(listbox()).not.toBeInTheDocument()
    expect(trigger()).toHaveTextContent('Shed')
  })

  it('starts at the first option when nothing is selected', () => {
    render(<Harness initial={null} />)
    fireEvent.keyDown(trigger(), { key: ' ' })
    expect(highlighted()).toHaveTextContent('Office')
  })

  it('highlights from the ends when the highlight is not an option', () => {
    render(<Harness initial={99} />)
    fireEvent.keyDown(trigger(), { key: 'Enter' })
    fireEvent.keyDown(trigger(), { key: 'ArrowUp' })
    expect(highlighted()).toHaveTextContent('Shed')
  })

  it('closes without choosing on Escape, Tab and a click outside', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(trigger(), { key: 'Escape' })
    expect(listbox()).not.toBeInTheDocument()

    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(trigger(), { key: 'x' })
    expect(listbox()).toBeInTheDocument()
    fireEvent.keyDown(trigger(), { key: 'Tab' })
    expect(listbox()).not.toBeInTheDocument()

    fireEvent.click(trigger())
    fireEvent.mouseDown(listbox()!)
    expect(listbox()).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('outside'))
    expect(listbox()).not.toBeInTheDocument()

    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores other keys while closed', () => {
    render(<Harness />)
    fireEvent.keyDown(trigger(), { key: 'a' })
    expect(listbox()).not.toBeInTheDocument()
  })

  it('picks an option with the mouse', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.click(trigger())
    const office = screen.getByRole('option', { name: /Office/ })

    fireEvent.mouseEnter(office)
    expect(highlighted()).toHaveTextContent('Office')
    fireEvent.mouseDown(office)

    expect(onChange).toHaveBeenCalledWith(1)
    expect(submitted()).toBe('1')
  })

  it('does nothing while disabled', () => {
    render(<Harness disabled />)
    expect(trigger()).toBeDisabled()
    fireEvent.keyDown(trigger(), { key: 'Enter' })
    expect(listbox()).not.toBeInTheDocument()
  })

  it('copes with no options', () => {
    render(<Harness initial={null} opts={[]} />)
    fireEvent.click(trigger())
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(trigger(), { key: 'Home' })
    fireEvent.keyDown(trigger(), { key: 'End' })
    fireEvent.keyDown(trigger(), { key: 'Enter' })
    expect(listbox()).not.toBeInTheDocument()
  })
})

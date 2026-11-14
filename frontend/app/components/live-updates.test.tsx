import { act, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveUpdates } from './live-updates'

// jsdom has no EventSource; this one records what the component does with it.
class FakeEventSource {
  static readonly instances: FakeEventSource[] = []
  listeners = new Map<string, () => void>()
  closed = false
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this)
  }
  addEventListener(type: string, fn: () => void) {
    this.listeners.set(type, fn)
  }
  removeEventListener(type: string) {
    this.listeners.delete(type)
  }
  close() {
    this.closed = true
  }
  emit(type: string) {
    this.listeners.get(type)?.()
  }
}

function renderLiveUpdates(enabled: boolean) {
  const loader = vi.fn(() => ({ ok: true }))
  const router = createMemoryRouter([{ id: 'root', path: '/', loader, element: <LiveUpdates enabled={enabled} /> }], {
    hydrationData: { loaderData: { root: { ok: true } } },
  })
  const view = render(<RouterProvider router={router} />)
  return { ...view, loader }
}

describe('LiveUpdates', () => {
  beforeEach(() => {
    FakeEventSource.instances.length = 0
    vi.stubGlobal('EventSource', FakeEventSource)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not connect while disabled', () => {
    renderLiveUpdates(false)
    expect(FakeEventSource.instances).toHaveLength(0)
  })

  it('revalidates once per burst of item changes', async () => {
    const { loader } = renderLiveUpdates(true)
    const [source] = FakeEventSource.instances
    expect(source?.url).toBe('/sse/items')

    source!.emit('item-change')
    source!.emit('item-change')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(249)
    })
    expect(loader).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('closes the stream on unmount', () => {
    const { unmount } = renderLiveUpdates(true)
    const [source] = FakeEventSource.instances
    unmount()
    expect(source!.closed).toBe(true)
    expect(source!.listeners.size).toBe(0)
  })
})

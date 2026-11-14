import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiProblemError } from '~/api/problem'
import { ProblemBoundary } from './problem-boundary'

// What isRouteErrorResponse recognises (react-router's ErrorResponseImpl shape).
const routeError = (status: number, statusText = '') => ({ status, statusText, internal: false, data: null })

describe('ProblemBoundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('shows an API problem with its field errors and references', () => {
    const error = new ApiProblemError(422, {
      title: 'Validation failed',
      detail: 'Check the form',
      errors: { Name: ['required', 'too short'] },
      requestId: 'req-1',
      traceId: 'trace-1',
    })
    render(<ProblemBoundary error={error} scope="section" />)
    expect(screen.getByRole('heading', { name: 'Validation failed' })).toBeInTheDocument()
    expect(screen.getByText('Check the form')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Name: required, too short')
    expect(screen.getByText(/Reference/)).toHaveTextContent('Reference · req req-1 · trace trace-1')
  })

  it.each([
    [routeError(404), 'Not found', 'The requested page could not be found.'],
    [routeError(503, 'Service Unavailable'), 'Error 503', 'Service Unavailable'],
    [routeError(500), 'Error 500', 'An unexpected error occurred.'],
  ])('shows a route error response %o', (error, title, detail) => {
    render(<ProblemBoundary error={error} />)
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByText(detail)).toBeInTheDocument()
  })

  it('shows an Error with its message and stack in development', () => {
    vi.stubEnv('DEV', true)
    render(<ProblemBoundary error={new Error('boom')} />)
    expect(screen.getByText('boom')).toBeInTheDocument()
    expect(screen.getByText(/Error: boom/)).toBeInTheDocument()
  })

  it('hides the message and stack in a build', () => {
    vi.stubEnv('DEV', false)
    render(<ProblemBoundary error={new Error('secret detail')} />)
    expect(screen.queryByText(/secret detail/)).not.toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('handles anything else', () => {
    render(<ProblemBoundary error="nope" />)
    expect(screen.getByRole('heading', { name: 'Unexpected error' })).toBeInTheDocument()
  })
})

import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'

/**
 * Renders a component at "/" in a memory router whose action records each submission's form data
 * and answers with `respond`, the way the home route answers the panels' fetchers.
 */
export function renderWithAction(element: ReactElement, respond: (form: FormData) => unknown = () => ({ ok: true })) {
  const submissions: Record<string, FormDataEntryValue>[] = []
  const action = vi.fn(async ({ request }: { request: Request }) => {
    const form = await request.formData()
    submissions.push(Object.fromEntries(form))
    return respond(form)
  })
  const router = createMemoryRouter([{ path: '/', element, action }], { initialEntries: ['/'] })
  return { ...render(<RouterProvider router={router} />), submissions, action, router }
}

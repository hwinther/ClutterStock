// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The module takes its logger when it loads, so the mock has to be in place first.
const emit = vi.hoisted(() => vi.fn())
vi.mock('@opentelemetry/api', () => ({
  logs: { getLogger: () => ({ emit }) },
  SeverityNumber: { WARN: 13 },
}))

const { emitCspReports } = await import('./csp-report.server')

describe('emitCspReports', () => {
  beforeEach(() => {
    emit.mockClear()
  })

  it('logs each report as a warning with its attributes', () => {
    emitCspReports(
      [
        {
          blockedUri: 'https://evil.test/x.js',
          disposition: 'enforce',
          documentUri: 'https://clutterstock.test/',
          effectiveDirective: 'script-src-elem',
          sourceFile: 'https://clutterstock.test/app.js',
          lineNumber: 3,
          columnNumber: 9,
          sample: 'alert(1)',
        },
      ],
      'Mozilla/5.0 '.repeat(100),
    )

    expect(emit).toHaveBeenCalledTimes(1)
    const record = emit.mock.calls[0]![0]
    expect(record).toMatchObject({
      severityNumber: 13,
      severityText: 'WARN',
      body: 'CSP enforce: script-src-elem https://evil.test/x.js on https://clutterstock.test/',
      attributes: {
        'event.name': 'csp.violation',
        'csp.source_file': 'https://clutterstock.test/app.js',
        'csp.line_number': 3,
        'csp.column_number': 9,
        'csp.sample': 'alert(1)',
      },
    })
    expect(record.attributes['user_agent.original']).toHaveLength(512)
  })

  it('leaves out what a report lacks', () => {
    emitCspReports(
      [
        {
          blockedUri: '',
          disposition: 'report',
          documentUri: 'https://clutterstock.test/',
          effectiveDirective: 'img-src',
        },
      ],
      null,
    )
    const record = emit.mock.calls[0]![0]
    expect(record.body).toBe('CSP report: img-src (no URI) on https://clutterstock.test/')
    expect(Object.keys(record.attributes)).toEqual([
      'event.name',
      'csp.blocked_uri',
      'csp.disposition',
      'csp.document_uri',
      'csp.effective_directive',
    ])
  })
})

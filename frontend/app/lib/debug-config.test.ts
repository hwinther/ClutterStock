import { afterEach, describe, expect, it, vi } from 'vitest'
import { isDebugConfigAllowed, pickDebugServerEnv, pickImportMetaEnvForDebug } from './debug-config'

describe('debug-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is always allowed in development', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('ENABLE_DEBUG_CONFIG', 'false')
    expect(isDebugConfigAllowed()).toBe(true)
  })

  it('needs ENABLE_DEBUG_CONFIG=true in production', () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('ENABLE_DEBUG_CONFIG', '1')
    expect(isDebugConfigAllowed()).toBe(false)
    vi.stubEnv('ENABLE_DEBUG_CONFIG', 'true')
    expect(isDebugConfigAllowed()).toBe(true)
  })

  it('shows only the listed server variables, unset ones as empty', () => {
    vi.stubEnv('SERVER_API_URL', 'https://api.internal:8443')
    vi.stubEnv('OTEL_SERVICE_NAME', undefined)
    vi.stubEnv('REDIS_URL', 'redis://secret@redis:6379')

    const env = pickDebugServerEnv()

    expect(env.SERVER_API_URL).toBe('https://api.internal:8443')
    expect(env.OTEL_SERVICE_NAME).toBe('')
    expect(env).not.toHaveProperty('REDIS_URL')
    expect(Object.keys(env)).toContain('OTEL_RESOURCE_ATTRIBUTES')
  })

  it('stringifies import.meta.env sorted by key', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_A_URL', 'https://api.test')

    const env = pickImportMetaEnvForDebug()
    const keys = Object.keys(env)

    expect(env.DEV).toBe('true')
    expect(env.VITE_A_URL).toBe('https://api.test')
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b, 'en')))
  })
})

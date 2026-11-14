// @vitest-environment node
import { createHash } from 'node:crypto'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeRedis } from '~/test/fake-redis'
import { testApiServer } from '~/test/msw/server'
import type { Session } from './session.server'

vi.mock('~/lib/redis.server', () => ({ redis: () => fakeRedis }))

const AUTHORITY = 'https://auth.test'
const DISCOVERY = {
  authorization_endpoint: `${AUTHORITY}/authorize`,
  token_endpoint: `${AUTHORITY}/token`,
  userinfo_endpoint: `${AUTHORITY}/userinfo`,
  end_session_endpoint: `${AUTHORITY}/logout`,
}
const NOW = 1_800_000_000

// The module reads the authority and client id when it loads and caches discovery, so each test
// gets a fresh copy.
let oidc: typeof import('./oidc.server')
let discoveryCalls = 0
let tokenRequests: URLSearchParams[] = []

const request = (cookie?: string) =>
  new Request('https://clutterstock.test/locations', { headers: cookie ? { cookie } : {} })

function jwt(payload: object): string {
  return `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`
}

function storeSession(sid: string, data: Partial<Session>) {
  const session: Session = {
    accessToken: 'old-at',
    refreshToken: 'rt',
    expiresAt: NOW + 3600,
    idToken: 'id',
    user: { sub: 'u1' },
    ...data,
  }
  return fakeRedis.set(`session:${sid}`, JSON.stringify(session), { EX: 600 })
}

const storedSession = (sid: string) => JSON.parse(fakeRedis.store.get(`session:${sid}`)!.value) as Session

function tokenEndpoint(response: () => Response) {
  return http.post(DISCOVERY.token_endpoint, async ({ request: req }) => {
    tokenRequests.push(new URLSearchParams(await req.text()))
    return response()
  })
}

beforeEach(async () => {
  fakeRedis.reset()
  discoveryCalls = 0
  tokenRequests = []
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW * 1000)
  vi.stubEnv('VITE_OIDC_AUTHORITY', AUTHORITY)
  vi.stubEnv('VITE_OIDC_CLIENT_ID', 'clutterstock')
  vi.stubEnv('PUBLIC_ORIGIN', undefined)
  testApiServer.use(
    http.get(`${AUTHORITY}/.well-known/openid-configuration`, () => {
      discoveryCalls++
      return HttpResponse.json(DISCOVERY)
    }),
  )
  vi.resetModules()
  oidc = await import('./oidc.server')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('generateAuthUrl', () => {
  it('builds a PKCE authorization request and stores its state for ten minutes', async () => {
    const url = new URL(await oidc.generateAuthUrl(request(), '/locations/7'))

    expect(`${url.origin}${url.pathname}`).toBe(DISCOVERY.authorization_endpoint)
    const params = url.searchParams
    expect(params.get('response_type')).toBe('code')
    expect(params.get('client_id')).toBe('clutterstock')
    expect(params.get('redirect_uri')).toBe('https://clutterstock.test/auth/callback')
    expect(params.get('scope')).toBe('openid profile email groups offline_access')
    expect(params.get('code_challenge_method')).toBe('S256')

    const entry = fakeRedis.store.get(`oidc:state:${params.get('state')}`)
    expect(entry?.ttl).toBe(600)
    const { codeVerifier, returnTo } = JSON.parse(entry!.value)
    expect(returnTo).toBe('/locations/7')
    expect(params.get('code_challenge')).toBe(createHash('sha256').update(codeVerifier).digest('base64url'))
  })

  it('uses PUBLIC_ORIGIN for the redirect and fetches discovery once', async () => {
    vi.stubEnv('PUBLIC_ORIGIN', 'https://clutterstock.wsh.no')

    const first = new URL(await oidc.generateAuthUrl(request()))
    await oidc.generateAuthUrl(request())

    expect(first.searchParams.get('redirect_uri')).toBe('https://clutterstock.wsh.no/auth/callback')
    const state = first.searchParams.get('state')
    expect(JSON.parse(fakeRedis.store.get(`oidc:state:${state}`)!.value).returnTo).toBe('/')
    expect(discoveryCalls).toBe(1)
  })

  it('fails when discovery fails', async () => {
    testApiServer.use(
      http.get(`${AUTHORITY}/.well-known/openid-configuration`, () => new HttpResponse(null, { status: 503 })),
    )
    await expect(oidc.generateAuthUrl(request())).rejects.toThrow('OIDC discovery failed: 503')
  })
})

describe('handleCallback', () => {
  const tokens = {
    access_token: 'at',
    refresh_token: 'rt',
    id_token: jwt({ sub: 'from-id-token', name: 'Id Token' }),
    expires_in: 300,
    token_type: 'Bearer',
  }

  beforeEach(async () => {
    await fakeRedis.set('oidc:state:st', JSON.stringify({ codeVerifier: 'ver', returnTo: '/locations/3' }))
  })

  it('exchanges the code, reads userinfo and creates a session', async () => {
    let bearer: string | null = null
    testApiServer.use(
      tokenEndpoint(() => HttpResponse.json(tokens)),
      http.get(DISCOVERY.userinfo_endpoint, ({ request: req }) => {
        bearer = req.headers.get('authorization')
        return HttpResponse.json({
          sub: 'u1',
          name: 'Ada',
          preferred_username: 'ada',
          email: 'ada@example.test',
          groups: ['clutterstock-users'],
        })
      }),
    )

    const { sid, returnTo } = await oidc.handleCallback('the-code', 'st', request())

    expect(returnTo).toBe('/locations/3')
    expect(Object.fromEntries(tokenRequests[0]!)).toEqual({
      grant_type: 'authorization_code',
      client_id: 'clutterstock',
      redirect_uri: 'https://clutterstock.test/auth/callback',
      code: 'the-code',
      code_verifier: 'ver',
    })
    expect(bearer).toBe('Bearer at')
    expect(storedSession(sid)).toEqual({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: NOW + 300,
      idToken: tokens.id_token,
      user: {
        sub: 'u1',
        name: 'Ada',
        preferred_username: 'ada',
        email: 'ada@example.test',
        groups: ['clutterstock-users'],
      },
    })
    // The state is single-use.
    expect(fakeRedis.store.has('oidc:state:st')).toBe(false)
  })

  it('falls back to the id_token claims when userinfo fails', async () => {
    testApiServer.use(
      tokenEndpoint(() => HttpResponse.json({ ...tokens, refresh_token: undefined })),
      http.get(DISCOVERY.userinfo_endpoint, () => new HttpResponse(null, { status: 500 })),
    )

    const { sid } = await oidc.handleCallback('c', 'st', request())

    const session = storedSession(sid)
    expect(session.refreshToken).toBe('')
    expect(session.user).toEqual({ sub: 'from-id-token', name: 'Id Token', groups: null })
  })

  it('falls back to the id_token claims when userinfo is unreachable', async () => {
    testApiServer.use(
      tokenEndpoint(() => HttpResponse.json(tokens)),
      http.get(DISCOVERY.userinfo_endpoint, () => HttpResponse.error()),
    )

    const { sid } = await oidc.handleCallback('c', 'st', request())

    expect(storedSession(sid).user.sub).toBe('from-id-token')
  })

  it('rejects an unknown or reused state with 400', async () => {
    const error = await oidc.handleCallback('c', 'nope', request()).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Response)
    expect((error as Response).status).toBe(400)
  })

  it('answers 502 when the token exchange fails', async () => {
    testApiServer.use(tokenEndpoint(() => new HttpResponse('invalid_grant', { status: 400 })))

    const error = (await oidc.handleCallback('c', 'st', request()).catch((e: unknown) => e)) as Response

    expect(error.status).toBe(502)
    await expect(error.text()).resolves.toBe('Token exchange failed: invalid_grant')
  })
})

describe('getValidToken', () => {
  const signedIn = () => request('clutterstock_sid=s1')

  it('is null without a session', async () => {
    await expect(oidc.getValidToken(request())).resolves.toBeNull()
  })

  it('returns the access token while it has more than a minute left', async () => {
    await storeSession('s1', { expiresAt: NOW + 61 })
    await expect(oidc.getValidToken(signedIn())).resolves.toBe('old-at')
    expect(tokenRequests).toHaveLength(0)
  })

  it('refreshes a token about to expire and keeps the refresh token if none comes back', async () => {
    await storeSession('s1', { expiresAt: NOW + 30 })
    testApiServer.use(tokenEndpoint(() => HttpResponse.json({ access_token: 'new-at', expires_in: 900 })))

    await expect(oidc.getValidToken(signedIn())).resolves.toBe('new-at')

    expect(Object.fromEntries(tokenRequests[0]!)).toEqual({
      grant_type: 'refresh_token',
      client_id: 'clutterstock',
      refresh_token: 'rt',
    })
    expect(storedSession('s1')).toMatchObject({
      accessToken: 'new-at',
      refreshToken: 'rt',
      expiresAt: NOW + 900,
    })
  })

  it('stores a rotated refresh token', async () => {
    await storeSession('s1', { expiresAt: NOW })
    testApiServer.use(
      tokenEndpoint(() => HttpResponse.json({ access_token: 'a2', refresh_token: 'rt2', expires_in: 60 })),
    )

    await oidc.getValidToken(signedIn())

    expect(storedSession('s1').refreshToken).toBe('rt2')
  })

  it('ends an expired session that has no refresh token', async () => {
    await storeSession('s1', { expiresAt: NOW, refreshToken: '' })
    await expect(oidc.getValidToken(signedIn())).resolves.toBeNull()
    expect(fakeRedis.store.has('session:s1')).toBe(false)
  })

  it('ends the session when the refresh is refused', async () => {
    await storeSession('s1', { expiresAt: NOW })
    testApiServer.use(tokenEndpoint(() => new HttpResponse(null, { status: 400 })))

    await expect(oidc.getValidToken(signedIn())).resolves.toBeNull()
    expect(fakeRedis.store.has('session:s1')).toBe(false)
  })

  it('ends the session when the token endpoint is unreachable', async () => {
    await storeSession('s1', { expiresAt: NOW })
    testApiServer.use(http.post(DISCOVERY.token_endpoint, () => HttpResponse.error()))

    await expect(oidc.getValidToken(signedIn())).resolves.toBeNull()
    expect(fakeRedis.store.has('session:s1')).toBe(false)
  })
})

describe('buildLogoutUrl', () => {
  it('sends the id token hint and returns to the site', async () => {
    const url = new URL(await oidc.buildLogoutUrl('id-tok', request()))
    expect(`${url.origin}${url.pathname}`).toBe(DISCOVERY.end_session_endpoint)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      post_logout_redirect_uri: 'https://clutterstock.test',
      id_token_hint: 'id-tok',
    })
  })

  it('leaves the hint out without an id token', async () => {
    vi.stubEnv('PUBLIC_ORIGIN', 'https://clutterstock.wsh.no')
    const url = new URL(await oidc.buildLogoutUrl(undefined, request()))
    expect(Object.fromEntries(url.searchParams)).toEqual({
      post_logout_redirect_uri: 'https://clutterstock.wsh.no',
    })
  })
})

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeRedis } from '~/test/fake-redis'
import type { Session } from './session.server'
import { drainFlashes, pushFlash } from './toasts.server'

vi.mock('~/lib/redis.server', () => ({ redis: () => fakeRedis }))

const session: Session = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: 1_900_000_000,
  idToken: 'id',
  user: { sub: 'u1' },
}

const signedIn = () => new Request('https://clutterstock.test/', { headers: { cookie: 'clutterstock_sid=s1' } })
const anonymous = () => new Request('https://clutterstock.test/')

const stored = (): Session => JSON.parse(fakeRedis.store.get('session:s1')!.value) as Session

beforeEach(async () => {
  fakeRedis.reset()
  await fakeRedis.set('session:s1', JSON.stringify(session), { EX: 600 })
})

describe('pushFlash / drainFlashes', () => {
  it('queues flashes in order and drains them once', async () => {
    await pushFlash(signedIn(), { kind: 'success', message: 'Saved' })
    await pushFlash(signedIn(), { kind: 'error', message: 'Oops' })

    await expect(drainFlashes(signedIn())).resolves.toEqual([
      { kind: 'success', message: 'Saved' },
      { kind: 'error', message: 'Oops' },
    ])
    expect(stored().flashes).toEqual([])
    await expect(drainFlashes(signedIn())).resolves.toEqual([])
  })

  it('leaves the session alone when nothing is queued', async () => {
    const before = fakeRedis.store.get('session:s1')!.value
    await expect(drainFlashes(signedIn())).resolves.toEqual([])
    expect(fakeRedis.store.get('session:s1')!.value).toBe(before)
  })

  it('does nothing for an anonymous request', async () => {
    await pushFlash(anonymous(), { kind: 'success', message: 'Saved' })
    await expect(drainFlashes(anonymous())).resolves.toEqual([])
    expect(stored().flashes).toBeUndefined()
  })
})

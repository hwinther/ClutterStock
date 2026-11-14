import { describe, expect, it } from 'vitest'
import {
  createItem,
  createLocation,
  createRoom,
  deleteItem,
  deleteLocation,
  deleteRoom,
  getItem,
  getItems,
  getRoom,
  getRooms,
  updateItem,
  updateLocation,
  updateRoom,
} from './client'
import { apiHttp } from '~/test/msw/openapi-http'
import { testApiServer } from '~/test/msw/server'

describe('API client: rooms, items and writes', () => {
  it('lists rooms and items from the default handlers', async () => {
    await expect(getRooms()).resolves.toEqual([])
    await expect(getItems()).resolves.toEqual([])
  })

  it('returns null for a missing room or item', async () => {
    await expect(getRoom(1)).resolves.toBeNull()
    await expect(getItem(1)).resolves.toBeNull()
  })

  it('reads one room and one item', async () => {
    testApiServer.use(
      apiHttp.get('/api/v1/rooms/{id}', ({ params, response }) =>
        response(200).json({
          id: Number(params.id),
          name: 'Office',
          locationId: 1,
          createdAtUtc: '2026-01-01T00:00:00Z',
        }),
      ),
      apiHttp.get('/api/v1/items/{id}', ({ params, response }) =>
        response(200).json({ id: Number(params.id), name: 'Lamp', roomId: 2, createdAtUtc: '2026-01-01T00:00:00Z' }),
      ),
    )
    await expect(getRoom(2)).resolves.toMatchObject({ id: 2, name: 'Office' })
    await expect(getItem(5)).resolves.toMatchObject({ id: 5, name: 'Lamp' })
  })

  it('creates, updates and deletes locations, rooms and items', async () => {
    const seen: string[] = []
    const ok = (body: Record<string, unknown>) => ({ ...body, createdAtUtc: '2026-01-01T00:00:00Z' })
    testApiServer.use(
      apiHttp.post('/api/v1/locations', async ({ request, response }) => {
        seen.push(`POST locations ${JSON.stringify(await request.json())}`)
        return response(201).json(ok({ id: 1, name: 'Home' }))
      }),
      apiHttp.put('/api/v1/locations/{id}', ({ params, response }) => {
        seen.push(`PUT locations/${params.id}`)
        return response(200).json(ok({ id: 1, name: 'Home 2' }))
      }),
      apiHttp.delete('/api/v1/locations/{id}', ({ params, response }) => {
        seen.push(`DELETE locations/${params.id}`)
        return response(204).empty()
      }),
      apiHttp.post('/api/v1/rooms', ({ response }) => {
        seen.push('POST rooms')
        return response(201).json(ok({ id: 2, name: 'Office', locationId: 1 }))
      }),
      apiHttp.put('/api/v1/rooms/{id}', ({ params, response }) => {
        seen.push(`PUT rooms/${params.id}`)
        return response(200).json(ok({ id: 2, name: 'Study', locationId: 1 }))
      }),
      apiHttp.delete('/api/v1/rooms/{id}', ({ params, response }) => {
        seen.push(`DELETE rooms/${params.id}`)
        return response(204).empty()
      }),
      apiHttp.post('/api/v1/items', ({ response }) => {
        seen.push('POST items')
        return response(201).json(ok({ id: 3, name: 'Lamp', roomId: 2 }))
      }),
      apiHttp.put('/api/v1/items/{id}', ({ params, response }) => {
        seen.push(`PUT items/${params.id}`)
        return response(200).json(ok({ id: 3, name: 'Lamp 2', roomId: 2 }))
      }),
      apiHttp.delete('/api/v1/items/{id}', ({ params, response }) => {
        seen.push(`DELETE items/${params.id}`)
        return response(204).empty()
      }),
    )

    await expect(createLocation({ name: 'Home' })).resolves.toMatchObject({ id: 1 })
    await expect(updateLocation(1, { name: 'Home 2' })).resolves.toMatchObject({ name: 'Home 2' })
    await expect(deleteLocation(1)).resolves.toBeUndefined()
    await expect(createRoom({ name: 'Office', locationId: 1 })).resolves.toMatchObject({ id: 2 })
    await expect(updateRoom(2, { name: 'Study', locationId: 1 })).resolves.toMatchObject({ name: 'Study' })
    await expect(deleteRoom(2)).resolves.toBeUndefined()
    await expect(createItem({ name: 'Lamp', roomId: 2 })).resolves.toMatchObject({ id: 3 })
    await expect(updateItem(3, { name: 'Lamp 2', roomId: 2 })).resolves.toMatchObject({ name: 'Lamp 2' })
    await expect(deleteItem(3)).resolves.toBeUndefined()

    expect(seen).toEqual([
      'POST locations {"name":"Home"}',
      'PUT locations/1',
      'DELETE locations/1',
      'POST rooms',
      'PUT rooms/2',
      'DELETE rooms/2',
      'POST items',
      'PUT items/3',
      'DELETE items/3',
    ])
  })
})

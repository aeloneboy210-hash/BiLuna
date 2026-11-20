import { vi } from 'vitest'
vi.mock('server-only', () => ({}))

const calls: string[] = []
let updatedRows: { message_id: string }[] = []
let insertError: { message: string } | null = null

const table = {
  update: (v: unknown) => {
    calls.push(`update ${JSON.stringify(v)}`)
    return {
      eq: (k: string, id: string) => {
        calls.push(`eq ${k}=${id}`)
        return { select: async () => ({ data: updatedRows, error: null }) }
      },
    }
  },
  insert: async (v: unknown) => {
    calls.push(`insert ${JSON.stringify(v)}`)
    return { error: insertError }
  },
  upsert: () => {
    throw new Error('upsert must not be used: it also tries to change message_id, which the database refuses')
  },
}
vi.mock('@/lib/health/chat-store', () => ({ db: async () => ({ from: () => table }) }))

import { setFeedback } from '@/lib/intelligence/store'

beforeEach(() => {
  calls.length = 0
  updatedRows = []
  insertError = null
})

test('a first rating is inserted after the update finds nothing', async () => {
  expect(await setFeedback('m1', 1)).toBe(true)
  expect(calls).toEqual(['update {"rating":1}', 'eq message_id=m1', 'insert {"message_id":"m1","rating":1}'])
})

test('changing a rating only updates the rating', async () => {
  updatedRows = [{ message_id: 'm1' }]
  expect(await setFeedback('m1', -1)).toBe(true)
  expect(calls).toEqual(['update {"rating":-1}', 'eq message_id=m1'])
})

test('a refused insert reports failure', async () => {
  insertError = { message: 'permission denied' }
  expect(await setFeedback('m1', 1)).toBe(false)
})

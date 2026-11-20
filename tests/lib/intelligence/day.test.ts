import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/health/chat-store', () => ({ db: vi.fn() }))
import { startOfDhakaDay } from '@/lib/intelligence/store'

test('a Dhaka day starts at 18:00 UTC the evening before', () => {
  expect(startOfDhakaDay(new Date('2026-11-20T06:00:00Z'))).toBe('2026-11-19T18:00:00.000Z')
  expect(startOfDhakaDay(new Date('2026-11-20T19:30:00Z'))).toBe('2026-11-20T18:00:00.000Z')
})

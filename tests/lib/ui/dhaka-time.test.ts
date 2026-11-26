import { formatDhaka } from '@/lib/ui/dhaka-time'

test('English uses Bangladesh time with am/pm', () => {
  // 18:53 UTC is 00:53 the next day in Dhaka.
  expect(formatDhaka('2026-11-25T18:53:00Z', 'en')).toBe('26 Nov, 12:53 am')
  expect(formatDhaka('2026-11-26T08:05:00Z', 'en')).toBe('26 Nov, 2:05 pm')
})

test('Bangla uses Bangla digits and the same 12-hour clock', () => {
  const s = formatDhaka('2026-11-26T08:05:00Z', 'bn')
  expect(s).toMatch(/২৬/)
  expect(s).toMatch(/২:০৫/)
})

import { cleanReview, REVIEW_MAX } from '@/lib/consult/review'

test('a note is trimmed and kept', () => {
  expect(cleanReview('  Please come on Sunday.  ')).toBe('Please come on Sunday.')
})

test('an empty or blank note is refused', () => {
  expect(cleanReview('')).toBeNull()
  expect(cleanReview('   \n ')).toBeNull()
  expect(cleanReview(undefined)).toBeNull()
  expect(cleanReview(42)).toBeNull()
})

test('a note longer than the limit is refused, not cut', () => {
  expect(cleanReview('a'.repeat(REVIEW_MAX))).toHaveLength(REVIEW_MAX)
  expect(cleanReview('a'.repeat(REVIEW_MAX + 1))).toBeNull()
})

test('line breaks inside a note are kept', () => {
  expect(cleanReview('Line one\nLine two')).toBe('Line one\nLine two')
})

import { dictionaries } from '@/lib/i18n/dictionaries'

test("the doctor's name goes into the note heading in both languages", () => {
  for (const d of [dictionaries.en, dictionaries.bn]) expect(d.review.fromDoctor).toContain('{name}')
  expect(dictionaries.bn.review.fromDoctor.replace('{name}', 'Dr. Karim')).toBe('Dr. Karim-এর নোট')
})

import { noteIsOlder } from '@/lib/consult/review'

test('a note written before the summary last changed is marked older', () => {
  expect(noteIsOlder('2026-11-26T10:00:00Z', '2026-11-26T10:05:00Z')).toBe(true)
  expect(noteIsOlder('2026-11-26T10:05:00Z', '2026-11-26T10:00:00Z')).toBe(false)
  expect(noteIsOlder('2026-11-26T10:00:00Z', null)).toBe(false)
})

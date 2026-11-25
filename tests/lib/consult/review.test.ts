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

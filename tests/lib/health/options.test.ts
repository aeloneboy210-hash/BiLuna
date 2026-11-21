import { extractOptions, optionsTag } from '@/lib/health/options'

test('the options tag is removed and its answers returned', () => {
  expect(extractOptions('What does it feel like?\n[[options: Burning | Stabbing | Dull ache | Comes and goes]]')).toEqual({
    text: 'What does it feel like?',
    options: ['Burning', 'Stabbing', 'Dull ache', 'Comes and goes'],
  })
})

test('at most 4 short answers; empty and very long ones are dropped', () => {
  const long = 'x'.repeat(60)
  expect(extractOptions(`Q?\n[[options: A | | ${long} | B | C | D | E]]`).options).toEqual(['A', 'B', 'C', 'D'])
})

test('Bangla answers work, and text without a tag is unchanged', () => {
  expect(extractOptions('ব্যথা কেমন?\n[[options: জ্বালাপোড়া | চিনচিনে]]').options).toEqual(['জ্বালাপোড়া', 'চিনচিনে'])
  expect(extractOptions('Plain')).toEqual({ text: 'Plain', options: [] })
})

test('optionsTag writes the tag back', () => {
  expect(optionsTag(['Yes', 'No'])).toBe('[[options: Yes | No]]')
})

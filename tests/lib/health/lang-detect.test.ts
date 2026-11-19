import { detectLang } from '@/lib/health/lang-detect'

test.each([
  ['আমার মাথা ব্যথা করছে', 'bn'],
  ['I have a headache', 'en'],
  ['আমার fever আর মাথা ব্যথা', 'bn'],
  ['my matha betha since 2 days', 'en'],
  ['', 'en'],
  ['123 ?!', 'en'],
])('%j is %s', (text, lang) => {
  expect(detectLang(text)).toBe(lang)
})

import { detectLang } from '@/lib/health/lang-detect'

test.each([
  ['আমার মাথা ব্যথা করছে', 'bn'],
  ['I have a headache', 'en'],
  ['আমার fever আর মাথা ব্যথা', 'bn'],
  ['my matha betha since 2 days', 'en'],
  ['amar buke betha korche', 'bn'],
  ['buke khub betha', 'bn'],
  ['shash nite parchi na', 'bn'],
  ['ami 3 din dhore jor e bhugchi', 'bn'],
  ['My kid ate a kiwi', 'en'],
  ['Hi, I am Rahima. Can you help?', 'en'],
  ['', 'en'],
  ['123 ?!', 'en'],
])('%j is %s', (text, lang) => {
  expect(detectLang(text)).toBe(lang)
})

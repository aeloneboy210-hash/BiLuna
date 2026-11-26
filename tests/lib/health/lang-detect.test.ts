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

import { chatLang } from '@/lib/health/lang-detect'

test('the chat language is the language the patient wrote in', () => {
  expect(
    chatLang([
      { author: 'patient', body: 'আমার মাথা ব্যথা' },
      { author: 'biluna', body: 'It may be a headache.' },
      { author: 'patient', body: 'দুই দিন ধরে' },
    ]),
  ).toBe('bn')
  expect(chatLang([{ author: 'patient', body: 'I have a cough' }])).toBe('en')
  expect(chatLang([{ author: 'patient', body: 'amar buke betha korche' }])).toBe('bn')
})

test('tap and attachment lines do not decide the language; none at all gives null', () => {
  expect(chatLang([{ author: 'patient', body: '📍 Where it hurts: Chest · Pain 3/10' }, { author: 'patient', body: 'বুকে চাপ লাগে' }])).toBe('bn')
  expect(chatLang([{ author: 'patient', body: '📎 report.jpg' }])).toBeNull()
  expect(chatLang([{ author: 'patient', body: 'মাথা ব্যথা' }, { author: 'patient', body: '📍 Where it hurts: Head' }])).toBe('bn')
})

test('a patient who switches language mid-chat: their latest message decides', () => {
  expect(
    chatLang([
      { author: 'patient', body: 'আমার দুই দিন ধরে মাথা ব্যথা করছে' },
      { author: 'biluna', body: 'কোথায় ব্যথা?' },
      { author: 'patient', body: 'It is on my forehead, no fever' },
    ]),
  ).toBe('en')
  expect(
    chatLang([
      { author: 'patient', body: 'I have a cough' },
      { author: 'patient', body: 'রাতে বেশি হয়' },
    ]),
  ).toBe('bn')
})

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

import { typedLang } from '@/lib/health/lang-detect'

// Found by the November bug hunt: a short reply must not switch a Bangla chat to English.
test.each(['ok', 'hmm', '102', '১০২', '😢', '102°F', 'Napa', 'ha', ''])('%p is too short to tell: keep the chat language', (text) => {
  expect(typedLang(text)).toBeNull()
})

test.each([
  ['জ্বর', 'bn'],
  ['ji', 'bn'],
  ['jor', 'bn'],
  ['jor ashche', 'bn'],
  ['kon oshudh khabo', 'bn'],
  ['pet betha', 'bn'],
  ['matha ghurche', 'bn'],
  ['sorir kharap lagche', 'bn'],
  ['I have a fever', 'en'],
  ['my pet is sick today', 'en'],
  ['It is on my forehead', 'en'],
  // November testers: these Banglish messages were getting English answers.
  ['matha ghurche ar bomi bomi lagche', 'bn'],
  ['amar ammur pressure beshi', 'bn'],
  ['gola betha r sordi', 'bn'],
  ['ki korbo bolo', 'bn'],
  ['jor kombe kivabe', 'bn'],
  ['amar baby r jor', 'bn'],
  ['khub mathabetha kortese', 'bn'],
  ['dengue hoise naki bujhbo kivabe', 'bn'],
  ['napa khaite parbo?', 'bn'],
  ['chest e pain hocche', 'bn'],
  ['buke chap lagtese', 'bn'],
  ['ami khub tired feel kortesi', 'bn'],
  ['Ei jinis gula je bole eita off kore dile valo hoito', 'bn'],
  ['I have fever since 2 days', 'en'],
  ['my head hurts', 'en'],
  ['is it dengue?', 'en'],
  ['I have a headache and feel tired', 'en'],
  ['my matha betha since 2 days', 'en'],
  ['Can I take this medicine with food?', 'en'],
] as const)('%p is %p', (text, lang) => {
  expect(typedLang(text)).toBe(lang)
})

test('a Bangla chat stays Bangla after a short "ok" or a number', () => {
  expect(
    chatLang([
      { author: 'patient', body: 'আমার জ্বর' },
      { author: 'biluna', body: 'কত দিন?' },
      { author: 'patient', body: '3' },
      { author: 'patient', body: 'ok' },
    ]),
  ).toBe('bn')
})

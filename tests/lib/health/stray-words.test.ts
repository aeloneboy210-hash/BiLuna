import { strayWords } from '@/lib/health/stray-words'

test('a foreign word inside a Bangla sentence is found', () => {
  expect(strayWords('নাপা সাধারণত ব্যথা কমাতে এবং জ্বর menurunkan ব্যবহৃত হয়।')).toEqual(['menurunkan'])
})

test('medicine names, words in brackets and capitalised names are fine', () => {
  expect(strayWords('এর জেনেরিক নাম হলো প্যারাসিটামল (Paracetamol)।')).toEqual([])
  expect(strayWords('নাপা (Napa) জ্বর কমায়।')).toEqual([])
  expect(strayWords('Ace সিরাপ জ্বর কমায়।')).toEqual([])
  expect(strayWords('আপনার Hb 9.5 g/dL কম।')).toEqual([])
})

test('English text and English at the edges are not flagged', () => {
  expect(strayWords('It may be a cold.')).toEqual([])
  expect(strayWords('আমি কতটা নিশ্চিত: সাধারণ তথ্য। see a doctor')).toEqual([])
})

test('common English medical words are not slips; quoted or hyphen-joined slips are', () => {
  expect(strayWords('জ্বরের জন্য paracetamol খাওয়া হয়')).toEqual([])
  expect(strayWords('এটি dengue হতে পারে')).toEqual([])
  expect(strayWords('জ্বর “menurunkan” করে')).toEqual(['menurunkan'])
  expect(strayWords('জ্বর menurunkan-এর জন্য')).toEqual(['menurunkan'])
})

import { dosesIn, unexplainedDoses } from '@/lib/health/dose-guard'

// Found by the November bug hunt: ways of writing a dose that the check did not see.
test.each([
  '1-0-1',
  '১-০-১',
  'take 500 milligrams',
  '1 g paracetamol',
  '1gm',
  '1 gram',
  'take two tablets',
  'half a tablet',
  'half tablet',
  '½ tablet',
  'আধা ট্যাবলেট',
  'দুটি ট্যাবলেট খান',
  'one teaspoon',
  '10 drops',
  '২ ফোঁটা',
  '2 puffs',
  '5 cc',
  '2 sachets',
])('%p is seen as a dose', (text) => {
  expect(dosesIn(text).length).toBeGreaterThan(0)
})

test.each(['120 mg/dL', '5 IU/L', 'BP 120/80', 'for 2 days', '3 times a day', '2026-11-26', 'pain 3/10'])(
  '%p is not a dose',
  (text) => expect(dosesIn(text)).toEqual([]),
)

test('a bigger amount is never mistaken for the patient’s own', () => {
  expect(unexplainedDoses('Take 2 tablets', 'I take 1/2 tablet')).not.toEqual([])
  expect(unexplainedDoses('take 2,000 mg', 'I took 1,000 mg')).not.toEqual([])
  expect(unexplainedDoses('take .5 mg', 'I take 5 mg')).not.toEqual([])
})

test('মিলিগ্রাম is milligrams, not millilitres', () => {
  expect(dosesIn('১০ মিলিগ্রাম')).toEqual(['10mg'])
  expect(unexplainedDoses('10 ml syrup', '১০ মিলিগ্রাম')).toEqual(['10ml'])
})

test('the patient’s own dose may still be repeated', () => {
  expect(unexplainedDoses('You said you take 1-0-1.', 'ডাক্তার দিয়েছে ১+০+১')).toEqual([])
  expect(unexplainedDoses('half a tablet, as you said', 'I take half tablet')).toEqual([])
  expect(unexplainedDoses('1,000 mg', 'I took 1000 mg')).toEqual([])
})

test('a schedule at the end of a sentence is still a schedule', () => {
  expect(dosesIn('Napa 500 mg, 1+0+1.')).toEqual(['500mg', '1+0+1'])
  expect(dosesIn('খাবেন ১-০-১।')).toEqual(['1+0+1'])
})

test.each(['30 g fiber a day', 'about 2 g of protein', 'my 4g network is slow', 'try 4-7-8 breathing', 'score 3-2-1', 'Week 1 - 2 - 3'])(
  'everyday advice is not a dose: %p',
  (text) => expect(dosesIn(text)).toEqual([]),
)

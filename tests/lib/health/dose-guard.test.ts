import { dosesIn, unexplainedDoses } from '@/lib/health/dose-guard'

test.each([
  ['Take 500 mg paracetamol', ['500mg']],
  ['প্যারাসিটামল (৫০০ মি.গ্রা) দিন', ['500mg']],
  ['Ibuprofen 10 mg/kg', ['10mg']],
  ['Give 5 ml of syrup', ['5ml']],
  ['৫ মিলি সিরাপ', ['5ml']],
  ['Take 2 tablets', ['2tablet']],
  ['দুইবার ২টি ট্যাবলেট', ['2tablet']],
  ['Napa 1+0+1 after food', ['1+0+1']],
  ['১+০+১ খাবারের পর', ['1+0+1']],
  ['Take 1 teaspoon', ['1spoon']],
])('%s has a dose', (text, doses) => {
  expect(dosesIn(text)).toEqual(doses)
})

test.each(['If your fever is over 38°C, see a doctor.', 'How bad is it from 1 to 10?', 'For 2 days', 'Pain 7/10', 'Call 999 now', 'জ্বর ১০২ ডিগ্রি'])(
  'no dose in "%s"',
  (text) => {
    expect(dosesIn(text)).toEqual([])
  },
)

test('a dose the patient wrote themselves may be repeated back', () => {
  expect(unexplainedDoses('Napa 500 mg is paracetamol.', 'I take Napa 500mg twice')).toEqual([])
  expect(unexplainedDoses('Napa ৫০০ মি.গ্রা প্যারাসিটামল।', 'আমি নাপা 500 mg খাই')).toEqual([])
})

test('a new dose BiLuna made up is caught', () => {
  expect(unexplainedDoses('You can take 1000 mg.', 'I take Napa 500mg')).toEqual(['1000mg'])
  expect(unexplainedDoses('Give him 250 mg.', 'My son has fever')).toEqual(['250mg'])
})

test('lab values and reference ranges are not doses', () => {
  expect(dosesIn('A normal fasting sugar is below 100 mg/dL.')).toEqual([])
  expect(dosesIn('ALT 40 IU/L is normal')).toEqual([])
  expect(dosesIn('Creatinine 1.1 mg/dl')).toEqual([])
  expect(dosesIn('Ibuprofen 10 mg/kg')).toEqual(['10mg'])
})

import { parseProfileForm } from '@/lib/intelligence/profile-form'

const form = (v: Record<string, string>) => ({ get: (k: string) => (k in v ? v[k] : null) })

test('a filled form is read and trimmed', () => {
  expect(parseProfileForm(form({ age: ' 34 ', bloodGroup: 'B+', allergies: ' Penicillin ', conditions: '', medicines: 'Inhaler' }))).toEqual({
    ok: true,
    profile: { age: 34, bloodGroup: 'B+', allergies: 'Penicillin', conditions: null, medicines: 'Inhaler' },
  })
})

test.each([['-1'], ['121'], ['3.5'], ['abc']])('age %s is refused', (age) => {
  expect(parseProfileForm(form({ age }))).toEqual({ ok: false })
})

test('an unknown blood group is refused', () => {
  expect(parseProfileForm(form({ bloodGroup: 'Z+' }))).toEqual({ ok: false })
})

test('text over 200 characters is refused', () => {
  expect(parseProfileForm(form({ allergies: 'a'.repeat(201) }))).toEqual({ ok: false })
})

test('an empty form is a valid, empty profile', () => {
  expect(parseProfileForm(form({}))).toEqual({
    ok: true,
    profile: { age: null, bloodGroup: null, allergies: null, conditions: null, medicines: null },
  })
})

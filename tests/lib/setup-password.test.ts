import { checkSetupPassword, DEMO_EMAILS } from '@/lib/auth/setup-password'

test('a good matching password passes', () => expect(checkSetupPassword('biluna-demo-1', 'biluna-demo-1')).toBeNull())
test('shorter than 8 characters is too short', () => expect(checkSetupPassword('abc1234', 'abc1234')).toBe('tooShort'))
test('empty is too short', () => expect(checkSetupPassword('', '')).toBe('tooShort'))
test('longer than 72 characters is too long', () => {
  const long = 'a'.repeat(73)
  expect(checkSetupPassword(long, long)).toBe('tooLong')
})
test('exactly 8 and exactly 72 characters pass', () => {
  expect(checkSetupPassword('a'.repeat(8), 'a'.repeat(8))).toBeNull()
  expect(checkSetupPassword('a'.repeat(72), 'a'.repeat(72))).toBeNull()
})
test('different entries do not match', () => expect(checkSetupPassword('biluna-demo-1', 'biluna-demo-2')).toBe('mismatch'))
test('length is checked before the match', () => expect(checkSetupPassword('short', 'other')).toBe('tooShort'))
test('the three demo emails are fixed', () => {
  expect(DEMO_EMAILS).toEqual(['patient@biluna.demo', 'doctor@biluna.demo', 'hospital@biluna.demo'])
})

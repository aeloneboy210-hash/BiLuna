import { cleanEmail, cleanName, isDemoEmail, passwordOk } from '@/lib/auth/account-rules'

test('emails are trimmed and lower-cased; bad ones refused', () => {
  expect(cleanEmail('  Amina@Example.com ')).toBe('amina@example.com')
  expect(cleanEmail('not-an-email')).toBeNull()
  expect(cleanEmail('a b@x.com')).toBeNull()
  expect(cleanEmail('')).toBeNull()
  expect(cleanEmail(null)).toBeNull()
})

test('names: spaces tidied, invisible characters removed, 1 to 80 letters', () => {
  expect(cleanName('  Amina   Begum ')).toBe('Amina Begum')
  expect(cleanName('আমিনা​ বেগম')).toBe('আমিনা বেগম')
  expect(cleanName('   ')).toBeNull()
  expect(cleanName('x'.repeat(81))).toBeNull()
  expect(cleanName('x'.repeat(80))).toBe('x'.repeat(80))
})

test('passwords: 8 or more characters, at most 72 bytes', () => {
  expect(passwordOk('1234567')).toBe(false)
  expect(passwordOk('12345678')).toBe(true)
  expect(passwordOk('x'.repeat(72))).toBe(true)
  expect(passwordOk('x'.repeat(73))).toBe(false)
  expect(passwordOk('অ'.repeat(25))).toBe(false) // 75 bytes
  expect(passwordOk(12345678)).toBe(false)
})

test('demo emails are recognised', () => {
  expect(isDemoEmail('patient@biluna.demo')).toBe(true)
  expect(isDemoEmail('amina@gmail.com')).toBe(false)
})

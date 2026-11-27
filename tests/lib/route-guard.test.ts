import { resolveRedirect as r } from '@/lib/access/route-guard'

test.each(['/', '/roadmap', '/sign-in'])('signed out may open %s', (p) => expect(r(p, null)).toBeNull())

test.each(['/patient', '/patient/x', '/doctor', '/org', '/org/a/b'])(
  'signed out is sent to sign-in from %s',
  (p) => expect(r(p, null)).toBe('/sign-in'),
)

test.each([
  ['patient', '/patient'],
  ['doctor', '/doctor'],
  ['org_admin', '/org'],
] as const)('%s may open own portal', (role, p) => {
  expect(r(p, role)).toBeNull()
  expect(r(`${p}/any/depth`, role)).toBeNull()
})

test.each([
  ['patient', '/doctor', '/patient'],
  ['patient', '/org', '/patient'],
  ['doctor', '/patient', '/doctor'],
  ['doctor', '/org/x', '/doctor'],
  ['org_admin', '/patient/x', '/org'],
  ['org_admin', '/doctor', '/org'],
] as const)('%s opening %s goes to %s', (role, p, to) => expect(r(p, role)).toBe(to))

test('signed in is sent home from sign-in', () => expect(r('/sign-in', 'doctor')).toBe('/doctor'))

test('prefix look-alikes are not portals', () => {
  expect(r('/patients', null)).toBeNull()
  expect(r('/organization', null)).toBeNull()
  expect(r('/doctors', 'patient')).toBeNull()
})

test('signed in may open welcome and roadmap', () => {
  expect(r('/', 'patient')).toBeNull()
  expect(r('/roadmap', 'org_admin')).toBeNull()
})

test('a trailing slash does not bypass the guard', () => {
  expect(r('/patient/', null)).toBe('/sign-in')
  expect(r('/org/', 'doctor')).toBe('/doctor')
})

test('letter case does not bypass the guard', () => {
  expect(r('/Patient', null)).toBe('/sign-in')
  expect(r('/ORG/x', 'patient')).toBe('/patient')
})

import { needsRole } from '@/lib/access/route-guard'

test.each(['/patient', '/doctor/x', '/org', '/sign-in', '/Patient/'])('%s needs the role looked up', (p) => {
  expect(needsRole(p)).toBe(true)
})

test.each(['/', '/roadmap', '/setup', '/patients', '/organization'])('%s does not need the role', (p) => {
  expect(needsRole(p)).toBe(false)
})

// Step 2: real accounts.
test.each(['/sign-up', '/forgot-password', '/privacy', '/terms', '/auth/callback', '/auth/confirm'])(
  'signed out may open %s',
  (p) => expect(r(p, null)).toBeNull(),
)

test.each(['/welcome', '/account', '/reset-password', '/account/download'])('signed out is sent to sign-in from %s', (p) => {
  expect(r(p, null)).toBe('/sign-in')
})

test.each(['/welcome', '/account', '/reset-password'])('any signed-in role may open %s', (p) => {
  expect(r(p, 'patient')).toBeNull()
  expect(r(p, 'doctor')).toBeNull()
})

test.each(['/sign-up', '/forgot-password'])('signed in is sent home from %s', (p) => {
  expect(r(p, 'patient')).toBe('/patient')
})

test.each(['/welcome', '/account', '/sign-up', '/forgot-password', '/reset-password'])('%s needs the role looked up', (p) => {
  expect(needsRole(p)).toBe(true)
})

import { safeNext } from '@/lib/access/route-guard'

test.each([
  ['/welcome', '/welcome'],
  ['/reset-password', '/reset-password'],
  ['/patient/health?c=1', '/patient/health?c=1'],
  ['https://evil.example', '/'],
  ['//evil.example', '/'],
  ['/\\evil.example', '/'],
  ['', '/'],
  [null, '/'],
  ['javascript:alert(1)', '/'],
] as const)('a return address %p becomes %p (never another site)', (next, out) => {
  expect(safeNext(next)).toBe(out)
})

test.each(['/\t/evil.com', '/\n/evil.com', '/\r\n/evil.com', '/%09/evil.com', '/ /evil.com'])(
  'a return address with hidden characters (%p) never leaves the site',
  (next) => {
    const out = safeNext(next)
    expect(new URL(out, 'https://biluna.vercel.app').origin).toBe('https://biluna.vercel.app')
  },
)

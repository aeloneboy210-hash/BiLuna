import { navFor } from '@/lib/ui/nav'
import { profileCompleteness } from '@/lib/demo/sample'

test('the patient sidebar has the dashboard and all eight modules, in order', () => {
  const items = navFor('patient')
  expect(items[0]).toMatchObject({ key: 'dashboard', href: '/patient' })
  expect(items.slice(1).map((i) => i.key)).toEqual([
    'health', 'intelligence', 'medicine', 'navigator', 'wellness', 'academy', 'careers', 'economics',
  ])
})

test('planned modules in the sidebar lead to the roadmap', () => {
  const health = navFor('patient').find((i) => i.key === 'health')
  expect(health?.href).toBe('/roadmap#health')
})

test.each([
  ['doctor', '/doctor'],
  ['org_admin', '/org'],
] as const)('the %s sidebar starts at its own dashboard and shows no patient modules', (role, home) => {
  const items = navFor(role)
  expect(items[0]).toMatchObject({ key: 'dashboard', href: home })
  expect(items.some((i) => i.key === 'health')).toBe(false)
})

test('no sidebar links into another role\'s portal', () => {
  for (const [role, others] of [
    ['patient', ['/doctor', '/org']],
    ['doctor', ['/patient', '/org']],
    ['org_admin', ['/patient', '/doctor']],
  ] as const) {
    for (const item of navFor(role)) {
      for (const other of others) expect(item.href.startsWith(other), `${role} → ${item.href}`).toBe(false)
    }
  }
})

test('profile completeness counts filled fields', () => {
  expect(profileCompleteness({ a: 'x', b: 'y', c: null, d: 'z' })).toEqual({ filled: 3, total: 4, percent: 75 })
  expect(profileCompleteness({})).toEqual({ filled: 0, total: 0, percent: 0 })
  expect(profileCompleteness({ a: '', b: '  ' })).toEqual({ filled: 0, total: 2, percent: 0 })
})

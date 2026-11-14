import { MODULES, moduleHref } from '@/lib/modules'

test('eight modules with the blueprint names, in order', () => {
  expect(MODULES.map((m) => m.name)).toEqual([
    'BiLuna Health', 'BiLuna Intelligence', 'BiLuna Medicine', 'BiLuna Navigator',
    'BiLuna Wellness', 'BiLuna Academy', 'BiLuna Careers', 'BiLuna Economics',
  ])
})
test('every module starts as planned', () => {
  expect(MODULES.every((m) => m.status === 'planned')).toBe(true)
})
test('planned modules link to the roadmap', () =>
  expect(moduleHref({ id: 'wellness', status: 'planned' })).toBe('/roadmap#wellness'))
test('working modules link into the patient portal', () =>
  expect(moduleHref({ id: 'health', status: 'working' })).toBe('/patient/health'))

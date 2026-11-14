import { dictionaries } from '@/lib/i18n/dictionaries'
import { MODULES, moduleStatusKey } from '@/lib/modules'
import { SAMPLE_CONCERNS, SAMPLE_ORG_TOTALS, SAMPLE_SHARED } from '@/lib/demo/sample'

test('concern counts add up to the conversations total', () => {
  expect(SAMPLE_CONCERNS.reduce((sum, c) => sum + c.count, 0)).toBe(SAMPLE_ORG_TOTALS.conversations)
})
test('every sample label exists in the dictionary', () => {
  for (const c of SAMPLE_CONCERNS) expect(dictionaries.en.org[c.key]).toBeTruthy()
  for (const s of SAMPLE_SHARED) {
    expect(dictionaries.en.sample[s.patient]).toBeTruthy()
    expect(dictionaries.en.sample[s.concern]).toBeTruthy()
    expect(dictionaries.en.sample[s.when]).toBeTruthy()
  }
})
test('five modules are in the demo scope and three are roadmap only', () => {
  expect(MODULES.filter((m) => m.scope === 'demo').map((m) => m.id)).toEqual([
    'health', 'medicine', 'navigator', 'academy', 'economics',
  ])
  expect(MODULES.filter((m) => m.scope === 'roadmap').map((m) => m.id)).toEqual([
    'intelligence', 'wellness', 'careers',
  ])
})
test('status label key follows status and scope', () => {
  expect(moduleStatusKey({ status: 'working', scope: 'demo' })).toBe('working')
  expect(moduleStatusKey({ status: 'planned', scope: 'demo' })).toBe('comingNext')
  expect(moduleStatusKey({ status: 'planned', scope: 'roadmap' })).toBe('roadmap')
})

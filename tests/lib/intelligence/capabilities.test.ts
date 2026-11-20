import { CAPABILITY_GROUPS } from '@/lib/intelligence/capabilities'
import { summarizeToday } from '@/lib/intelligence/stats'

const all = CAPABILITY_GROUPS.flatMap((g) => g.items)

test('the map holds all 35 parts of the Intelligence blueprint, in its four groups plus approved additions', () => {
  expect(all).toHaveLength(35)
  expect(CAPABILITY_GROUPS.map((g) => [g.id, g.items.length])).toEqual([
    ['core', 12],
    ['specialized', 6],
    ['coordination', 7],
    ['privacy', 7],
    ['additions', 3],
  ])
})

test('every part has an English and Bangla name and a known status', () => {
  for (const c of all) {
    expect(c.name.en.length).toBeGreaterThan(2)
    expect(c.name.bn).toMatch(/[ঀ-৿]/)
    expect(['working', 'demo', 'roadmap']).toContain(c.status)
  }
  expect(new Set(all.map((c) => c.id)).size).toBe(all.length)
})

test('statuses match what is really built', () => {
  const status = Object.fromEntries(all.map((c) => [c.id, c.status]))
  expect(status.reasoning).toBe('working')
  expect(status.safety).toBe('working')
  expect(status.contextMemory).toBe('working')
  expect(status.consent).toBe('working')
  expect(status.feedback).toBe('working')
  expect(status.voice).toBe('demo')
  expect(status.visualization3d).toBe('demo')
  expect(status.sourceVerification).toBe('roadmap')
  expect(status.coordinator).toBe('roadmap')
})

test('summarizeToday counts events and what is left of the daily limit', () => {
  const s = summarizeToday(
    [
      { kind: 'reply', lang: 'en' },
      { kind: 'reply', lang: 'bn' },
      { kind: 'reply', lang: 'bn' },
      { kind: 'retry', lang: 'bn' },
      { kind: 'blocked', lang: 'en' },
      { kind: 'clarify', lang: 'en' },
      { kind: 'profile_used', lang: null },
    ],
    12,
  )
  expect(s).toEqual({ answered: 3, checked: 4, caught: 2, followUps: 1, profileUses: 1, bangla: 2, english: 1, left: 28 })
})

test('the limit never goes below zero', () => {
  expect(summarizeToday([], 55).left).toBe(0)
})

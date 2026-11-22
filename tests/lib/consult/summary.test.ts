import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { makeSummary, parseSummary, summaryInstructions, EMPTY_SUMMARY } from '@/lib/consult/summary'

const history = [
  { author: 'patient' as const, body: '📍 Where it hurts: Lower belly · Pain 6/10' },
  { author: 'biluna' as const, body: 'It may be a urinary infection or gas.' },
  { author: 'patient' as const, body: 'Burning when passing urine, since 2 days' },
]

const good = JSON.stringify({
  concern: 'Lower belly pain with burning when passing urine',
  where: 'Lower belly',
  pain: '6/10',
  since: '2 days',
  symptoms: ['Burning when passing urine'],
  possibilities: ['May be a urinary infection', 'May be gas'],
  medicines: [],
  questions: ['Do I need a urine test?'],
  redFlags: ['Go to hospital if fever or vomiting starts'],
})

test('a good model answer becomes a clean summary', () => {
  const s = parseSummary('```json\n' + good + '\n```', 'en')
  expect(s.ok && s.content.concern).toBe('Lower belly pain with burning when passing urine')
  expect(s.ok && s.content.possibilities).toEqual(['May be a urinary infection', 'May be gas'])
  expect(s.ok && s.content.note).toBe('')
})

test('missing or wrong fields become empty, long text and lists are cut', () => {
  const s = parseSummary(JSON.stringify({ concern: 'x'.repeat(900), symptoms: Array(20).fill('a'), pain: 5, extra: 'drop me' }), 'en')
  expect(s.ok).toBe(true)
  if (!s.ok) return
  expect(s.content.concern).toHaveLength(300)
  expect(s.content.symptoms).toHaveLength(8)
  expect(s.content.pain).toBe('')
  expect(s.content).not.toHaveProperty('extra')
})

test('broken JSON, an empty concern or diagnosis wording are refused', () => {
  expect(parseSummary('not json', 'en')).toEqual({ ok: false, reason: 'error' })
  expect(parseSummary(JSON.stringify({ ...EMPTY_SUMMARY, concern: '' }), 'en')).toEqual({ ok: false, reason: 'error' })
  expect(parseSummary(JSON.stringify({ ...JSON.parse(good), possibilities: ['The diagnosis is UTI'] }), 'en')).toEqual({
    ok: false,
    reason: 'unsafe',
  })
})

test('the instructions ask for only what was said, possibilities with "may", in the patient language', () => {
  const i = summaryInstructions('bn')
  for (const s of ['JSON', 'possibilities', 'may', 'Bangla', 'never invent']) expect(i).toContain(s)
})

test('makeSummary sends the chat and returns the parsed summary', async () => {
  let sent = ''
  const r = await makeSummary(history, 'en', {
    generate: async ({ messages }) => {
      sent = String(messages.at(-1)?.content)
      return { text: good }
    },
  })
  expect(r.ok).toBe(true)
  expect(sent).toContain('Burning when passing urine')
})

test('makeSummary reports a model failure as busy or error, never throws', async () => {
  const r = await makeSummary(history, 'en', { generate: async () => Promise.reject(new Error('x')) })
  expect(r).toEqual({ ok: false, reason: 'error' })
})

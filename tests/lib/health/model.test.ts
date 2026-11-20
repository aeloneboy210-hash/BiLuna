import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { APICallError } from 'ai'
import { askBiLuna, type Generate } from '@/lib/health/model'
import { CONFIDENCE_PREFIX } from '@/lib/health/safety-filter'

const good = `It might be a cold.\n\n${CONFIDENCE_PREFIX.en} fairly sure.`
const history = [{ author: 'patient' as const, body: 'I have a cough' }]

function fake(...replies: (string | Error)[]) {
  const calls: Parameters<Generate>[0][] = []
  const generate: Generate = async (opts) => {
    calls.push(opts)
    const next = replies.shift()
    if (next instanceof Error) throw next
    return { text: next ?? '' }
  }
  return { generate, calls }
}

const apiError = (statusCode: number) =>
  new APICallError({ message: 'x', url: 'https://example.com', requestBodyValues: {}, statusCode })

test('a clean reply passes through', async () => {
  const f = fake(good)
  expect(await askBiLuna(history, 'en', { generate: f.generate })).toEqual({ ok: true, text: good, kind: 'answer', retried: false })
  expect(f.calls).toHaveLength(1)
  expect(f.calls[0].instructions).toContain('How sure I am:')
})

test('a reply naming the cause is retried exactly once', async () => {
  const f = fake('The cause is flu.', good)
  expect(await askBiLuna(history, 'en', { generate: f.generate })).toEqual({ ok: true, text: good, kind: 'answer', retried: true })
  expect(f.calls).toHaveLength(2)
  expect(f.calls[1].instructions).toMatch(/possibilities/i)
})

test('two bad replies give unsafe', async () => {
  const f = fake('The cause is flu.', 'Your diagnosis is flu.')
  expect(await askBiLuna(history, 'en', { generate: f.generate })).toEqual({ ok: false, reason: 'unsafe' })
  expect(f.calls).toHaveLength(2)
})

test('a 429 from the provider is busy', async () => {
  const f = fake(apiError(429))
  expect(await askBiLuna(history, 'en', { generate: f.generate })).toEqual({ ok: false, reason: 'busy' })
})

test('any other failure is error, and no message text is logged', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const f = fake(new Error('secret patient text'))
  expect(await askBiLuna(history, 'en', { generate: f.generate })).toEqual({ ok: false, reason: 'error' })
  expect(JSON.stringify(spy.mock.calls)).not.toContain('secret patient text')
  spy.mockRestore()
})

test('an empty reply is error', async () => {
  const f = fake('   ', '  ')
  expect(await askBiLuna(history, 'en', { generate: f.generate })).toEqual({ ok: false, reason: 'error' })
})

test('only the last 12 messages are sent, mapped to user and assistant', async () => {
  const long = Array.from({ length: 20 }, (_, i) => ({
    author: (i % 2 ? 'biluna' : 'patient') as 'patient' | 'biluna',
    body: `m${i}`,
  }))
  const f = fake(good)
  await askBiLuna(long, 'en', { generate: f.generate })
  const sent = f.calls[0].messages
  expect(sent).toHaveLength(12)
  expect(sent[0]).toEqual({ role: 'user', content: 'm8' })
  expect(sent[11]).toEqual({ role: 'assistant', content: 'm19' })
})

test('a consented profile reaches the instructions', async () => {
  const f = fake(good)
  await askBiLuna(history, 'en', { generate: f.generate, profile: '- Allergies: Penicillin' })
  expect(f.calls[0].instructions).toContain('- Allergies: Penicillin')
})

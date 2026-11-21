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

test('an answer keeps its 3D body tag at the end, after the confidence line check', async () => {
  const f = fake(`It might be your lungs.\n[[body:lungs]]\n\n${CONFIDENCE_PREFIX.en} fairly sure.`)
  const r = await askBiLuna(history, 'en', { generate: f.generate })
  expect(r).toEqual({ ok: true, text: `It might be your lungs.\n\n${CONFIDENCE_PREFIX.en} fairly sure.\n[[body:lungs]]`, kind: 'answer', retried: false })
})

test('a tag on an answer with no confidence line still gets the default line first', async () => {
  const f = fake('It might be your stomach.\n[[body:stomach]]')
  const r = await askBiLuna(history, 'en', { generate: f.generate })
  expect(r.ok && r.text.endsWith('[[body:stomach]]')).toBe(true)
  expect(r.ok && r.text).toContain(CONFIDENCE_PREFIX.en)
})

test('follow-up questions and unknown tags carry no 3D tag', async () => {
  const f = fake('[ASK] Where does it hurt? [[body:heart]]', 'Maybe a cold.\n[[body:aura]]')
  const a = await askBiLuna(history, 'en', { generate: f.generate })
  expect(a).toEqual({ ok: true, text: 'Where does it hurt?', kind: 'clarify', retried: false })
  const b = await askBiLuna(history, 'en', { generate: f.generate })
  expect(b.ok && b.text).not.toContain('[[')
})

test('the instructions explain the 3D body tag and the organ list', async () => {
  const f = fake(good)
  await askBiLuna(history, 'en', { generate: f.generate })
  expect(f.calls[0].instructions).toContain('[[body:')
  expect(f.calls[0].instructions).toContain('gallbladder')
})

test('the instructions ask for a 1 to 10 pain level and a caring tone', async () => {
  const f = fake(good)
  await askBiLuna(history, 'en', { generate: f.generate })
  expect(f.calls[0].instructions).toContain('1 to 10')
  expect(f.calls[0].instructions).toContain('Pain 7/10')
})

test('answers and follow-up questions keep their tap-to-answer options at the end', async () => {
  const f = fake(
    `It might be acid.\n\n${CONFIDENCE_PREFIX.en} unsure.\n[[options: Burning | Dull]]\n[[body:stomach]]`,
    '[ASK] What does it feel like? [[options: Burning | Stabbing]]',
  )
  const a = await askBiLuna(history, 'en', { generate: f.generate })
  expect(a.ok && a.text.endsWith('[[body:stomach]]\n[[options: Burning | Dull]]')).toBe(true)
  const b = await askBiLuna(history, 'en', { generate: f.generate })
  expect(b).toEqual({ ok: true, text: 'What does it feel like?\n[[options: Burning | Stabbing]]', kind: 'clarify', retried: false })
})

test('the instructions explain the place guide and the options tag', async () => {
  const f = fake(good)
  await askBiLuna(history, 'en', { generate: f.generate })
  expect(f.calls[0].instructions).toContain('What it could be')
  expect(f.calls[0].instructions).toContain('[[options:')
})

describe('after pointing at the body, every reply asks a tap-to-answer question for three rounds', () => {
  const pointed = { author: 'patient' as const, body: '📍 Where it hurts: Lower belly' }
  const reply = { author: 'biluna' as const, body: 'Some answer' }

  test('round 1: a reply without options gets the "what does it feel like" question', async () => {
    const f = fake(good)
    const r = await askBiLuna([pointed], 'en', { generate: f.generate })
    expect(r.ok && r.text.endsWith('What does it feel like?\n[[options: Sharp or stabbing | Dull ache | Burning | Comes and goes]]')).toBe(true)
  })

  test('round 2 and 3 ask when it started, then other signs; Bangla works', async () => {
    const two = await askBiLuna([pointed, reply, { author: 'patient', body: 'Burning' }], 'en', { generate: fake(good).generate })
    expect(two.ok && two.text).toContain('When did it start?')
    const three = await askBiLuna(
      [pointed, reply, { author: 'patient', body: 'x' }, reply, { author: 'patient', body: 'y' }],
      'bn',
      { generate: fake(`হতে পারে।\n\n${CONFIDENCE_PREFIX.bn} নিশ্চিত নই।`).generate },
    )
    expect(three.ok && three.text).toContain('এগুলোর কোনোটি কি আছে?')
  })

  test('a reply that already has options, round 4, or no pointing is left as it is', async () => {
    const withOpts = `${good}\n[[options: A | B]]`
    const a = await askBiLuna([pointed], 'en', { generate: fake(withOpts).generate })
    expect(a.ok && a.text).toBe(withOpts)
    const four = [pointed, reply, { author: 'patient' as const, body: 'a' }, reply, { author: 'patient' as const, body: 'b' }, reply, { author: 'patient' as const, body: 'c' }]
    const b = await askBiLuna(four, 'en', { generate: fake(good).generate })
    expect(b.ok && b.text).toBe(good)
    const c = await askBiLuna(history, 'en', { generate: fake(good).generate })
    expect(c.ok && c.text).toBe(good)
  })
})

import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { APICallError } from 'ai'
import { askBiLuna, type Generate } from '@/lib/health/model'
import { CONFIDENCE_PREFIX } from '@/lib/health/safety-filter'

const good = `It might be a cold.\n\n${CONFIDENCE_PREFIX.en} fairly sure.`
const history = [{ author: 'patient' as const, body: 'I feel unwell' }]
const coughHistory = [{ author: 'patient' as const, body: 'I have a cough' }]

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

test('a reply to a self-harm message has no confidence line and no tap-to-answer options', async () => {
  const f = fake(`You are not alone. Please call 999.\n\n${CONFIDENCE_PREFIX.en} this is general information.\n[[options: A | B]]`)
  const r = await askBiLuna([{ author: 'patient', body: 'I want to kill myself' }], 'en', { generate: f.generate })
  expect(r.ok && r.text).toBe('You are not alone. Please call 999.')
})

test('the instructions give the Bangla spelling of the name', async () => {
  const f = fake(good)
  await askBiLuna(history, 'bn', { generate: f.generate })
  expect(f.calls[0].instructions).toContain('"বিলুনা"')
})

test('an uploaded file goes to the AI with the last patient message, and the rules cover reports', async () => {
  const f = fake(good)
  const file = { name: 'r.png', mediaType: 'image/png', data: 'AAAA' }
  await askBiLuna([{ author: 'patient', body: '📎 r.png' }], 'en', { generate: f.generate, attachment: file })
  const last = f.calls[0].messages.at(-1)
  expect(last?.content).toEqual([
    { type: 'text', text: '📎 r.png' },
    { type: 'file', data: 'AAAA', mediaType: 'image/png', filename: 'r.png' },
  ])
  expect(f.calls[0].instructions).toContain('unclear')
  expect(f.calls[0].instructions).toContain('reference range')
})

test('the prescription rules cover Bangladeshi handwriting, sure/unsure marks and the packet check', async () => {
  const f = fake(good)
  await askBiLuna(history, 'en', { generate: f.generate })
  const i = f.calls[0].instructions
  for (const s of ['handwritten', '1+0+1', 'TDS', 'খাবারের', '✅', '⚠️', '❓', 'Yes, it matches']) expect(i).toContain(s)
})

test('when the AI leaves out the 3D tag, the patient\'s words light up an organ', async () => {
  const f = fake(good)
  const r = await askBiLuna(coughHistory, 'en', { generate: f.generate })
  expect(r.ok && r.text.endsWith('[[body:lungs]]')).toBe(true)
})

test('the AI\'s own tag wins over the backup guess', async () => {
  const f = fake(`${good}\n[[body:trachea]]`)
  const r = await askBiLuna(coughHistory, 'en', { generate: f.generate })
  expect(r.ok && r.text.endsWith('[[body:trachea]]')).toBe(true)
  expect(r.ok && r.text).not.toContain('[[body:lungs]]')
})

test('no backup guess on follow-up questions, after a 📍 tap, or on a danger message', async () => {
  const ask = fake('[ASK] How long have you had it?')
  const a = await askBiLuna(coughHistory, 'en', { generate: ask.generate })
  expect(a.ok && a.text).not.toContain('[[body:')
  const tapped = [{ author: 'patient' as const, body: '📍 Where it hurts: Head · Skull\nheadache' }]
  const b = await askBiLuna(tapped, 'en', { generate: fake(good).generate })
  expect(b.ok && b.text).not.toContain('[[body:')
  const danger = [{ author: 'patient' as const, body: 'I have chest pain and trouble breathing' }]
  const c = await askBiLuna(danger, 'en', { generate: fake(good).generate })
  expect(c.ok && c.text).not.toContain('[[body:')
})

test('a reply that invents a dose is written again without it', async () => {
  const f = fake(`Give him 250 mg paracetamol.\n\n${CONFIDENCE_PREFIX.en} general.`, good)
  const r = await askBiLuna([{ author: 'patient', body: 'My son has a fever' }], 'en', { generate: f.generate })
  expect(r).toEqual({ ok: true, text: `${good}\n[[sources: fever, childDanger]]`, kind: 'answer', retried: true })
  expect(f.calls[1].instructions).toMatch(/dose/i)
})

test('a reply that invents a dose twice is refused', async () => {
  const bad = `Take 1000 mg.\n\n${CONFIDENCE_PREFIX.en} general.`
  const f = fake(bad, bad)
  expect(await askBiLuna([{ author: 'patient', body: 'headache' }], 'en', { generate: f.generate })).toEqual({ ok: false, reason: 'unsafe' })
})

test('a dose the patient wrote, or one from their uploaded prescription, may be repeated', async () => {
  const echo = `Napa 500 mg is paracetamol.\n\n${CONFIDENCE_PREFIX.en} general.`
  const a = await askBiLuna([{ author: 'patient', body: 'What is Napa 500mg?' }], 'en', { generate: fake(echo).generate })
  expect(a.ok).toBe(true)
  const rx = `Line 1: Napa 500 mg, 1+0+1.\n\n${CONFIDENCE_PREFIX.en} general.`
  const b = await askBiLuna([{ author: 'patient', body: '📎 rx.jpg' }], 'en', {
    generate: fake(rx).generate,
    attachment: { name: 'rx.jpg', mediaType: 'image/jpeg', data: 'AAAA' },
  })
  expect(b.ok).toBe(true)
})

test('a follow-up about an uploaded prescription may repeat the dose BiLuna already read from it', async () => {
  const history = [
    { author: 'patient' as const, body: '📎 rx.jpg' },
    { author: 'biluna' as const, body: `A prescription.\n✅ Napa 500 mg, 1+0+1, 5 days.\n\n${CONFIDENCE_PREFIX.en} general.` },
    { author: 'patient' as const, body: 'What does line 1 mean?' },
  ]
  const r = await askBiLuna(history, 'en', {
    generate: fake(`Line 1 is Napa 500 mg, 1+0+1: one in the morning and one at night.\n\n${CONFIDENCE_PREFIX.en} general.`).generate,
  })
  expect(r.ok).toBe(true)
})

test('a dose hidden in tap-to-answer options is caught too', async () => {
  const sneaky = `It may be a tension headache.\n\n${CONFIDENCE_PREFIX.en} general.\n[[options: Take 500 mg | Take 1000 mg]]`
  const r = await askBiLuna([{ author: 'patient', body: 'headache' }], 'en', { generate: fake(sneaky, sneaky).generate })
  expect(r).toEqual({ ok: false, reason: 'unsafe' })
})

test('a medicine question answered with small talk is asked again as a real question', async () => {
  const chat = '[SMALL_TALK] Hello! I am BiLuna. What is bothering you?'
  const answer = `Ace syrup is a brand of paracetamol, used for fever and pain.\n\n${CONFIDENCE_PREFIX.bn} সাধারণ তথ্য।`
  const f = fake(chat, answer)
  const r = await askBiLuna([{ author: 'patient', body: 'Ace সিরাপ কিসের জন্য?' }], 'bn', { generate: f.generate })
  expect(r.ok && r.kind).toBe('answer')
  expect(f.calls[1].instructions).toMatch(/medicine/i)
})

test('a real greeting stays small talk', async () => {
  const f = fake('[SMALL_TALK] Hello! I am BiLuna.')
  const r = await askBiLuna([{ author: 'patient', body: 'hi' }], 'en', { generate: f.generate })
  expect(r.ok && r.kind).toBe('smallTalk')
  expect(f.calls).toHaveLength(1)
})

test('a Bangla reply with a stray foreign word is written again once', async () => {
  const stray = `নাপা জ্বর menurunkan ব্যবহৃত হয়।\n${CONFIDENCE_PREFIX.bn} সাধারণ তথ্য।`
  const clean = `নাপা জ্বর কমাতে ব্যবহৃত হয়।\n${CONFIDENCE_PREFIX.bn} সাধারণ তথ্য।`
  const f = fake(stray, clean)
  const r = await askBiLuna([{ author: 'patient', body: 'নাপা কিসের জন্য?' }], 'bn', { generate: f.generate })
  expect(r.ok && r.text).toBe(clean)
  expect(f.calls[1].instructions).toMatch(/only Bangla/i)
})

test('if the rewrite still has the stray word, the reply is shown rather than refused', async () => {
  const stray = `নাপা জ্বর menurunkan ব্যবহৃত হয়।\n${CONFIDENCE_PREFIX.bn} সাধারণ তথ্য।`
  const r = await askBiLuna([{ author: 'patient', body: 'নাপা কিসের জন্য?' }], 'bn', { generate: fake(stray, stray).generate })
  expect(r.ok).toBe(true)
})

test('with a file attached, doses may only appear on the medicine lines read from it', async () => {
  const file = { name: 'rx.jpg', mediaType: 'image/jpeg', data: 'AAAA' }
  const read = `A prescription.\n✅ Napa 500 mg, 1+0+1, 5 days.\n\n${CONFIDENCE_PREFIX.en} general.`
  const ok = await askBiLuna([{ author: 'patient', body: '📎 rx.jpg' }], 'en', { attachment: file, generate: fake(read).generate })
  expect(ok.ok).toBe(true)
  const invented = `This is a blood test report. Your haemoglobin is low.\nYou can take 1 tablet of iron 200 mg daily.\n\n${CONFIDENCE_PREFIX.en} general.`
  const bad = await askBiLuna([{ author: 'patient', body: '📎 cbc.jpg' }], 'en', {
    attachment: file,
    generate: fake(invented, invented).generate,
  })
  expect(bad).toEqual({ ok: false, reason: 'unsafe' })
})

test('a dose BiLuna once wrote outside a medicine line does not become allowed later', async () => {
  const history = [
    { author: 'patient' as const, body: 'fever' },
    { author: 'biluna' as const, body: `Rest well. 500 mg.\n\n${CONFIDENCE_PREFIX.en} general.` },
    { author: 'patient' as const, body: 'and then?' },
  ]
  const again = `You may take 500 mg.\n\n${CONFIDENCE_PREFIX.en} general.`
  const r = await askBiLuna(history, 'en', { generate: fake(again, again).generate })
  expect(r).toEqual({ ok: false, reason: 'unsafe' })
})

test.each([
  '1. ✅ Napa 500 mg 1+0+1',
  '১) নাপা ৫০০ মি.গ্রা. ১+০+১',
  '- **Napa 500 mg** — 1+0+1',
  '1. Napa Extend 665 mg: 1+0+1',
  '| Napa | 500 mg | 1+0+1 |',
  '✔️ Seclo 20 mg 1+0+0',
])('a prescription read in the format %p is allowed', async (line) => {
  const file = { name: 'rx.jpg', mediaType: 'image/jpeg', data: 'AAAA' }
  const read = `A prescription.\n${line}\n\n${CONFIDENCE_PREFIX.en} general.`
  const r = await askBiLuna([{ author: 'patient', body: '📎 rx.jpg' }], 'en', { attachment: file, generate: fake(read).generate })
  expect(r.ok).toBe(true)
})

test('an answer lists the guideline cards it was given, and the AI reads them first', async () => {
  const f = fake(good)
  const r = await askBiLuna([{ author: 'patient', body: 'I think I have dengue' }], 'en', { generate: f.generate })
  expect(r.ok && r.text).toBe(`${good}\n[[sources: dengue]]`)
  expect(f.calls[0].instructions).toContain('<card title="Dengue"')
})

test('no cards for a greeting, and no sources under small talk', async () => {
  const f = fake('[SMALL_TALK] Hi! How are you feeling today?')
  const r = await askBiLuna([{ author: 'patient', body: 'hi' }], 'en', { generate: f.generate })
  expect(r.ok && r.text).not.toContain('[[sources')
  expect(f.calls[0].instructions).not.toContain('Guideline cards')
})

test('a sources line written by the AI itself is removed', async () => {
  const f = fake(`${good}\n[[sources: typhoid]]`)
  const r = await askBiLuna(history, 'en', { generate: f.generate })
  expect(r.ok && r.text).toBe(good)
})

test('earlier sources lines are not shown to the AI', async () => {
  const f = fake(good)
  await askBiLuna(
    [
      { author: 'patient', body: 'I think I have dengue' },
      { author: 'biluna', body: `${good}\n[[sources: dengue]]` },
      { author: 'patient', body: 'thanks, anything else?' },
    ],
    'en',
    { generate: f.generate },
  )
  expect(JSON.stringify(f.calls[0].messages)).not.toContain('[[sources')
})

test('after the first reply, a stock comfort opener is dropped and the AI is told to skip it', async () => {
  const f = fake(`শুনে খুব খারাপ লাগছে। আমি আপনার পাশে আছি।\n\n${good}`)
  const r = await askBiLuna(
    [
      { author: 'patient', body: 'I have a cough' },
      { author: 'biluna', body: 'How long have you had it?' },
      { author: 'patient', body: 'two days' },
    ],
    'en',
    { generate: f.generate },
  )
  expect(r.ok && r.text.startsWith('It might be a cold.')).toBe(true)
  expect(f.calls[0].instructions).toContain('No comforting opener')
})

test('the first reply may keep its one opening line', async () => {
  const f = fake(`That sounds uncomfortable.\n\n${good}`)
  const r = await askBiLuna([{ author: 'patient', body: 'I feel sick' }], 'en', { generate: f.generate })
  expect(r.ok && r.text.startsWith('That sounds uncomfortable.')).toBe(true)
  expect(f.calls[0].instructions).not.toContain('No comforting opener')
})

test('"amk banglai bolo" asks the AI to give its last reply again in Bangla, not to start over', async () => {
  const f = fake('বাহুর মাঝখানে ব্যথা।\n\nকব্জি বা আঙুল নাড়ালে কি ব্যথা বাড়ে?\n[[options: হ্যাঁ | না]]')
  await askBiLuna(
    [
      { author: 'patient', body: '📍 Middle of the left forearm' },
      { author: 'biluna', body: 'Pain in the middle of your left forearm.\n\nDoes the pain feel worse when you move your wrist?' },
      { author: 'patient', body: 'amk banglai bolo' },
    ],
    'bn',
    { generate: f.generate },
  )
  expect(f.calls[0].instructions).toMatch(/Give your previous reply again, all of it, in Bangla/)
})

test('an ordinary message gets no language-switch note', async () => {
  const f = fake(good)
  await askBiLuna(history, 'en', { generate: f.generate })
  expect(f.calls[0].instructions).not.toMatch(/previous reply again/)
})

test('a reply that repeats an earlier one word for word is written again in fresh words', async () => {
  const same = 'I am here to help you with your health whenever you feel ready. Is there something on your mind?'
  const fresh = "You seem upset right now. If something is bothering you, I'm listening."
  const f = fake(`[SMALL_TALK] ${same}`, `[SMALL_TALK] ${fresh}`)
  const r = await askBiLuna(
    [
      { author: 'patient', body: 'fuck you' },
      { author: 'biluna', body: same },
      { author: 'patient', body: 'no fuck you' },
    ],
    'en',
    { generate: f.generate },
  )
  expect(r.ok && r.text).toBe(fresh)
  expect(f.calls[1].instructions).toMatch(/word for word/)
})

test('if the second try repeats too, it is sent rather than failing', async () => {
  const same = 'Is there something on your mind?'
  const f = fake(`[SMALL_TALK] ${same}`, `[SMALL_TALK] ${same}`)
  const r = await askBiLuna(
    [
      { author: 'patient', body: 'hmm' },
      { author: 'biluna', body: same },
      { author: 'patient', body: 'hmm' },
    ],
    'en',
    { generate: f.generate },
  )
  expect(r.ok && r.text).toBe(same)
})

test('a reply to swearing gets no confidence line, even when the AI forgets the small-talk mark', async () => {
  const f = fake("You seem upset right now. If something is bothering you, I'm listening.")
  const r = await askBiLuna([{ author: 'patient', body: 'fuck you' }], 'en', { generate: f.generate })
  expect(r.ok && r.text).toBe("You seem upset right now. If something is bothering you, I'm listening.")
  expect(r.ok && r.kind).toBe('smallTalk')
})

test('a short calm Bangla reply to swearing stays small talk even with a "seems" word in it', async () => {
  const f = fake('মনে হচ্ছে মনটা ভালো নেই। কোনো কষ্ট থাকলে বলতে পারেন, আমি শুনছি।')
  const r = await askBiLuna([{ author: 'patient', body: 'তুই একটা ফালতু বেয়াদব' }], 'bn', { generate: f.generate })
  expect(r.ok && r.kind).toBe('smallTalk')
  expect(r.ok && r.text).not.toContain('আমি কতটা নিশ্চিত')
})

test('a real health answer to a rude message keeps its confidence line', async () => {
  const f = fake(good)
  const r = await askBiLuna([{ author: 'patient', body: 'this fucking cough will not stop' }], 'en', { generate: f.generate })
  expect(r.ok && r.kind).toBe('answer')
})

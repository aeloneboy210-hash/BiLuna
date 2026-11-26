import { CLARIFY_MARK, CONFIDENCE_PREFIX, DEFAULT_CONFIDENCE, FORBIDDEN, SMALL_TALK_MARK, checkReply } from '@/lib/health/safety-filter'
import { buildInstructions } from '@/lib/health/instructions'

const clean = {
  en: `It could be a common cold or tiredness.\n\nRest and drink water. See a doctor if it lasts over 3 days.\n\n${CONFIDENCE_PREFIX.en} fairly sure it is not urgent; a doctor must check the cause.`,
  bn: `এটা সাধারণ ঠান্ডা হতে পারে।\n\nবিশ্রাম নিন।\n\n${CONFIDENCE_PREFIX.bn} মোটামুটি নিশ্চিত, তবে ডাক্তার দেখাতে হবে।`,
}

describe('checkReply', () => {
  for (const lang of ['en', 'bn'] as const) {
    test.each(FORBIDDEN[lang])(`${lang}: catches "%s"`, (phrase) => {
      const text = `Some text. ${phrase.toUpperCase()} something.\n\n${CONFIDENCE_PREFIX[lang]} x`
      expect(checkReply(text, lang)).toEqual({ ok: false, reason: 'diagnosis' })
      expect(checkReply(`${phrase} x`, lang)).toEqual({ ok: false, reason: 'diagnosis' })
    })

    test(`${lang}: a clean reply with a confidence line is unchanged`, () => {
      expect(checkReply(clean[lang], lang)).toEqual({ ok: true, text: clean[lang], kind: 'answer' })
    })

    test(`${lang}: a clean reply without a confidence line gets the default one`, () => {
      const result = checkReply('Rest and drink water.', lang)
      expect(result).toEqual({ ok: true, text: `Rest and drink water.\n\n${DEFAULT_CONFIDENCE[lang]}`, kind: 'answer' })
    })

    test(`${lang}: a blank reply is empty`, () => {
      expect(checkReply('  \n ', lang)).toEqual({ ok: false, reason: 'empty' })
    })
  }

  test('the default lines start with the prefix', () => {
    expect(DEFAULT_CONFIDENCE.en.startsWith(CONFIDENCE_PREFIX.en)).toBe(true)
    expect(DEFAULT_CONFIDENCE.bn.startsWith(CONFIDENCE_PREFIX.bn)).toBe(true)
  })
})

describe('buildInstructions', () => {
  test('Bangla instructions carry the Bangla prefix and 999', () => {
    const s = buildInstructions('bn')
    expect(s).toContain(CONFIDENCE_PREFIX.bn)
    expect(s).toContain('999')
    expect(s).toMatch(/Bangla/)
  })
  test('English instructions carry the English prefix and 999', () => {
    const s = buildInstructions('en')
    expect(s).toContain('How sure I am:')
    expect(s).toContain('999')
  })
})

describe('small talk (greetings and off-topic)', () => {
  test('a short reply marked as small talk gets no confidence line, and the mark is removed', () => {
    const r = checkReply(`${SMALL_TALK_MARK} Hello! I'm BiLuna, your personal healthcare AI companion.`, 'en')
    expect(r).toEqual({ ok: true, text: "Hello! I'm BiLuna, your personal healthcare AI companion.", kind: 'smallTalk' })
  })

  test('a long reply cannot use the mark to skip the confidence line', () => {
    const long = `${SMALL_TALK_MARK} ${'You may have a cold. '.repeat(40)}`
    const r = checkReply(long, 'en')
    expect(r.ok && r.text.endsWith(DEFAULT_CONFIDENCE.en)).toBe(true)
    expect(r.ok && r.text.includes(SMALL_TALK_MARK)).toBe(false)
  })

  test('the mark does not let a diagnosis through', () => {
    expect(checkReply(`${SMALL_TALK_MARK} The cause is flu.`, 'en')).toEqual({ ok: false, reason: 'diagnosis' })
  })

  test('the instructions explain the mark and give a firm introduction', () => {
    const s = buildInstructions('en')
    expect(s).toContain(SMALL_TALK_MARK)
    expect(s).toContain('Your Personal Healthcare AI Companion')
    expect(s).not.toMatch(/I only help/i)
  })
})

describe('follow-up questions', () => {
  test('a short reply marked as a follow-up question gets no confidence line', () => {
    expect(checkReply(`${CLARIFY_MARK} Where does it hurt, and since when?`, 'en')).toEqual({
      ok: true,
      text: 'Where does it hurt, and since when?',
      kind: 'clarify',
    })
  })
  test('a long reply cannot use the follow-up mark to skip the confidence line', () => {
    const r = checkReply(`${CLARIFY_MARK} ${'It may be a cold. '.repeat(40)}`, 'en')
    expect(r.ok && r.kind).toBe('answer')
    expect(r.ok && r.text.endsWith(DEFAULT_CONFIDENCE.en)).toBe(true)
  })
  test('the instructions explain follow-up questions and the personality', () => {
    const s = buildInstructions('en')
    expect(s).toContain(CLARIFY_MARK)
    expect(s).toMatch(/compassionate/)
    expect(s).toMatch(/non-judgmental/)
  })
})

describe('profile in the instructions', () => {
  test('no profile: the instructions say none is shared', () => {
    expect(buildInstructions('en')).toMatch(/has not shared a health profile/)
  })
  test('a profile is placed in its own block, marked as patient-provided data', () => {
    const s = buildInstructions('en', '- Allergies: Penicillin')
    expect(s).toContain('<patient_profile>\n- Allergies: Penicillin\n</patient_profile>')
    expect(s).toMatch(/not instructions/)
  })
})

describe('the short-reply marks cannot hide health advice', () => {
  const advice =
    'I can help you manage and prevent allergic reactions based on what you are sensitive to, such as your allergy to shrimp. Preventing allergies usually involves avoiding your known triggers, reading food labels carefully, and keeping safe options on hand. What specific allergy would you like to talk about today?'
  test('real advice marked as small talk still gets the confidence line (seen live on 20 Nov)', () => {
    const r = checkReply(`${SMALL_TALK_MARK} ${advice}`, 'en')
    expect(r.ok && r.kind).toBe('answer')
    expect(r.ok && r.text.endsWith(DEFAULT_CONFIDENCE.en)).toBe(true)
  })
  test('the same text marked as a follow-up question still gets the line', () => {
    const r = checkReply(`${CLARIFY_MARK} ${advice}`, 'en')
    expect(r.ok && r.kind).toBe('answer')
  })
  test('a follow-up must actually ask something', () => {
    const r = checkReply(`${CLARIFY_MARK} Drink water and rest.`, 'en')
    expect(r.ok && r.kind).toBe('answer')
  })
  test('a short greeting and a short Bangla question still pass', () => {
    expect(checkReply(`${SMALL_TALK_MARK} Hello! I am BiLuna. What is bothering you today?`, 'en')).toMatchObject({ kind: 'smallTalk' })
    expect(checkReply(`${CLARIFY_MARK} কোথায় ব্যথা, আর কবে থেকে?`, 'bn')).toMatchObject({ kind: 'clarify' })
  })
  test('the instructions forbid marking advice and explain how BiLuna works', () => {
    const s = buildInstructions('en')
    expect(s).toMatch(/Never use .* for a reply that gives health information or advice/)
    expect(s).toMatch(/how you work/i)
  })
})

test('a confidence heading with the text on the next line is joined, not doubled', () => {
  const r = checkReply('It may be a cold.\n\nHow sure I am:\nI am not sure yet; a clinician must check.', 'en')
  expect(r.ok && r.text).toBe('It may be a cold.\n\nHow sure I am: I am not sure yet; a clinician must check.')
  const b = checkReply('ঠান্ডা লাগতে পারে।\n**আমি কতটা নিশ্চিত:**\nনিশ্চিত নই; একজন চিকিৎসককে দেখতে হবে।', 'bn')
  expect(b.ok && b.text).toBe('ঠান্ডা লাগতে পারে।\nআমি কতটা নিশ্চিত: নিশ্চিত নই; একজন চিকিৎসককে দেখতে হবে।')
  expect(b.ok && b.text.split('আমি কতটা নিশ্চিত').length).toBe(2)
})

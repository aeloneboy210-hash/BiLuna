import { CONFIDENCE_PREFIX, DEFAULT_CONFIDENCE, FORBIDDEN, SMALL_TALK_MARK, checkReply } from '@/lib/health/safety-filter'
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
      expect(checkReply(clean[lang], lang)).toEqual({ ok: true, text: clean[lang] })
    })

    test(`${lang}: a clean reply without a confidence line gets the default one`, () => {
      const result = checkReply('Rest and drink water.', lang)
      expect(result).toEqual({ ok: true, text: `Rest and drink water.\n\n${DEFAULT_CONFIDENCE[lang]}` })
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
    expect(r).toEqual({ ok: true, text: "Hello! I'm BiLuna, your personal healthcare AI companion." })
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

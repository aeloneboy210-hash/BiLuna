import { checkReply, CONFIDENCE_PREFIX } from '@/lib/health/safety-filter'

// Found by the November bug hunt.
test.each([
  'You have dengue.',
  'This is most likely typhoid.',
  'It is definitely a migraine.',
  'You are suffering from asthma.',
  'You definitely have  a fever',
  'আপনার ডেঙ্গু হয়েছে।',
  'এটা টাইফয়েড।',
])('a diagnosis is blocked: %p', (text) => {
  expect(checkReply(`${text}\n\n${CONFIDENCE_PREFIX.en} general.`, 'en')).toEqual({ ok: false, reason: 'diagnosis' })
})

test.each([
  'Only a doctor can find out what the cause is.',
  'The cause is not clear without tests.',
  "The cause isn't clear yet. It may be gastritis or acidity.",
  'এটি একমাত্র কারণ নয়, আরও কারণ থাকতে পারে।',
  'নিশ্চিতভাবে আপনার কী হয়েছে তা বলা যায় না।',
  'If you have diabetes, tell your doctor.',
  'Do you have asthma?',
])('a careful sentence is not blocked: %p', (text) => {
  expect(checkReply(`${text}\n\n${CONFIDENCE_PREFIX.en} general.`, 'en').ok).toBe(true)
})

test.each([
  '[ASK] You likely have dengue, go rest and take napa. Do you have fever?',
  'Take paracetamol and rest at home for now. Does it hurt?',
  '[SMALL_TALK] You probably have a viral fever, rest well and drink water.',
])('advice dressed as a question or small talk still gets the confidence line: %p', (text) => {
  const r = checkReply(text, 'en')
  expect(r.ok && r.kind).toBe('answer')
  expect(r.ok && r.text).toContain(CONFIDENCE_PREFIX.en)
})

test.each(['[ASK] Where does it hurt, and since when?', '[SMALL_TALK] Hello! How can I help you today?', 'I am sorry to hear that. Where is the pain?'])(
  'real questions and greetings stay as they are: %p',
  (text) => {
    const r = checkReply(text, 'en')
    expect(r.ok).toBe(true)
    expect(r.ok && r.kind).not.toBe('answer')
  },
)

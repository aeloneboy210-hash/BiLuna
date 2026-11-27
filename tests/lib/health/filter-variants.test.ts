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

// Second review of the bug-hunt fixes.
test.each(['আসল কারণ হলো ডেঙ্গু, ডাক্তার দেখান।', 'The cause is dengue; a doctor can confirm.'])(
  'mentioning a doctor does not excuse a diagnosis: %p',
  (text) => expect(checkReply(`${text}\n\n${CONFIDENCE_PREFIX.en} x`, 'en')).toEqual({ ok: false, reason: 'diagnosis' }),
)

test.each([
  'Since you have diabetes, keep checking your sugar.',
  'Because you have asthma, keep your inhaler close.',
  'In case you have asthma, tell the doctor.',
  'If you think you have dengue, get a blood test.',
  'I cannot say you have dengue.',
  'আপনার ডায়াবেটিস আছে বলে চিনি কম খাওয়া ভালো।',
  'It may be dengue or a viral fever.',
])('restating a known condition or a possibility is not blocked: %p', (text) => {
  expect(checkReply(`${text}\n\n${CONFIDENCE_PREFIX.en} x`, 'en').ok).toBe(true)
})

test.each(['[ASK] আমি এখানে আছি। কবে থেকে জ্বর?', '[SMALL_TALK] হ্যালো! আমি এখানে আছি, কী সাহায্য করতে পারি?', '[SMALL_TALK] Hi! Take care.', '[ASK] Tell me the rest. How long?'])(
  'greetings and questions keep their kind: %p',
  (text) => {
    const r = checkReply(text, 'bn')
    expect(r.ok && r.kind).not.toBe('answer')
  },
)

test('a warm self-introduction stays small talk (no confidence line)', () => {
  const intro =
    "[SMALL_TALK] I'm BiLuna, and I'm here to look after your health with you. If your child has a fever at night, I can help you understand what to watch for and when to go to a doctor. I can also read a prescription or a lab report you photograph and explain it in simple words. I never guess a diagnosis or a medicine dose, and I always tell you how sure I am. How are you feeling today?"
  const r = checkReply(intro, 'en')
  expect(r.ok && r.kind).toBe('smallTalk')
})

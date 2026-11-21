import type { Lang } from '@/lib/i18n/lang'
import { POINT_MARK } from '@/lib/body/chat-body'

type Question = { q: string; options: string[] }

/** The fixed questions that narrow a pointed place down, one per round, in case the AI asks none. */
const QUESTIONS: Record<Lang, Question[]> = {
  en: [
    { q: 'What does it feel like?', options: ['Sharp or stabbing', 'Dull ache', 'Burning', 'Comes and goes'] },
    { q: 'When did it start?', options: ['Today', '2–3 days ago', 'About a week ago', 'Longer, it keeps coming back'] },
    { q: 'Do you have any of these too?', options: ['Fever', 'Vomiting or nausea', 'Dizziness or weakness', 'None of these'] },
  ],
  bn: [
    { q: 'ব্যথাটা কেমন লাগছে?', options: ['তীক্ষ্ণ বা খোঁচা দেওয়া', 'ভোঁতা ব্যথা', 'জ্বালাপোড়া', 'আসে আর যায়'] },
    { q: 'কবে থেকে শুরু?', options: ['আজ', '২–৩ দিন আগে', 'প্রায় এক সপ্তাহ আগে', 'অনেক দিন, বারবার হয়'] },
    { q: 'এগুলোর কোনোটি কি আছে?', options: ['জ্বর', 'বমি বা বমি ভাব', 'মাথা ঘোরা বা দুর্বলতা', 'এগুলোর কোনোটি নেই'] },
  ],
}

/**
 * Which narrowing round this reply is (1 to 3) after the patient last pointed at the body, or null.
 * Round 1 answers the pointed message itself; each later patient message is one more round.
 */
export function placeRound(history: { author: 'patient' | 'biluna'; body: string }[]): number | null {
  const patient = history.filter((m) => m.author === 'patient')
  for (let i = patient.length - 1; i >= 0; i--) {
    if (patient[i].body.startsWith(POINT_MARK)) {
      const round = patient.length - i
      return round <= QUESTIONS.en.length ? round : null
    }
  }
  return null
}

export function placeQuestion(round: number, lang: Lang): Question {
  return QUESTIONS[lang][round - 1]
}

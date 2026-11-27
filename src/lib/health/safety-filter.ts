import type { Lang } from '@/lib/i18n/lang'

/** Every health reply ends with a line starting with this. */
export const CONFIDENCE_PREFIX: Record<Lang, string> = {
  en: 'How sure I am:',
  bn: 'আমি কতটা নিশ্চিত:',
}

export const DEFAULT_CONFIDENCE: Record<Lang, string> = {
  en: `${CONFIDENCE_PREFIX.en} this is general information only. A doctor must examine you to know what is going on.`,
  bn: `${CONFIDENCE_PREFIX.bn} এটি শুধু সাধারণ তথ্য। আসলে কী হচ্ছে তা জানতে একজন ডাক্তারকে আপনাকে দেখতে হবে।`,
}

/** Phrases that state a diagnosis or a single cause. A backstop: the standing instructions do the main work. */
export const FORBIDDEN: Record<Lang, string[]> = {
  en: [
    'your diagnosis is',
    'you are diagnosed',
    'i diagnose',
    'the cause is',
    'this is definitely a',
    'this is definitely an',
    'you definitely have a',
    'you definitely have an',
  ],
  bn: ['আপনার রোগ নির্ণয়', 'নিশ্চিতভাবে আপনার', 'আসল কারণ হলো', 'একমাত্র কারণ', 'আপনার অবশ্যই হয়েছে'],
}

/**
 * The model starts a greeting or an off-topic reply with this mark. The filter removes it and skips the
 * confidence line, but only for short replies, so a health answer cannot use it to drop the line.
 */
export const SMALL_TALK_MARK = '[SMALL_TALK]'
/** The model starts a reply that only asks follow-up questions with this mark. Same rules as small talk. */
export const CLARIFY_MARK = '[ASK]'
/** Longest reply that may skip the confidence line. A greeting fits; a paragraph of advice does not. */
// A warm introduction in Bangla can run to 500 characters; advice is still caught (ADVICE) whatever the length.
const SMALL_TALK_MAX = 700
const CLARIFY_MAX = 220

export type ReplyKind = 'answer' | 'smallTalk' | 'clarify'
export type CheckResult = { ok: true; text: string; kind: ReplyKind } | { ok: false; reason: 'diagnosis' | 'empty' }

export function checkReply(text: string, lang: Lang): CheckResult {
  let trimmed = text.trim()
  const marked: ReplyKind = trimmed.startsWith(SMALL_TALK_MARK)
    ? 'smallTalk'
    : trimmed.startsWith(CLARIFY_MARK)
      ? 'clarify'
      : 'answer'
  trimmed = trimmed.split(SMALL_TALK_MARK).join('').split(CLARIFY_MARK).join('').trim()
  if (!trimmed) return { ok: false, reason: 'empty' }

  if (statesDiagnosis(trimmed)) return { ok: false, reason: 'diagnosis' }

  // A greeting or a follow-up question may skip the confidence line, but not if it also gives advice or
  // says what the illness may be: then it is an answer, and gets the line.
  const advises = ADVICE.test(statements(trimmed))
  const shortEnough =
    !advises &&
    ((marked === 'smallTalk' && trimmed.length <= SMALL_TALK_MAX) ||
      (marked === 'clarify' && trimmed.length <= CLARIFY_MAX && /[?？]/.test(trimmed)))
  if (shortEnough) return { ok: true, text: trimmed, kind: marked }
  // Some models ask their follow-up questions without the [ASK] mark. A short reply that ends with a
  // question and has no confidence line is a follow-up, so no "How sure I am" is added under a question.
  const hasConfidence = trimmed.includes(CONFIDENCE_PREFIX.en) || trimmed.includes(CONFIDENCE_PREFIX.bn)
  if (marked === 'answer' && !hasConfidence && !advises && onlyAsks(trimmed)) {
    return { ok: true, text: trimmed, kind: 'clarify' }
  }

  trimmed = joinConfidenceHeading(trimmed)
  const lines = trimmed.split('\n').filter((l) => l.trim())
  const last = lines[lines.length - 1].trim().replace(/^[*_#>\s]+/, '')
  if (last.startsWith(CONFIDENCE_PREFIX.en) || last.startsWith(CONFIDENCE_PREFIX.bn)) {
    return { ok: true, text: trimmed, kind: 'answer' }
  }
  return { ok: true, text: `${trimmed}\n\n${DEFAULT_CONFIDENCE[lang]}`, kind: 'answer' }
}

const DISEASES_EN =
  'dengue|typhoid|malaria|covid|corona|tuberculosis|tb|pneumonia|cancer|diabetes|asthma|migraine|jaundice|hepatitis|cholera|appendicitis|gastritis|an? ulcer|chikungunya|bronchitis|sinusitis|tonsillitis|a uti|kidney stones?|a heart attack|a stroke'
const DISEASES_BN =
  'ডেঙ্গু|টাইফয়েড|ম্যালেরিয়া|কোভিড|করোনা|যক্ষ্মা|নিউমোনিয়া|ক্যান্সার|ডায়াবেটিস|হাঁপানি|অ্যাজমা|মাইগ্রেন|জন্ডিস|হেপাটাইটিস|কলেরা|অ্যাপেন্ডিসাইটিস|গ্যাস্ট্রিক|আলসার|চিকুনগুনিয়া|স্ট্রোক|হার্ট অ্যাটাক'

/**
 * Sentences that name the illness as a fact. Only where "you have …" opens the sentence or a clause, so
 * "Since you have diabetes…", "If you think you have dengue…" and questions do not count; a Bangla
 * "আপনার ডেঙ্গু হয়েছে" only when it ends the sentence, so "আপনার ডায়াবেটিস আছে বলে…" does not.
 */
const DIAGNOSIS: RegExp[] = [
  new RegExp(String.raw`(?:^|[,;:]\s*)you (?:have|'ve got|have got|are suffering from|suffer from)\s+(?:an? )?(?:${DISEASES_EN})\b`),
  new RegExp(String.raw`(?:^|[,;:]\s*)(?:this|it) (?:is|'s) (?:most likely|definitely|certainly|clearly|surely) (?:an? )?(?:${DISEASES_EN})\b`),
  /(?:^|[,;:]\s*)you are suffering from\b/,
  new RegExp(String.raw`(?:^|[,;:]\s*)আপনার (?:${DISEASES_BN})(?: রোগ)? (?:হয়েছে|আছে)\s*[।.!]?$`.normalize('NFC')),
  new RegExp(String.raw`^(?:এটা|এটি|এটাই|এটিই) (?:${DISEASES_BN})(?: রোগ)?\s*(?:হয়েছে)?\s*[।.!]?$`.normalize('NFC')),
]

/** After a forbidden phrase, words that turn it into a careful sentence: "the cause is not clear", "…কারণ নয়". */
const CAREFUL_AFTER = /^(?:n['’]?t\b|\s+(?:not|unclear|unknown|uncertain|hard|difficult)\b|\s*(?:নয়|না)(?:\s|[,।.]|$))/
/**
 * In the same sentence, real hedges that make it careful: only a doctor can say, it cannot be said without
 * tests. Merely mentioning a doctor ("…, see a doctor") does not.
 */
const CAREFUL_SENTENCE =
  /\bonly a doctor\b|\bwithout (?:a |any )?(?:tests?|exam)|ডাক্তারই|বলা যায় না|বলা সম্ভব নয়|জানা যায় না/

function statesDiagnosis(text: string): boolean {
  const sentences = text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[ \t]+/g, ' ')
    .split(/(?<=[.!?।？])\s+|\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
  const phrases = [...FORBIDDEN.en, ...FORBIDDEN.bn].map((p) => p.toLowerCase())
  for (const sentence of sentences) {
    if (/[?？]$/.test(sentence)) continue
    if (DIAGNOSIS.some((d) => d.test(sentence))) return true
    for (const p of phrases) {
      let at = sentence.indexOf(p)
      while (at >= 0) {
        const after = sentence.slice(at + p.length)
        if (!CAREFUL_AFTER.test(after) && !CAREFUL_SENTENCE.test(sentence)) return true
        at = sentence.indexOf(p, at + 1)
      }
    }
  }
  return false
}

/** Advice or a guess at the illness: such a reply is an answer, whatever mark it starts with. */
const BN_ADVICE = ['খান', 'খাবেন', 'নিন', 'বিশ্রাম', 'পান করুন', 'সম্ভবত', 'হতে পারে', 'মনে হচ্ছে']
const ADVICE = new RegExp(
  String.raw`\btake (?:a |an |some |your |this |it |two |one |\d)|\bget (?:some )?rest\b|\brest (?:well|at home|for)\b|\bdrink (?:plenty|lots|more|water|fluids)|\bavoid\b|\bapply\b|\blikely\b|\bprobably\b|\bpossibly\b|\b(?:may|might|could) be\b|\bsounds like\b|\bseems like\b|(?<![ঀ-৿])(?:${BN_ADVICE.join('|')})(?![ঀ-৿])`,
  'i',
)

/** The parts of a reply that are not questions. */
function statements(text: string): string {
  const sentences = text.match(/[^.!?।？\n]+[.!?।？]*/g) ?? []
  return sentences.filter((x) => !/[?？]\s*$/.test(x)).join(' ')
}

/**
 * The model sometimes writes "How sure I am:" as a heading with its text on the next line. Joins them into
 * one line, so the check sees the confidence line and does not add a second one.
 */
function joinConfidenceHeading(text: string): string {
  const raw = text.split('\n')
  const prefixes = Object.values(CONFIDENCE_PREFIX)
  for (let i = 0; i < raw.length; i++) {
    const clean = raw[i].trim().replace(/^[*_#>\s]+/, '').replace(/[*_\s]+$/, '')
    const prefix = prefixes.find((p) => clean === p)
    if (!prefix) continue
    const j = raw.findIndex((l, k) => k > i && l.trim())
    if (j < 0) continue
    raw.splice(i, j - i + 1, `${prefix} ${raw[j].trim().replace(/^[*_\s]+/, '')}`)
  }
  return raw.join('\n')
}

/**
 * True when a reply only asks questions: it ends with one, is under 400 characters, and everything that is
 * not a question adds up to one short kind sentence (80 characters), so advice cannot hide in front.
 */
function onlyAsks(text: string): boolean {
  if (text.length > 400 || !/[?？]$/.test(text)) return false
  const sentences = text.match(/[^.!?।？]+[.!?।？]*/g) ?? []
  const statements = sentences.filter((x) => !/[?？]\s*$/.test(x)).join('').trim()
  return statements.length <= 80
}

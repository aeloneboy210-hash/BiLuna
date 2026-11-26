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
const SMALL_TALK_MAX = 300
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

  const lower = trimmed.toLowerCase()
  const phrases = [...FORBIDDEN.en, ...FORBIDDEN.bn]
  if (phrases.some((p) => lower.includes(p.toLowerCase()))) return { ok: false, reason: 'diagnosis' }

  const shortEnough =
    (marked === 'smallTalk' && trimmed.length <= SMALL_TALK_MAX) ||
    (marked === 'clarify' && trimmed.length <= CLARIFY_MAX && /[?？]/.test(trimmed))
  if (shortEnough) return { ok: true, text: trimmed, kind: marked }

  const lines = trimmed.split('\n').filter((l) => l.trim())
  const last = lines[lines.length - 1].trim().replace(/^[*_#>\s]+/, '')
  if (last.startsWith(CONFIDENCE_PREFIX.en) || last.startsWith(CONFIDENCE_PREFIX.bn)) {
    return { ok: true, text: trimmed, kind: 'answer' }
  }
  return { ok: true, text: `${trimmed}\n\n${DEFAULT_CONFIDENCE[lang]}`, kind: 'answer' }
}

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
  en: ['your diagnosis is', 'you are diagnosed', 'i diagnose', 'the cause is', 'this is definitely', 'you definitely have'],
  bn: ['আপনার রোগ নির্ণয়', 'নিশ্চিতভাবে আপনার', 'কারণ হলো', 'আপনার অবশ্যই'],
}

/**
 * The model starts a greeting or an off-topic reply with this mark. The filter removes it and skips the
 * confidence line, but only for short replies, so a health answer cannot use it to drop the line.
 */
export const SMALL_TALK_MARK = '[SMALL_TALK]'
const SMALL_TALK_MAX = 400

export type CheckResult = { ok: true; text: string } | { ok: false; reason: 'diagnosis' | 'empty' }

export function checkReply(text: string, lang: Lang): CheckResult {
  let trimmed = text.trim()
  const smallTalk = trimmed.startsWith(SMALL_TALK_MARK)
  trimmed = trimmed.split(SMALL_TALK_MARK).join('').trim()
  if (!trimmed) return { ok: false, reason: 'empty' }

  const lower = trimmed.toLowerCase()
  const phrases = [...FORBIDDEN.en, ...FORBIDDEN.bn]
  if (phrases.some((p) => lower.includes(p.toLowerCase()))) return { ok: false, reason: 'diagnosis' }

  if (smallTalk && trimmed.length <= SMALL_TALK_MAX) return { ok: true, text: trimmed }

  const lines = trimmed.split('\n').filter((l) => l.trim())
  const last = lines[lines.length - 1].trim().replace(/^[*_#>\s]+/, '')
  if (last.startsWith(CONFIDENCE_PREFIX.en) || last.startsWith(CONFIDENCE_PREFIX.bn)) {
    return { ok: true, text: trimmed }
  }
  return { ok: true, text: `${trimmed}\n\n${DEFAULT_CONFIDENCE[lang]}` }
}

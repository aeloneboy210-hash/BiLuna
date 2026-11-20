import type { Lang } from '@/lib/i18n/lang'

export const DAILY_MESSAGE_LIMIT = 40

export type TodayStats = {
  /** BiLuna replies shown today. */
  answered: number
  /** Replies that went through the safety filter (shown or blocked). */
  checked: number
  /** Replies the filter caught: rewritten once, or refused. */
  caught: number
  followUps: number
  profileUses: number
  bangla: number
  english: number
  /** Messages left of today's limit. */
  left: number
}

export function summarizeToday(events: { kind: string; lang: Lang | null }[], sentToday: number): TodayStats {
  const count = (kind: string, lang?: Lang) => events.filter((e) => e.kind === kind && (!lang || e.lang === lang)).length
  const answered = count('reply')
  const blocked = count('blocked')
  return {
    answered,
    checked: answered + blocked,
    caught: count('retry') + blocked,
    followUps: count('clarify'),
    profileUses: count('profile_used'),
    bangla: count('reply', 'bn'),
    english: count('reply', 'en'),
    left: Math.max(0, DAILY_MESSAGE_LIMIT - sentToday),
  }
}

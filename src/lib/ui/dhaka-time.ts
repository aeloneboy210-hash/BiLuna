import type { Lang } from '@/lib/i18n/lang'

/** A date and time in Bangladesh time, one style everywhere: "26 Nov, 2:05 pm" / "২৬ নভে, ২:০৫ PM". */
export function formatDhaka(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

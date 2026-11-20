import type { Metadata } from 'next'
import { ProfileForm } from '@/components/intelligence/ProfileForm'
import { Icon } from '@/components/ui/Icon'
import { requirePortal } from '@/lib/auth/require-portal'
import { getDict } from '@/lib/i18n/server'
import { CAPABILITY_GROUPS, type CapabilityStatus } from '@/lib/intelligence/capabilities'
import { summarizeToday } from '@/lib/intelligence/stats'
import { getProfile, messagesSentToday, recentEvents, todaysEvents } from '@/lib/intelligence/store'
import type { IconName } from '@/lib/ui/icons'

export const metadata: Metadata = { title: 'BiLuna Intelligence' }

const STATUS_STYLE: Record<CapabilityStatus, string> = {
  working: 'bg-ok/10 text-ok border-ok/30',
  demo: 'bg-tint text-brand border-tint',
  roadmap: 'bg-ground text-muted border-line',
}

const FLOW_ICONS: IconName[] = ['chat', 'user', 'brain', 'shield', 'heart']

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="glass flex flex-col gap-4 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">{title}</h2>
        {intro ? <p className="text-sm text-body">{intro}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default async function IntelligencePage() {
  await requirePortal('patient')
  const { dict, lang } = await getDict()
  const t = dict.intelligence

  const [profile, events, sent, recent] = await Promise.all([getProfile(), todaysEvents(), messagesSentToday(), recentEvents(15)])
  const s = summarizeToday(events, sent)
  const fmt = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const num = (n: number) => n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')

  const stats: [string, string][] = [
    [t.stats.answered, num(s.answered)],
    [t.stats.checked, num(s.checked)],
    [t.stats.caught, num(s.caught)],
    [t.stats.followUps, num(s.followUps)],
    [t.stats.languages, `${num(s.bangla)} / ${num(s.english)}`],
    [t.stats.left, num(s.left)],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="max-w-3xl text-body">{t.intro}</p>
      </div>

      <Section title={t.flowTitle}>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {t.flow.map((step, i) => (
            <li key={step.title} className="relative flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tint text-brand">
                  <Icon name={FLOW_ICONS[i]} className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-muted">{num(i + 1)}</span>
              </div>
              <span className="font-semibold text-ink">{step.title}</span>
              <span className="text-sm text-body">{step.body}</span>
              {i < t.flow.length - 1 ? (
                <span aria-hidden="true" className="absolute top-1/2 -right-2.5 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-on-brand lg:flex">
                  <Icon name="arrowRight" className="h-3 w-3" />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t.todayTitle}>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 rounded-2xl bg-soft p-4">
              <dt className="text-sm text-body">{label}</dt>
              <dd className="font-display text-3xl font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Section title={t.memoryTitle} intro={t.memoryIntro}>
          <ProfileForm profile={profile} t={t} />
        </Section>

        <Section title={t.activityTitle} intro={t.activityIntro}>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">{t.noActivity}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {recent.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="text-ink">{t.events[e.kind]}</span>
                  <time className="shrink-0 text-xs text-muted" dateTime={e.createdAt}>
                    {fmt.format(new Date(e.createdAt))}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>

      <Section title={t.mapTitle} intro={t.mapIntro}>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(['working', 'demo', 'roadmap'] as const).map((st) => (
            <span key={st} className={`rounded-full border px-3 py-1 ${STATUS_STYLE[st]}`}>
              {t.status[st]} · {num(CAPABILITY_GROUPS.flatMap((g) => g.items).filter((c) => c.status === st).length)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {CAPABILITY_GROUPS.map((g) => (
            <div key={g.id} className="flex flex-col gap-2 rounded-2xl border border-line p-4">
              <h3 className="font-bold text-ink">{g.name[lang]}</h3>
              <ul className="flex flex-col divide-y divide-line">
                {g.items.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold text-ink">{c.name[lang]}</span>
                      <span className="text-xs text-muted">{c.where[lang]}</span>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[c.status]}`}>
                      {t.status[c.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.rulesTitle}>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {t.rules.map((r) => (
            <li key={r} className="flex items-start gap-3 rounded-2xl bg-soft p-4 text-sm text-ink">
              <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              {r}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

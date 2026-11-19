import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { SampleTag } from '@/components/ui/SampleTag'
import { requirePortal } from '@/lib/auth/require-portal'
import { BUILD_UPDATES, SAMPLE_PATIENT_PROFILE, profileCompleteness } from '@/lib/demo/sample'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { getDict } from '@/lib/i18n/server'
import { MODULES, moduleHref, type ModuleId } from '@/lib/modules'
import type { IconName } from '@/lib/ui/icons'

export const metadata: Metadata = { title: 'Patient Portal' }

const hrefOf = (id: ModuleId) => moduleHref(MODULES.find((m) => m.id === id)!)

/** A card with an icon title row and an optional "View all" link, as in the dashboard design. */
function Panel({
  icon,
  title,
  action,
  className = '',
  children,
}: {
  icon: IconName
  title: string
  action?: { href: string; label: string }
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={`flex flex-col gap-4 p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold">
          <Icon name={icon} className="h-6 w-6 text-cyan" />
          {title}
        </h2>
        {action ? (
          <Link href={action.href} className="inline-flex items-center gap-1 text-sm font-semibold text-cyan hover:text-aqua">
            {action.label}
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </Card>
  )
}

/** The progress ring from the design, showing how much of the profile is filled in. */
function Ring({ percent, label }: { percent: number; label: string }) {
  const r = 52
  const length = 2 * Math.PI * r
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#dbeafc" strokeWidth="11" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#2580eb"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - percent / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl font-bold">{percent}%</span>
        <span className="max-w-20 text-[0.7rem] leading-tight text-body">{label}</span>
      </div>
    </div>
  )
}

/** The heartbeat line drawn across the hero, like the one in the design. */
function Heartbeat() {
  return (
    <svg viewBox="0 0 240 60" className="h-12 w-full max-w-60" aria-hidden="true">
      <path
        d="M0 32h70l10-14 12 34 14-48 12 40 8-12h114"
        fill="none"
        stroke="#2580eb"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function quickLinks(dict: Dictionary): { href: string; icon: IconName; label: string }[] {
  return [
    { href: hrefOf('health'), icon: 'heart', label: dict.patient.quick.healthInfo },
    { href: hrefOf('navigator'), icon: 'stethoscope', label: dict.patient.quick.findDoctor },
    { href: hrefOf('medicine'), icon: 'pill', label: dict.patient.quick.medicineInfo },
    { href: hrefOf('wellness'), icon: 'book', label: dict.patient.quick.healthTips },
  ]
}

export default async function PatientPortal() {
  const session = await requirePortal('patient')
  const { dict, lang } = await getDict()
  const t = dict.patient

  const firstName = session.displayName.split(' ')[0]
  const profile: [IconName, string, string | null][] = [
    ['calendar', t.age, String(SAMPLE_PATIENT_PROFILE.age)],
    ['mapPin', t.area, dict.sample.areaValue],
    ['droplet', t.bloodGroup, SAMPLE_PATIENT_PROFILE.bloodGroup],
    ['alert', t.allergies, dict.sample.none],
    ['activity', t.conditions, SAMPLE_PATIENT_PROFILE.conditionsAdded ? dict.sample.none : null],
  ]
  const completeness = profileCompleteness(Object.fromEntries(profile.map(([, label, value]) => [label, value])))
  const dateFormat = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      {/* Welcome banner with the heartbeat line and BiLuna Bot, as in the design. */}
      <section className="motion-safe:animate-rise relative overflow-hidden rounded-3xl border border-tint bg-soft">
        <div className="relative z-10 flex flex-col gap-5 px-6 py-8 sm:px-10 sm:py-10 md:max-w-[62%]">
          <h1 className="text-3xl leading-tight font-bold sm:text-5xl">
            {t.welcomeBack}
            <br />
            <span className="text-gradient">{firstName}!</span>
          </h1>
          <p className="text-lg text-body">{t.heroLine}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href={hrefOf('health')} className={buttonClass('primary')}>
              {t.explore}
              <Icon name="arrowRight" className="h-5 w-5" />
            </Link>
            <div className="hidden items-center gap-3 xl:flex">
              <Heartbeat />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] items-center justify-center md:flex">
          {/* The BiLuna logo on a white disc, with BiLuna's greeting beside it. */}
          <div className="relative flex aspect-square h-[82%] max-h-64 items-center justify-center rounded-full border border-tint bg-surface">
            <Image
              src="/brand/logo-v4.webp"
              alt=""
              width={512}
              height={482}
              fetchPriority="high"
              className="h-[72%] w-auto"
            />
          </div>
          <div className="glass absolute top-6 right-[78%] z-10 hidden w-56 rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-snug 2xl:block">
            <span className="font-semibold">{t.botHello}</span> {t.botAsk}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {/* What BiLuna knows about this (fictional) patient: no invented vital signs. */}
        <Panel icon="heart" title={t.snapshotTitle}>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <Ring percent={completeness.percent} label={t.profileComplete} />
            <dl className="flex w-full min-w-0 flex-col">
              {profile.map(([icon, label, value]) => (
                <div key={label} className="flex items-center gap-2.5 py-1.5 text-sm">
                  <Icon name={icon} className="h-4.5 w-4.5 shrink-0 text-cyan" />
                  <dt className="text-body">{label}</dt>
                  <dd className={`ml-auto text-right font-semibold ${value ? '' : 'text-warn'}`}>{value ?? t.notAdded}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">{t.profileNote}</span>
            <SampleTag label={dict.common.sampleData} />
          </div>
        </Panel>

        <Panel icon="bolt" title={t.quickTitle}>
          <ul className="grid grid-cols-2 gap-3">
            {quickLinks(dict).map((q) => (
              <li key={q.label}>
                <Link
                  href={q.href}
                  className="glow-edge flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-soft p-3 text-center text-sm font-semibold"
                >
                  <Icon name={q.icon} className="h-8 w-8 text-cyan" />
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        {/* The chat card: typing here opens the Health chat with the question already sent. */}
        <Card className="flex flex-col gap-4 p-5 lg:col-span-2 2xl:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="h-12 w-auto" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">{t.botName}</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ok">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok" />
                {t.botStatus}
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2.5">
            <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="h-8 w-auto" />
            <p className="rounded-2xl rounded-bl-sm bg-soft px-4 py-3 text-sm leading-relaxed">
              {t.welcomeBack.replace(/,$/, '')} {firstName}! {t.botAsk}
            </p>
          </div>
          {/* A plain GET form: the Health page reads ?q= and sends it as the first question. */}
          <form action={hrefOf('health')} method="get" className="mt-auto flex flex-col gap-2" aria-describedby="bot-soon">
            <div className="flex overflow-hidden rounded-xl border border-field bg-surface">
              <label htmlFor="ask" className="sr-only">
                {t.askPlaceholder}
              </label>
              <input
                id="ask"
                name="q"
                required
                maxLength={2000}
                autoComplete="off"
                placeholder={t.askPlaceholder}
                className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-sm placeholder:text-muted"
              />
              <button
                type="submit"
                aria-label={t.send}
                className="flex w-14 items-center justify-center bg-brand text-on-brand hover:bg-aqua"
              >
                <Icon name="send" className="h-5 w-5" />
              </button>
            </div>
            <p id="bot-soon" className="text-xs text-muted">
              {t.botSoon}
            </p>
          </form>
        </Card>

        <Panel icon="leaf" title={t.tipsTitle} action={{ href: hrefOf('wellness'), label: t.viewAll }}>
          <div className="flex items-center gap-4">
            <Image
              src="/brand/tip-water-v1.webp"
              alt=""
              width={254}
              height={182}
              className="h-24 w-32 shrink-0 rounded-xl object-cover"
            />
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-lg font-semibold">{t.tipTitle}</h3>
              <p className="text-sm leading-relaxed text-body">{t.tipBody}</p>
            </div>
          </div>
        </Panel>

        <Panel icon="megaphone" title={t.updatesTitle} action={{ href: '/roadmap', label: t.viewAll }}>
          <ul className="flex flex-col gap-3">
            {BUILD_UPDATES.map((u, i) => (
              <li key={u.key} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className={`h-3 w-3 shrink-0 rounded-full ${i === 0 ? 'bg-cyan' : 'bg-tint'}`}
                />
                <span className="min-w-0 flex-1 font-semibold">{t.updates[u.key]}</span>
                <span className="shrink-0 text-muted">{dateFormat.format(new Date(u.date))}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <section className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-ink p-6 sm:flex-row sm:items-center 2xl:flex-col 2xl:items-stretch text-on-brand lg:col-span-2 2xl:col-span-1">
          <div className="flex items-center gap-4">
            <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="h-14 w-auto rounded-xl bg-surface p-1.5" />
            <h2 className="text-xl leading-snug font-bold">
              {t.ctaTitleA}
              <br />
              <span className="text-tint">{t.ctaTitleB}</span>
            </h2>
          </div>
          <Link href="/roadmap" className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-full bg-surface px-6 text-base font-semibold text-ink transition-all hover:bg-tint">
            {t.ctaButton}
            <Icon name="arrowRight" className="h-5 w-5" />
          </Link>
        </section>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-danger/35 bg-danger/10 px-4 py-3.5">
        <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        <p className="text-sm leading-relaxed text-body">{dict.common.emergency}</p>
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ConsentForm } from '@/components/account/AccountForms'
import { Card } from '@/components/ui/Card'
import { requireSignedIn } from '@/lib/auth/require-portal'
import { signOut } from '@/lib/auth/sign-out'
import { getDict } from '@/lib/i18n/server'
import { PORTALS } from '@/lib/portals'

export const metadata: Metadata = { title: 'Welcome' }

/** First sign-in only: the few things to know, and agreement to the terms and privacy policy. */
export default async function WelcomePage() {
  const session = await requireSignedIn()
  if (session.consented) redirect(PORTALS[session.role].home)
  const { dict } = await getDict()
  const t = dict.consent
  // One picture per point, in the order of dict.consent.points.
  const icons = ['🤖', '🚑', '🔒', '✨']
  return (
    <Card className="mx-auto flex w-full max-w-xl flex-col gap-5 p-6 sm:p-8">
      <div className="flex animate-rise flex-col gap-1.5">
        <span aria-hidden="true" className="text-4xl">
          👋
        </span>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-body">{t.intro}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {t.points.map((point, i) => {
          const urgent = i === 1
          return (
            <li
              key={i}
              // The points arrive one after another; phones set to reduce motion show them at once.
              style={{ animationDelay: `${150 + i * 140}ms` }}
              className={`flex animate-rise items-start gap-3 rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed text-ink transition-transform hover:-translate-y-0.5 ${
                urgent ? 'border border-danger/40 bg-danger/10 font-semibold' : 'bg-soft'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${
                  urgent ? 'animate-beacon bg-danger/15' : 'bg-surface'
                }`}
              >
                {icons[i] ?? '•'}
              </span>
              <span className="pt-1.5">{point}</span>
            </li>
          )
        })}
      </ul>
      <div className="flex animate-rise flex-col gap-5" style={{ animationDelay: `${150 + t.points.length * 140}ms` }}>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/terms" target="_blank" className="font-semibold text-brand underline underline-offset-4">
            {t.readTerms}
          </Link>
          <Link href="/privacy" target="_blank" className="font-semibold text-brand underline underline-offset-4">
            {t.readPrivacy}
          </Link>
        </p>
        <ConsentForm t={t} />
        <form action={signOut} className="border-t border-line pt-4">
          <button type="submit" className="min-h-11 text-sm font-semibold text-muted hover:text-ink">
            {t.notNow}
          </button>
        </form>
      </div>
    </Card>
  )
}

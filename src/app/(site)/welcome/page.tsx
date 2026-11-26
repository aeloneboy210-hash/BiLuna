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
  return (
    <Card className="mx-auto flex w-full max-w-xl flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-body">{t.intro}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {t.points.map((point, i) => (
          <li key={i} className={`rounded-xl px-4 py-3 text-[0.95rem] leading-relaxed text-ink ${i === 1 ? 'border border-danger/40 bg-danger/10 font-semibold' : 'bg-soft'}`}>
            {point}
          </li>
        ))}
      </ul>
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
    </Card>
  )
}

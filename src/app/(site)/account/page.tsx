import type { Metadata } from 'next'
import { AccountForm, DeleteForm } from '@/components/account/AccountForms'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { requireSignedIn } from '@/lib/auth/require-portal'
import { getDict } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Your account' }

/** Name, language, download everything, delete everything. Demo accounts can only look. */
export default async function AccountPage() {
  const session = await requireSignedIn()
  const { lang, dict } = await getDict()
  const t = dict.account
  const supabase = await createClient()
  const email = supabase ? (await supabase.auth.getUser()).data.user?.email ?? '' : ''

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      {session.isDemo ? (
        <p role="note" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
          {t.demoNote}
        </p>
      ) : null}
      <Card className="flex flex-col gap-4 p-6">
        <p className="text-sm text-body">
          <span className="font-semibold text-ink">{t.email}:</span> {email}
        </p>
        {session.isDemo ? (
          <p className="text-sm text-body">
            <span className="font-semibold text-ink">{t.name}:</span> {session.displayName}
          </p>
        ) : (
          <AccountForm t={t} name={session.displayName} lang={session.lang ?? lang} />
        )}
      </Card>
      {session.isDemo ? null : (
        <>
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="text-xl font-bold">{t.downloadTitle}</h2>
            <p className="text-sm text-body">{t.downloadText}</p>
            {/* A plain link: the browser saves the file. */}
            <a href="/account/download" download className={buttonClass('secondary', 'self-start')}>
              ⬇️ {t.download}
            </a>
          </Card>
          <Card className="flex flex-col gap-3 border-danger/30 p-6">
            <h2 className="text-xl font-bold text-danger">{t.deleteTitle}</h2>
            <p className="text-sm text-body">{t.deleteText}</p>
            <DeleteForm t={t} />
          </Card>
        </>
      )}
    </div>
  )
}

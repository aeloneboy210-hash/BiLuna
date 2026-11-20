import type { Metadata } from 'next'
import { DemoAccountList } from '@/components/DemoAccountList'
import { TryDemoButtons } from '@/components/TryDemo'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { dict } = await getDict()
  const { demo } = await searchParams
  const notice = demo === 'notReady' ? dict.signIn.tryNotReady : demo === 'failed' ? dict.signIn.tryFailed : null

  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold">{dict.signIn.title}</h1>
        <p className="text-sm text-body">{dict.signIn.intro}</p>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">{dict.signIn.tryTitle}</h2>
        {notice ? (
          <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
            {notice}
          </p>
        ) : null}
        <TryDemoButtons dict={dict} />
      </div>
      <h2 className="border-t border-line pt-4 text-sm font-semibold text-muted">{dict.signIn.orSignIn}</h2>
      <SignInForm
        labels={{
          email: dict.signIn.email,
          password: dict.signIn.password,
          submit: dict.signIn.submit,
          submitting: dict.signIn.submitting,
        }}
      />
      <DemoAccountList dict={dict} title={dict.signIn.accounts} />
      <p className="border-t border-line pt-4 text-xs text-muted">{dict.signIn.noSignUp}</p>
    </Card>
  )
}

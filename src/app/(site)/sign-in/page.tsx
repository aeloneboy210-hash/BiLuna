import type { Metadata } from 'next'
import Link from 'next/link'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

const link = 'font-semibold text-brand underline-offset-4 hover:underline'

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { dict } = await getDict()
  const { demo, auth } = await searchParams
  const notice =
    demo === 'notReady'
      ? dict.signIn.tryNotReady
      : demo === 'failed'
        ? dict.signIn.tryFailed
        : auth === 'google'
          ? dict.auth.googleFailed
          : auth === 'link'
            ? dict.auth.linkFailed
            : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold">{dict.signIn.title}</h1>
          <p className="text-sm text-body">{dict.signIn.intro}</p>
        </div>
        {notice ? (
          <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
            {notice}
          </p>
        ) : null}
        <GoogleButton label={dict.auth.google} />
        <p className="flex items-center gap-3 text-xs font-semibold text-muted uppercase">
          <span className="h-px flex-1 bg-line" />
          {dict.auth.or}
          <span className="h-px flex-1 bg-line" />
        </p>
        <h2 className="sr-only">{dict.signIn.orSignIn}</h2>
        <SignInForm
          labels={{
            email: dict.signIn.email,
            password: dict.signIn.password,
            submit: dict.signIn.submit,
            submitting: dict.signIn.submitting,
          }}
        />
        <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <Link href="/forgot-password" className={link}>
            {dict.auth.forgotLink}
          </Link>
          <p className="text-body">
            {dict.auth.newHere}{' '}
            <Link href="/sign-up" className={link}>
              {dict.auth.createLink}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

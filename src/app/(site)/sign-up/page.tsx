import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from '@/components/auth/AuthForms'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Create an account' }

export default async function SignUpPage() {
  const { dict } = await getDict()
  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold">{dict.auth.signUpTitle}</h1>
        <p className="text-sm text-body">{dict.auth.signUpIntro}</p>
      </div>
      <GoogleButton label={dict.auth.google} />
      <p className="flex items-center gap-3 text-xs font-semibold text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        {dict.auth.or}
        <span className="h-px flex-1 bg-line" />
      </p>
      <SignUpForm t={dict.auth} emailLabel={dict.signIn.email} passwordLabel={dict.signIn.password} />
      <p className="border-t border-line pt-4 text-sm text-body">
        {dict.auth.haveAccount}{' '}
        <Link href="/sign-in" className="font-semibold text-brand underline-offset-4 hover:underline">
          {dict.auth.signInLink}
        </Link>
      </p>
    </Card>
  )
}

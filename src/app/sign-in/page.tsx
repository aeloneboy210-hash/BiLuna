import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage() {
  const { dict } = await getDict()

  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold">{dict.signIn.title}</h1>
        <p className="text-sm text-body">{dict.signIn.intro}</p>
      </div>
      <SignInForm
        labels={{
          email: dict.signIn.email,
          password: dict.signIn.password,
          submit: dict.signIn.submit,
          submitting: dict.signIn.submitting,
        }}
      />
      <p className="border-t border-line pt-4 text-xs text-muted">{dict.signIn.noSignUp}</p>
    </Card>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotForm } from '@/components/auth/AuthForms'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Reset your password' }

export default async function ForgotPasswordPage() {
  const { dict } = await getDict()
  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold">{dict.auth.forgotTitle}</h1>
        <p className="text-sm text-body">{dict.auth.forgotIntro}</p>
      </div>
      <ForgotForm t={dict.auth} emailLabel={dict.signIn.email} />
      <Link href="/sign-in" className="border-t border-line pt-4 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        ← {dict.auth.signInLink}
      </Link>
    </Card>
  )
}

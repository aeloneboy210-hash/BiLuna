import type { Metadata } from 'next'
import { NewPasswordForm } from '@/components/auth/AuthForms'
import { Card } from '@/components/ui/Card'
import { requireSignedIn } from '@/lib/auth/require-portal'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Choose a new password' }

/** Reached from the reset link in the email, which has already signed the person in. */
export default async function ResetPasswordPage() {
  await requireSignedIn()
  const { dict } = await getDict()
  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-5 p-6 sm:p-8">
      <h1 className="text-3xl font-bold">{dict.auth.resetTitle}</h1>
      <NewPasswordForm t={dict.auth} />
    </Card>
  )
}

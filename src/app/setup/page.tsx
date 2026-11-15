import type { Metadata } from 'next'
import { DemoAccountList } from '@/components/DemoAccountList'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { SetupForm } from './SetupForm'

export const metadata: Metadata = { title: 'Set up the demo accounts', robots: { index: false } }

/** True only when the database says the demo accounts still have no password. */
async function isSetupNeeded(): Promise<boolean> {
  const supabase = await createClient()
  if (!supabase) return false
  const { data, error } = await supabase.rpc('demo_setup_needed')
  return !error && data === true
}

export default async function SetupPage() {
  const [{ dict }, needed] = await Promise.all([getDict(), isSetupNeeded()])

  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-5 p-6 sm:p-8">
      {needed ? (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold sm:text-3xl">{dict.setup.title}</h1>
            <p className="text-sm leading-relaxed text-body">{dict.setup.intro}</p>
          </div>
          <DemoAccountList dict={dict} title={dict.setup.accounts} />
          <SetupForm
            labels={{
              password: dict.setup.password,
              confirm: dict.setup.confirm,
              hint: dict.setup.hint,
              submit: dict.setup.submit,
              submitting: dict.setup.submitting,
              doneTitle: dict.setup.doneTitle,
              doneBody: dict.setup.doneBody,
              goSignIn: dict.setup.goSignIn,
            }}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold sm:text-3xl">{dict.setup.doneTitle}</h1>
            <p className="text-sm leading-relaxed text-body">{dict.setup.doneBody}</p>
          </div>
          <DemoAccountList dict={dict} title={dict.setup.accounts} />
          <ButtonLink href="/sign-in" className="self-start">
            {dict.setup.goSignIn}
          </ButtonLink>
        </>
      )}
    </Card>
  )
}

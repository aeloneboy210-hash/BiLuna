'use client'

import { useActionState } from 'react'
import {
  requestPasswordReset,
  setNewPassword,
  signUp,
  type NewPasswordState,
  type ResetState,
  type SignUpState,
} from '@/app/(site)/sign-in/actions'
import { Button } from '@/components/ui/Button'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type T = Dictionary['auth']

const field = 'min-h-12 w-full rounded-xl border border-field bg-ground px-3.5 text-base text-ink placeholder:text-muted'

function Field({ id, label, hint, ...input }: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input id={id} name={id} className={field} aria-describedby={hint ? `${id}-hint` : undefined} {...input} />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function Error({ text }: { text: string | null }) {
  return (
    <p role="alert" aria-live="polite" className="min-h-5 text-sm font-semibold text-danger">
      {text}
    </p>
  )
}

function Sent({ t, email }: { t: T; email: string }) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-soft px-4 py-4">
      <p className="font-display text-lg font-bold text-ink">📧 {t.checkTitle}</p>
      <p className="text-sm text-body">{t.checkText.replace('{email}', email)}</p>
    </div>
  )
}

export function SignUpForm({ t, emailLabel, passwordLabel }: { t: T; emailLabel: string; passwordLabel: string }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, { error: null, sentTo: null })
  if (state.sentTo) return <Sent t={t} email={state.sentTo} />
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="name" label={t.name} autoComplete="name" required maxLength={80} />
      <Field id="email" label={emailLabel} type="email" autoComplete="email" required />
      <Field id="password" label={passwordLabel} hint={t.passwordHint} type="password" autoComplete="new-password" required minLength={8} />
      <Error text={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? t.creating : t.create}
      </Button>
    </form>
  )
}

export function ForgotForm({ t, emailLabel }: { t: T; emailLabel: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, { error: null, sentTo: null })
  if (state.sentTo) return <Sent t={t} email={state.sentTo} />
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="email" label={emailLabel} type="email" autoComplete="email" required />
      <Error text={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? t.sending : t.sendLink}
      </Button>
    </form>
  )
}

export function NewPasswordForm({ t }: { t: T }) {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, { error: null })
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="password" label={t.newPassword} hint={t.passwordHint} type="password" autoComplete="new-password" required minLength={8} />
      <Error text={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? t.saving : t.savePassword}
      </Button>
    </form>
  )
}

'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button, buttonClass } from '@/components/ui/Button'
import { setDemoPassword, type SetupState } from './actions'

type Labels = {
  password: string
  confirm: string
  hint: string
  submit: string
  submitting: string
  doneTitle: string
  doneBody: string
  goSignIn: string
}

const field =
  'min-h-12 w-full rounded-xl border border-field bg-ground px-3.5 text-base text-ink placeholder:text-muted'

const initial: SetupState = { error: null, done: false }

export function SetupForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(setDemoPassword, initial)

  if (state.done) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-cyan">{labels.doneTitle}</h2>
        <p className="text-sm leading-relaxed text-body">{labels.doneBody}</p>
        <Link href="/sign-in" className={buttonClass('primary', 'self-start')}>
          {labels.goSignIn}
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          aria-describedby="password-hint"
          className={field}
        />
        <p id="password-hint" className="text-xs text-muted">
          {labels.hint}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-sm font-semibold">
          {labels.confirm}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          className={field}
        />
      </div>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm font-semibold text-danger">
        {state.error}
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
    </form>
  )
}

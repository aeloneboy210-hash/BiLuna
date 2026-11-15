'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { signIn, type SignInState } from './actions'

type Labels = { email: string; password: string; submit: string; submitting: string }

const field =
  'min-h-12 w-full rounded-xl border border-field bg-ground px-3.5 text-base text-ink placeholder:text-muted'

const initial: SignInState = { error: null }

export function SignInForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(signIn, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">
          {labels.email}
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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

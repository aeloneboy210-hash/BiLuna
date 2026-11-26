'use client'

import { useActionState, useState } from 'react'
import {
  deleteAccount,
  giveConsent,
  saveAccount,
  type AccountState,
  type ConsentState,
  type DeleteState,
} from '@/lib/account/actions'
import { Button } from '@/components/ui/Button'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

const field = 'min-h-12 w-full rounded-xl border border-field bg-ground px-3.5 text-base text-ink'
const check = 'mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-brand)]'

function Message({ text, ok = false }: { text: string | null; ok?: boolean }) {
  return (
    <p role={ok ? 'status' : 'alert'} aria-live="polite" className={`min-h-5 text-sm font-semibold ${ok ? 'text-brand' : 'text-danger'}`}>
      {text}
    </p>
  )
}

export function ConsentForm({ t }: { t: Dictionary['consent'] }) {
  const [state, action, pending] = useActionState<ConsentState, FormData>(giveConsent, { error: null })
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex min-h-11 items-start gap-3 text-[0.95rem] text-ink">
        <input type="checkbox" name="agree" value="yes" required className={check} />
        <span>{t.agree}</span>
      </label>
      <label className="flex min-h-11 items-start gap-3 text-[0.95rem] text-ink">
        <input type="checkbox" name="age" value="yes" required className={check} />
        <span>{t.age}</span>
      </label>
      <Message text={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? t.starting : t.start}
      </Button>
    </form>
  )
}

export function AccountForm({ t, name, lang }: { t: Dictionary['account']; name: string; lang: Lang }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(saveAccount, { error: null, saved: false })
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold">
          {t.name}
        </label>
        <input id="name" name="name" defaultValue={name} required maxLength={80} autoComplete="name" className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="lang" className="text-sm font-semibold">
          {t.language}
        </label>
        <select id="lang" name="lang" defaultValue={lang} className={field}>
          <option value="en">English</option>
          <option value="bn" lang="bn">
            বাংলা
          </option>
        </select>
      </div>
      <Message text={state.error ?? (state.saved ? t.saved : null)} ok={state.saved && !state.error} />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? t.saving : t.save}
      </Button>
    </form>
  )
}

export function DeleteForm({ t }: { t: Dictionary['account'] }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, { error: null })
  const [typed, setTyped] = useState('')
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="confirm" className="text-sm font-semibold">
        {t.deleteConfirm}
      </label>
      <input
        id="confirm"
        name="confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        className={field}
      />
      <Message text={state.error} />
      <button
        type="submit"
        disabled={pending || typed.trim() !== 'DELETE'}
        className="inline-flex min-h-12 items-center justify-center self-start rounded-full bg-danger px-6 text-base font-semibold text-surface hover:opacity-90 disabled:opacity-50"
      >
        {pending ? t.deleting : t.delete}
      </button>
    </form>
  )
}

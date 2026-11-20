'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  deleteProfileAction,
  saveProfileAction,
  setConsentAction,
  type ProfileState,
} from '@/app/(portal)/patient/intelligence/actions'
import type { HealthProfile } from '@/lib/health/profile-prompt'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { BLOOD_GROUPS } from '@/lib/intelligence/profile-form'

const inputClass =
  'min-h-11 w-full rounded-xl border border-field bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-muted'

/** The patient's health profile with the consent switch: review, correct, delete, and decide if BiLuna may use it. */
export function ProfileForm({ profile, t }: { profile: HealthProfile | null; t: Dictionary['intelligence'] }) {
  const [state, formAction, saving] = useActionState<ProfileState, FormData>(saveProfileAction, { status: 'idle' })
  const [deleteState, setDeleteState] = useState<ProfileState>({ status: 'idle' })
  const [consent, setConsent] = useState(profile?.useInChat ?? false)
  const [pending, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)

  function toggleConsent() {
    const next = !consent
    setConsent(next)
    startTransition(async () => {
      if (!(await setConsentAction(next))) setConsent(!next)
    })
  }

  function onDelete() {
    if (!window.confirm(t.confirmDelete)) return
    startTransition(async () => {
      const result = await deleteProfileAction()
      setDeleteState(result)
      if (result.status === 'deleted') {
        setConsent(false)
        setFormKey((k) => k + 1)
      }
    })
  }

  const shown = deleteState.status === 'deleted' ? null : profile
  const message =
    deleteState.status === 'deleted'
      ? t.deleted
      : state.status === 'saved'
        ? t.saved
        : state.status === 'failed' || deleteState.status === 'failed'
          ? t.saveFailed
          : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-tint bg-soft p-4">
        <div className="flex flex-col gap-1">
          <span id="consent-label" className="font-semibold text-ink">
            {t.consentTitle}
          </span>
          <span className="text-sm text-body">{consent ? t.consentOn : t.consentOff}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={consent}
          aria-labelledby="consent-label"
          onClick={toggleConsent}
          disabled={pending}
          className={`relative mt-1 h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${consent ? 'bg-brand' : 'bg-field'}`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-surface shadow transition-transform ${consent ? 'translate-x-6' : ''}`}
          />
        </button>
      </div>

      <form
        key={formKey}
        action={formAction}
        onSubmit={() => setDeleteState({ status: 'idle' })}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          {t.fields.age}
          <input name="age" type="number" min={0} max={120} inputMode="numeric" defaultValue={shown?.age ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          {t.fields.bloodGroup}
          <select name="bloodGroup" defaultValue={shown?.bloodGroup ?? ''} className={inputClass}>
            <option value="">{t.chooseBlood}</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        {(['allergies', 'conditions', 'medicines'] as const).map((f) => (
          <label key={f} className="flex flex-col gap-1.5 text-sm font-semibold text-ink sm:col-span-2">
            {t.fields[f]}
            <input name={f} maxLength={200} defaultValue={shown?.[f] ?? ''} autoComplete="off" className={inputClass} />
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-on-brand hover:bg-aqua disabled:opacity-60"
          >
            {t.save}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-full border border-danger/40 px-5 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            {t.deleteProfile}
          </button>
          {message ? (
            <span role="status" className="text-sm font-semibold text-ink">
              {message}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

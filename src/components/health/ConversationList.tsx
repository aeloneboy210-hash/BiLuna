'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteChats } from '@/app/(portal)/patient/health/actions'
import { Icon } from '@/components/ui/Icon'
import type { ConversationSummary } from '@/lib/health/chat-store'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Past chats, newest first, with a button for a new chat. Above the chat on a phone, beside it on a laptop.
 * Each chat has a delete button, and "Delete all chats" sits at the bottom; both ask once before deleting.
 */
export function ConversationList({
  conversations,
  activeId,
  t,
}: {
  conversations: ConversationSummary[]
  activeId: string | null
  t: Dictionary['health']
}) {
  const router = useRouter()
  // Which delete is waiting for "Delete / Cancel": a chat id, 'all', or none.
  const [confirm, setConfirm] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  // Chats deleted on this screen disappear at once, before the page's own list catches up.
  const [gone, setGone] = useState<string[]>([])
  const shown = gone.includes('all') ? [] : conversations.filter((c) => !gone.includes(c.id))

  async function remove(target: string) {
    setBusy(true)
    setFailed(false)
    const ok = await deleteChats({ conversationId: target })
    setBusy(false)
    setConfirm(null)
    if (!ok) return setFailed(true)
    setGone((g) => [...g, target])
    // The open chat was deleted: start a fresh one.
    if (target === 'all' || target === activeId) router.push('/patient/health')
    router.refresh()
  }

  const confirmRow = (target: string, question: string) => (
    <div role="alertdialog" aria-label={question} className="flex flex-col gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3">
      <p className="text-sm font-semibold text-ink">{question}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => remove(target)}
          className="min-h-9 rounded-full bg-danger px-4 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
        >
          {t.del.yes}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirm(null)}
          className="min-h-9 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-body hover:bg-soft"
        >
          {t.del.no}
        </button>
      </div>
    </div>
  )

  return (
    <aside className="glass flex flex-col gap-3 rounded-2xl p-4 lg:max-h-[calc(100vh-16rem)]">
      <Link
        href="/patient/health"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-aqua"
      >
        <Icon name="chat" className="h-5 w-5" />
        {t.newChat}
      </Link>
      <h2 className="px-1 pt-1 text-sm font-semibold text-muted">{t.pastChats}</h2>
      {shown.length === 0 ? (
        <p className="px-1 text-sm text-muted">{t.noChats}</p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:pb-0">
          {shown.map((c) => {
            const active = c.id === activeId
            return (
              <li key={c.id} className="flex shrink-0 flex-col gap-1 lg:shrink">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/patient/health?c=${c.id}`}
                    aria-current={active ? 'page' : undefined}
                    className={`block max-w-48 min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-sm lg:max-w-none ${
                      active ? 'bg-tint font-semibold text-ink' : 'border border-line text-body hover:bg-soft lg:border-transparent'
                    }`}
                  >
                    {c.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirm(c.id)}
                    aria-label={`${t.del.one}: ${c.title}`}
                    title={t.del.one}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
                {confirm === c.id ? confirmRow(c.id, t.del.confirmOne) : null}
              </li>
            )
          })}
        </ul>
      )}
      {shown.length > 0 ? (
        confirm === 'all' ? (
          confirmRow('all', t.del.confirmAll)
        ) : (
          <button
            type="button"
            onClick={() => setConfirm('all')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-danger/40 px-4 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            <Icon name="trash" className="h-4 w-4" />
            {t.del.all}
          </button>
        )
      ) : null}
      {failed ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {t.del.failed}
        </p>
      ) : null}
    </aside>
  )
}

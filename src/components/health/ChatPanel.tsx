'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from 'react'
import { sendMessage } from '@/app/(portal)/patient/health/actions'
import { Icon } from '@/components/ui/Icon'
import { CONFIDENCE_PREFIX } from '@/lib/health/safety-filter'
import type { SendError } from '@/lib/health/send'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type Bubble = { id: string; author: 'patient' | 'biluna'; body: string }

const PREFIXES = Object.values(CONFIDENCE_PREFIX)

/** BiLuna's reply as plain paragraphs, with the "How sure I am" line set apart. Markdown stars are dropped. */
function ReplyText({ body }: { body: string }) {
  const lines = body.replace(/\*\*/g, '').split('\n')
  return (
    <div className="flex flex-col gap-2">
      {lines.map((raw, i) => {
        const line = raw.replace(/^\s*[*-]\s+/, '• ').trim()
        if (!line) return null
        const isConfidence = PREFIXES.some((p) => line.startsWith(p))
        return isConfidence ? (
          <p key={i} className="mt-1 rounded-xl border border-tint bg-soft px-3 py-2 text-sm font-semibold text-ink">
            {line}
          </p>
        ) : (
          <p key={i}>{line}</p>
        )
      })}
    </div>
  )
}

export function ChatPanel({
  conversationId: initialId,
  initial,
  firstQuestion,
  t,
  emergency,
}: {
  conversationId: string | null
  initial: Bubble[]
  firstQuestion: string
  t: Dictionary['health']
  emergency: string
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Bubble[]>(initial)
  const [conversationId, setConversationId] = useState(initialId)
  const [text, setText] = useState('')
  const [error, setError] = useState<SendError | null>(null)
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)
  const sentFirst = useRef(false)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  function send(raw: string) {
    const value = raw.trim()
    if (!value || pending) return
    setError(null)
    setText('')
    setMessages((m) => [...m, { id: `local-${Date.now()}`, author: 'patient', body: value }])
    startTransition(async () => {
      const result = await sendMessage({ conversationId, text: value })
      if (result.conversationId && result.conversationId !== conversationId) {
        setConversationId(result.conversationId)
        window.history.replaceState(null, '', `/patient/health?c=${result.conversationId}`)
      }
      if (result.ok) {
        setMessages((m) => [...m, { id: `reply-${Date.now()}`, author: 'biluna', body: result.reply.body }])
      } else {
        setError(result.error)
        if (result.error === 'empty' || result.error === 'tooLong') setMessages((m) => m.slice(0, -1))
      }
      router.refresh()
    })
  }

  // A question typed on the dashboard arrives as ?q= and is sent once.
  useEffect(() => {
    if (firstQuestion && !sentFirst.current) {
      sentFirst.current = true
      send(firstQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(text)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(text)
    }
  }

  return (
    <section className="glass flex min-h-[32rem] flex-col rounded-2xl lg:h-[calc(100vh-16rem)]" aria-label={t.title}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        <div className="flex items-end gap-2.5">
          <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="h-9 w-auto shrink-0" />
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-soft px-4 py-3 text-[0.95rem] leading-relaxed text-ink">
            {t.greeting}
          </div>
        </div>

        {messages.map((m) =>
          m.author === 'patient' ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-on-brand">
                <span className="sr-only">{t.you}: </span>
                {m.body}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2.5">
              <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="h-9 w-auto shrink-0" />
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3 text-[0.95rem] leading-relaxed text-ink">
                <span className="sr-only">{t.biluna}: </span>
                <ReplyText body={m.body} />
              </div>
            </div>
          ),
        )}

        {pending ? (
          <div className="flex items-end gap-2.5" role="status">
            <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="h-9 w-auto shrink-0" />
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-soft px-4 py-4">
              <span className="sr-only">{t.sending}</span>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-cyan motion-safe:animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
            {t.errors[error]}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-line p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <label htmlFor="health-input" className="sr-only">
            {t.placeholder}
          </label>
          <textarea
            id="health-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            maxLength={2000}
            placeholder={t.placeholder}
            className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-field bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            aria-label={t.send}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-on-brand hover:bg-aqua disabled:opacity-50"
          >
            <Icon name="send" className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-muted">
          {t.fictional} <span className="hidden sm:inline">· {t.enterHint}</span>
        </p>
        <p className="text-xs text-danger">{emergency}</p>
      </form>
    </section>
  )
}

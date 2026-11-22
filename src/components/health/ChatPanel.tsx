'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { rateReply, sendMessage } from '@/app/(portal)/patient/health/actions'
import { BodyCard, BodyPicker, PointChip } from '@/components/health/ChatBody'
import { AttachPanel } from '@/components/health/AttachPanel'
import { SummaryPanel } from '@/components/consult/SummaryPanel'
import { EmergencyCard } from '@/components/health/EmergencyCard'
import type { PatientSummary } from '@/lib/consult/store'
import { attachmentLine, type Attachment } from '@/lib/health/attachment'
import { prepareAttachment } from '@/lib/health/attachment-client'
import { detectDanger } from '@/lib/health/danger'
import { extractOptions } from '@/lib/health/options'
import { Icon } from '@/components/ui/Icon'
import { extractBodyTag, pointedLine, splitPointed, type BodyPoint } from '@/lib/body/chat-body'
import { detectLang } from '@/lib/health/lang-detect'
import { CONFIDENCE_PREFIX } from '@/lib/health/safety-filter'
import type { SendError } from '@/lib/health/send'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Lang } from '@/lib/i18n/lang'

type Bubble = { id: string; author: 'patient' | 'biluna'; body: string }
type Rating = 1 | -1

/** 👍 / 👎 under a reply. Saved for reviewed improvements only; never training data. */
function FeedbackButtons({ messageId, initial, t }: { messageId: string; initial?: Rating; t: Dictionary['health'] }) {
  const [rating, setRating] = useState<Rating | undefined>(initial)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  async function rate(r: Rating) {
    if (busy || r === rating) return
    setBusy(true)
    setFailed(false)
    const before = rating
    setRating(r)
    const ok = await rateReply({ messageId, rating: r }).catch(() => false)
    if (!ok) {
      setRating(before)
      setFailed(true)
    }
    setBusy(false)
  }
  const base = 'flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm transition-colors'
  return (
    <div className="mt-1.5 flex items-center gap-1.5 pl-1" role="group" aria-label={t.feedbackLabel}>
      <button
        type="button"
        onClick={() => rate(1)}
        aria-pressed={rating === 1}
        aria-label={t.helpful}
        className={`${base} ${rating === 1 ? 'border-brand bg-brand text-on-brand' : 'border-line text-muted hover:bg-soft'}`}
      >
        <span aria-hidden="true">👍</span>
      </button>
      <button
        type="button"
        onClick={() => rate(-1)}
        aria-pressed={rating === -1}
        aria-label={t.notHelpful}
        className={`${base} ${rating === -1 ? 'border-brand bg-brand text-on-brand' : 'border-line text-muted hover:bg-soft'}`}
      >
        <span aria-hidden="true">👎</span>
      </button>
      {failed ? (
        <span role="status" className="text-xs font-semibold text-warn">
          {t.feedbackFailed}
        </span>
      ) : rating ? (
        <span className="text-xs text-muted">{t.feedbackThanks}</span>
      ) : null}
    </div>
  )
}

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
  feedback,
  firstQuestion,
  t,
  lang,
  emergency,
  summary,
  doctorName,
  tSummary,
}: {
  conversationId: string | null
  initial: Bubble[]
  feedback: Record<string, Rating>
  firstQuestion: string
  t: Dictionary['health']
  lang: Lang
  emergency: string
  summary: PatientSummary | null
  doctorName: string
  tSummary: Dictionary['summary']
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Bubble[]>(initial)
  const [conversationId, setConversationId] = useState(initialId)
  const [text, setText] = useState('')
  const [error, setError] = useState<SendError | null>(null)
  // Our own "waiting for BiLuna" flag. A transition would also wait for Next.js to reload the page
  // after the sign-in cookie refresh, keeping "thinking" on screen for seconds after the reply.
  const [pending, setPending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const sentFirst = useRef(false)
  const [point, setPoint] = useState<BodyPoint | null>(null)
  // The chat's Consultation Prep summary, kept here so closing and reopening the panel does not remake it.
  const [prep, setPrep] = useState<PatientSummary | null>(summary)
  // A report or prescription waiting to be sent (read once by BiLuna, never saved).
  const [file, setFile] = useState<Attachment | null>(null)
  const [preparing, setPreparing] = useState(false)
  // The care check under the newest answer: which reply the patient said they were happy with.
  const [cared, setCared] = useState<string | null>(null)
  // Emergency cards the patient closed with "I'm safe".
  const [safe, setSafe] = useState<string[]>([])
  // Only one 3D view at a time: 'picker', a reply's id, or none. The newest reply's card starts open.
  const [open3d, setOpen3d] = useState<string | null>(() => {
    const last = initial[initial.length - 1]
    return last?.author === 'biluna' && extractBodyTag(last.body).organ ? last.id : null
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  function send(raw: string, attached: Attachment | null = file) {
    const words = raw.trim()
    if ((!words && !point && !attached) || pending) return
    // The pointed line uses the language of the words typed, so BiLuna replies in that language.
    const value = point ? `${pointedLine(point, words ? detectLang(words) : lang)}${words ? `\n${words}` : ''}` : words
    setError(null)
    setText('')
    setPoint(null)
    setFile(null)
    if (open3d === 'picker' || open3d === 'attach') setOpen3d(null)
    const shown = attached ? `${attachmentLine(attached.name)}${value ? `\n${value}` : ''}` : value
    setMessages((m) => [...m, { id: `local-${Date.now()}`, author: 'patient', body: shown }])
    setPending(true)
    void (async () => {
      let result: Awaited<ReturnType<typeof sendMessage>>
      try {
        result = await sendMessage({ conversationId, text: value, attachment: attached, lang })
      } catch {
        result = { ok: false, error: 'error' }
      }
      setPending(false)
      if (result.conversationId && result.conversationId !== conversationId) {
        setConversationId(result.conversationId)
        window.history.replaceState(null, '', `/patient/health?c=${result.conversationId}`)
      }
      if (result.ok) {
        setMessages((m) => [...m, { id: result.reply.id, author: 'biluna', body: result.reply.body }])
        if (extractBodyTag(result.reply.body).organ) setOpen3d(result.reply.id)
      } else {
        setError(result.error)
        if (result.error === 'empty' || result.error === 'tooLong') setMessages((m) => m.slice(0, -1))
      }
      // Refresh the past-chats list in the background, so "thinking" ends as soon as the reply is shown.
      window.setTimeout(() => router.refresh(), 0)
    })()
  }

  // A question typed on the dashboard arrives as ?q= and is sent once.
  useEffect(() => {
    if (firstQuestion && !sentFirst.current) {
      sentFirst.current = true
      send(firstQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** A chosen file or a sample: shrink it in the browser, then send a sample at once or wait for the patient. */
  async function attach(blob: Blob, name: string, sendNow: boolean) {
    setError(null)
    setPreparing(true)
    try {
      const ready = await prepareAttachment(blob, name)
      if (typeof ready === 'string') return setError(ready)
      setOpen3d(null)
      if (sendNow) {
        setPreparing(false)
        send('', ready)
      } else setFile(ready)
    } catch {
      setError('fileType')
    } finally {
      setPreparing(false)
    }
  }

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

        {messages.map((m) => {
          if (m.author === 'patient') {
            const clipped = m.body.startsWith('📎') ? m.body.split('\n')[0] : null
            const afterClip = clipped ? m.body.slice(clipped.length).replace(/^\n/, '') : m.body
            const { point: pointed, rest } = splitPointed(afterClip)
            // The fixed danger-word check, apart from the AI: the card shows the moment the message is sent.
            const danger = detectDanger(m.body)
            return (
              <Fragment key={m.id}>
                <div className="flex justify-end">
                  <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-[0.95rem] leading-relaxed text-on-brand">
                    <span className="sr-only">{t.you}: </span>
                    {clipped ? (
                      <span className="self-start rounded-full bg-on-brand/15 px-3 py-1 text-sm font-semibold">{clipped}</span>
                    ) : null}
                    {pointed ? (
                      <span className="self-start rounded-full bg-on-brand/15 px-3 py-1 text-sm font-semibold">📍 {pointed}</span>
                    ) : null}
                    {rest ? <p className="whitespace-pre-wrap">{rest}</p> : null}
                  </div>
                </div>
                {danger && !safe.includes(m.id) ? (
                  <EmergencyCard kind={danger} onSafe={() => setSafe((s) => [...s, m.id])} t={t.danger} />
                ) : null}
              </Fragment>
            )
          }
          const tagged = extractBodyTag(m.body)
          const opts = extractOptions(tagged.text)
          const reply = { text: opts.text, organ: tagged.organ }
          const isLatest = m.id === messages[messages.length - 1]?.id && !pending
          return (
            <div key={m.id} className="flex items-start gap-2.5">
              <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="mt-1 h-9 w-auto shrink-0" />
              <div className="flex max-w-[85%] flex-col">
                <div className="rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-3 text-[0.95rem] leading-relaxed text-ink">
                  <span className="sr-only">{t.biluna}: </span>
                  <ReplyText body={reply.text} />
                  {opts.options.length && isLatest ? (
                    <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t.tapAnswer}>
                      {opts.options.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => send(o)}
                          className="min-h-10 rounded-full border border-brand bg-surface px-4 text-sm font-semibold text-brand hover:bg-soft"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {reply.organ ? (
                    <BodyCard
                      organ={reply.organ}
                      open={open3d === m.id}
                      onToggle={() => setOpen3d((o) => (o === m.id ? null : m.id))}
                      lang={lang}
                      t={t.body}
                    />
                  ) : null}
                </div>
                <FeedbackButtons messageId={m.id} initial={feedback[m.id]} t={t} />
              </div>
            </div>
          )
        })}

        {(() => {
          const last = messages[messages.length - 1]
          if (pending || messages.length < 2 || last?.author !== 'biluna' || last.id.startsWith('local-')) return null
          // No "are you happy" check right after an emergency or self-harm message.
          const asked = [...messages].reverse().find((m) => m.author === 'patient')
          if (asked && detectDanger(asked.body)) return null
          if (cared === last.id) {
            return <p className="self-start rounded-2xl rounded-tl-sm bg-soft px-4 py-3 text-sm text-ink">💙 {t.care.thanks}</p>
          }
          return (
            <div className="flex flex-wrap items-center gap-2 self-start">
              <span className="text-sm text-body">{t.care.question}</span>
              <button
                type="button"
                onClick={() => setCared(last.id)}
                className="min-h-9 rounded-full border border-brand px-3 text-sm font-semibold text-brand hover:bg-soft"
              >
                {t.care.satisfied}
              </button>
              <button
                type="button"
                onClick={() => send(t.care.moreMsg)}
                className="min-h-9 rounded-full border border-line px-3 text-sm font-semibold text-ink hover:bg-soft"
              >
                {t.care.more}
              </button>
            </div>
          )
        })()}
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
        {conversationId && open3d === 'summary' ? (
          <SummaryPanel
            conversationId={conversationId}
            initial={prep}
            onChange={setPrep}
            doctorName={doctorName}
            lang={lang}
            onClose={() => setOpen3d(null)}
            t={tSummary}
          />
        ) : null}
        {conversationId && open3d !== 'summary' && messages.some((m) => m.author === 'patient' && !m.id.startsWith('local-')) ? (
          <button
            type="button"
            onClick={() => setOpen3d('summary')}
            className="flex min-h-10 items-center justify-center gap-2 self-start rounded-full border border-brand bg-surface px-4 text-sm font-semibold text-brand hover:bg-soft"
          >
            <Icon name="share" className="h-4 w-4" />
            📋 {tSummary.button}
          </button>
        ) : null}
        {open3d === 'picker' ? (
          <BodyPicker
            point={point}
            onPoint={(p) => setPoint((prev) => ({ ...p, pain: prev?.pain ?? null }))}
            onPain={(n) => setPoint((prev) => (prev ? { ...prev, pain: n } : prev))}
            onAsk={() => send(text)}
            pending={pending}
            onClose={() => setOpen3d(null)}
            lang={lang}
            t={t.body}
          />
        ) : null}
        {open3d === 'attach' ? (
          <AttachPanel
            busy={preparing || pending}
            onFile={(f) => attach(f, f.name, false)}
            onSample={async (path, name) => {
              try {
                const res = await fetch(path)
                await attach(await res.blob(), name, true)
              } catch {
                setError('error')
              }
            }}
            onClose={() => setOpen3d(null)}
            t={t.attach}
          />
        ) : null}
        {point ? <PointChip point={point} onClear={() => setPoint(null)} lang={lang} t={t.body} /> : null}
        {preparing ? <p className="text-sm text-muted">{t.attach.preparing}</p> : null}
        {file ? (
          <div className="flex items-center gap-2 self-start rounded-full border border-tint bg-soft py-1 pr-1 pl-3 text-sm font-semibold text-ink">
            <span>{attachmentLine(file.name)}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label={t.attach.remove}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setOpen3d((o) => (o === 'picker' ? null : 'picker'))}
            aria-pressed={open3d === 'picker'}
            aria-label={t.body.button}
            title={t.body.button}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${open3d === 'picker' ? 'border-brand bg-brand text-on-brand' : 'border-field text-brand hover:bg-soft'}`}
          >
            <Icon name="body" className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setOpen3d((o) => (o === 'attach' ? null : 'attach'))}
            aria-pressed={open3d === 'attach'}
            aria-label={t.attach.button}
            title={t.attach.button}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${open3d === 'attach' ? 'border-brand bg-brand text-on-brand' : 'border-field text-brand hover:bg-soft'}`}
          >
            <Icon name="clip" className="h-6 w-6" />
          </button>
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
            disabled={pending || preparing || (!text.trim() && !point && !file)}
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

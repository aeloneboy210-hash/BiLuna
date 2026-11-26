import { labAllowed } from '@/lib/ai/lab-allowed'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cloudflareChat, cloudflareReady } from '@/lib/ai/cloudflare'
import { CANDIDATES, QUESTIONS, scoreReply } from '@/lib/ai/model-check'
import { buildInstructions } from '@/lib/health/instructions'

export const metadata: Metadata = { title: 'AI model check', robots: { index: false } }
export const maxDuration = 300

/**
 * Private test page (preview links only, never on the live site): asks one free Cloudflare model the 10
 * made-up questions with BiLuna's real instructions and scores each answer. Nothing is saved.
 */
export default async function ModelCheckPage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  if (!labAllowed()) notFound()
  const { model } = await searchParams
  const chosen = CANDIDATES.find((m) => m === model)

  const results = chosen
    ? await Promise.all(
        QUESTIONS.map(async (q) => {
          const reply = await cloudflareChat(chosen, buildInstructions(q.lang), q.text)
          return { q, reply, score: reply.ok ? scoreReply(q, reply.text) : null }
        }),
      )
    : []
  const passed = results.filter((r) => r.score?.passed).length

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">AI model check (made-up questions, nothing saved)</h1>
      {!cloudflareReady() ? (
        <p className="rounded-xl bg-warn/10 p-4 font-semibold text-warn">
          Cloudflare is not set up for this preview yet (CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_TOKEN).
        </p>
      ) : null}
      <nav className="flex flex-wrap gap-2">
        {CANDIDATES.map((m) => (
          <Link
            key={m}
            href={`/lab/models?model=${encodeURIComponent(m)}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${m === chosen ? 'bg-brand text-on-brand' : 'border-brand text-brand'}`}
          >
            {m.replace('@cf/', '')}
          </Link>
        ))}
      </nav>
      {chosen ? (
        <p id="summary" className="text-lg font-semibold">
          {chosen}: {passed} of {results.length} passed
        </p>
      ) : (
        <p>Choose a model. Each run asks 10 questions and takes up to a minute.</p>
      )}
      {results.map(({ q, reply, score }) => (
        <section key={q.id} data-question={q.id} className="flex flex-col gap-2 rounded-xl border border-line p-4">
          <p className="text-sm text-muted">
            {q.id} · {q.lang} ·{' '}
            {reply.ok
              ? `${(reply.ms / 1000).toFixed(1)}s · in ${reply.inputTokens ?? '?'} / out ${reply.outputTokens ?? '?'} tokens`
              : `error after ${(reply.ms / 1000).toFixed(1)}s`}
          </p>
          <p className="font-semibold">Q: {q.text}</p>
          {reply.ok ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{reply.text}</pre>
          ) : (
            <p className="font-semibold text-danger">Error: {reply.error}</p>
          )}
          {score ? (
            <p className={`text-sm font-bold ${score.passed ? 'text-ok' : 'text-danger'}`}>
              {score.passed ? 'PASS' : `FAIL: ${score.problems.join(', ')}`}
            </p>
          ) : null}
        </section>
      ))}
    </main>
  )
}

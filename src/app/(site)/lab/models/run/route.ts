import { NextResponse } from 'next/server'
import { cloudflareChat } from '@/lib/ai/cloudflare'
import { CANDIDATES, QUESTIONS, scoreReply } from '@/lib/ai/model-check'
import { buildInstructions } from '@/lib/health/instructions'

export const maxDuration = 300

/** The same check as the page, as plain JSON (preview links only). Made-up questions; nothing is saved. */
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === 'production') return new NextResponse('Not found', { status: 404 })
  const model = CANDIDATES.find((m) => m === new URL(request.url).searchParams.get('model'))
  if (!model) return NextResponse.json({ error: 'unknown model', models: CANDIDATES }, { status: 400 })
  const results = await Promise.all(
    QUESTIONS.map(async (q) => {
      const r = await cloudflareChat(model, buildInstructions(q.lang), q.text)
      return r.ok
        ? { id: q.id, s: Math.round(r.ms / 100) / 10, in: r.inputTokens, out: r.outputTokens, ...scoreReply(q, r.text), text: r.text }
        : { id: q.id, error: r.error }
    }),
  )
  return NextResponse.json({ model, passed: results.filter((r) => 'passed' in r && r.passed).length, results })
}

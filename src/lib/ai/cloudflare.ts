import 'server-only'

/**
 * Cloudflare Workers AI through its OpenAI-compatible chat endpoint. Cloudflare keeps no data and does
 * not train on it. The account ID and token live only in Vercel's settings, never in the code or chat.
 */
export type CloudflareReply =
  | { ok: true; text: string; ms: number; inputTokens: number | null; outputTokens: number | null }
  | { ok: false; error: string; ms: number }

export function cloudflareReady(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_TOKEN)
}

export async function cloudflareChat(model: string, system: string, user: string): Promise<CloudflareReply> {
  const started = Date.now()
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_AI_TOKEN
  if (!account || !token) return { ok: false, error: 'not set up', ms: 0 }
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        // Thinking models use part of this before they answer, so it must be generous.
        max_tokens: 4000,
        // Gemma 4 thinks before it answers, which made replies take 10-45 s; ask it not to.
        ...(model.includes('gemma-4') ? { chat_template_kwargs: { enable_thinking: false } } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    })
    const ms = Date.now() - started
    const body = (await res.json().catch(() => null)) as {
      choices?: { message?: { content?: string | null } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
      errors?: { message?: string }[]
    } | null
    if (!res.ok) {
      // The status and Cloudflare's short reason only; never the token.
      return { ok: false, error: `${res.status} ${body?.errors?.[0]?.message ?? ''}`.trim(), ms }
    }
    const text = body?.choices?.[0]?.message?.content ?? ''
    return {
      ok: true,
      text,
      ms,
      inputTokens: body?.usage?.prompt_tokens ?? null,
      outputTokens: body?.usage?.completion_tokens ?? null,
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.name : 'error', ms: Date.now() - started }
  }
}

/** The model BiLuna uses on Cloudflare; set BILUNA_CF_MODEL in Vercel to change it without a code change. */
export const CLOUDFLARE_MODEL = process.env.BILUNA_CF_MODEL || '@cf/google/gemma-4-26b-a4b-it'

type Part = { type: 'text'; text: string } | { type: 'file'; data: string; mediaType: string; filename: string }
type Message = { role: 'user' | 'assistant'; content: string | Part[] }
type OpenAIPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }

/** Thrown when Cloudflare is busy or the free daily allowance is used up, so the chat says "busy". */
export class BusyError extends Error {
  name = 'BusyError'
}

const PDF_NOTE =
  '[The patient attached a PDF, which cannot be read here. Do not guess its contents. Ask them kindly to send a clear photo of the page instead.]'

/** Turns BiLuna's messages into Cloudflare's chat format. Photos go as images; a PDF becomes a short note. */
export function toCloudflareMessages(instructions: string, messages: Message[]) {
  return [
    { role: 'system' as const, content: instructions },
    ...messages.map((m) => ({
      role: m.role,
      content:
        typeof m.content === 'string'
          ? m.content
          : m.content.map(
              (p): OpenAIPart =>
                p.type === 'text'
                  ? p
                  : p.mediaType === 'application/pdf'
                    ? { type: 'text', text: PDF_NOTE }
                    : { type: 'image_url', image_url: { url: `data:${p.mediaType};base64,${p.data}` } },
            ),
    })),
  ]
}

/** One call to Gemma 4 on Cloudflare with BiLuna's instructions and the recent chat. */
export async function cloudflareGenerate({ instructions, messages }: { instructions: string; messages: Message[] }) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_AI_TOKEN
  if (!account || !token) throw new Error('Cloudflare is not set up')
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLOUDFLARE_MODEL,
      max_tokens: 1500,
      temperature: 0.3,
      ...(CLOUDFLARE_MODEL.includes('gemma-4') ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      messages: toCloudflareMessages(instructions, messages),
    }),
    signal: AbortSignal.timeout(25_000),
  })
  if (res.status === 429) throw new BusyError('Cloudflare busy')
  const body = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string | null } }[]
    errors?: { code?: number }[]
  } | null
  // 4006: the free daily allowance is used up. Treated as busy so the patient sees a calm message.
  if (body?.errors?.some((e) => e.code === 4006)) throw new BusyError('Cloudflare daily allowance used')
  if (!res.ok) throw new Error(`Cloudflare ${res.status}`)
  return { text: body?.choices?.[0]?.message?.content ?? '' }
}

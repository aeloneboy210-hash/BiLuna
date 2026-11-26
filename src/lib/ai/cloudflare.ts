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
        max_tokens: 1200,
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

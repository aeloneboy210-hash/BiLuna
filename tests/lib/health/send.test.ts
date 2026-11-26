import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { handleSend, type SendDeps } from '@/lib/health/send'

function deps(over: Partial<SendDeps> = {}) {
  const log: string[] = []
  const d: SendDeps = {
    createConversation: vi.fn(async (title: string) => {
      log.push(`create:${title}`)
      return 'new-id'
    }),
    addMessage: vi.fn(async (id, author, body, lang) => {
      log.push(`add:${id}:${author}:${lang}:${body}`)
      return { ok: true as const, id: `${author}-msg` }
    }),
    loadHistory: vi.fn(async () => [{ author: 'patient' as const, body: 'hi' }]),
    loadProfile: vi.fn(async () => null),
    ask: vi.fn(async () => ({ ok: true as const, text: 'reply text', kind: 'answer' as const, retried: false })),
    logEvent: vi.fn(async (kind: string, lang?: string) => {
      log.push(`event:${kind}${lang ? `:${lang}` : ''}`)
    }),
    ...over,
  }
  return { d, log }
}

test('empty text is refused before any call', async () => {
  const { d, log } = deps()
  expect(await handleSend({ conversationId: null, text: '   ' }, d)).toEqual({ ok: false, error: 'empty' })
  expect(log).toEqual([])
  expect(d.ask).not.toHaveBeenCalled()
})

test('text over 2000 characters is refused before any call', async () => {
  const { d, log } = deps()
  expect(await handleSend({ conversationId: null, text: 'a'.repeat(2001) }, d)).toEqual({ ok: false, error: 'tooLong' })
  expect(log).toEqual([])
})

test('a new chat is created with the first 60 characters as its title', async () => {
  const { d, log } = deps()
  const text = 'I have had a headache and a mild fever for two days, and now my neck hurts too.'
  const result = await handleSend({ conversationId: null, text }, d)
  expect(result).toEqual({ ok: true, conversationId: 'new-id', reply: { id: 'biluna-msg', body: 'reply text', lang: 'en' } })
  expect(log[0]).toBe(`create:${text.slice(0, 60)}`)
  expect(log[1]).toBe(`add:new-id:patient:en:${text}`)
  expect(log[2]).toBe('add:new-id:biluna:en:reply text')
  expect(log[3]).toBe('event:reply:en')
})

test('an existing chat is used, and Bangla is detected', async () => {
  const { d, log } = deps()
  const result = await handleSend({ conversationId: 'c1', text: 'আমার কাশি হচ্ছে' }, d)
  expect(result).toMatchObject({ ok: true, conversationId: 'c1', reply: { lang: 'bn' } })
  expect(d.createConversation).not.toHaveBeenCalled()
  expect(d.ask).toHaveBeenCalledWith(expect.anything(), 'bn', null)
  expect(log[0]).toBe('add:c1:patient:bn:আমার কাশি হচ্ছে')
})

test('the daily limit maps to limit and the AI is not asked', async () => {
  const { d } = deps({ addMessage: vi.fn(async () => ({ ok: false as const, error: 'limit' as const })) })
  expect(await handleSend({ conversationId: 'c1', text: 'hello' }, d)).toEqual({ ok: false, error: 'limit', conversationId: 'c1' })
  expect(d.ask).not.toHaveBeenCalled()
})

test.each(['busy', 'unsafe', 'error'] as const)('AI %s returns the error and saves no BiLuna message', async (reason) => {
  const { d, log } = deps({ ask: vi.fn(async () => ({ ok: false as const, reason })) })
  expect(await handleSend({ conversationId: 'c1', text: 'hello' }, d)).toEqual({ ok: false, error: reason, conversationId: 'c1' })
  expect(log.filter((l) => l.includes(':biluna:'))).toEqual([])
  expect(log.filter((l) => l.includes(':patient:'))).toHaveLength(1)
})

test('an unsafe reply is logged as blocked', async () => {
  const { d, log } = deps({ ask: vi.fn(async () => ({ ok: false as const, reason: 'unsafe' as const })) })
  await handleSend({ conversationId: 'c1', text: 'hello' }, d)
  expect(log).toContain('event:blocked:en')
})

test('a rewritten reply is logged as retry and reply', async () => {
  const { d, log } = deps({ ask: vi.fn(async () => ({ ok: true as const, text: 'ok', kind: 'answer' as const, retried: true })) })
  await handleSend({ conversationId: 'c1', text: 'hello' }, d)
  expect(log.filter((l) => l.startsWith('event:'))).toEqual(['event:retry:en', 'event:reply:en'])
})

test('a follow-up question is logged as clarify', async () => {
  const { d, log } = deps({ ask: vi.fn(async () => ({ ok: true as const, text: 'Where?', kind: 'clarify' as const, retried: false })) })
  await handleSend({ conversationId: 'c1', text: 'I feel sick' }, d)
  expect(log.filter((l) => l.startsWith('event:'))).toEqual(['event:clarify:en', 'event:reply:en'])
})

test('a consented profile is passed to the AI and its use is logged', async () => {
  const { d, log } = deps({ loadProfile: vi.fn(async () => '- Allergies: Penicillin') })
  await handleSend({ conversationId: 'c1', text: 'hello' }, d)
  expect(d.ask).toHaveBeenCalledWith(expect.anything(), 'en', '- Allergies: Penicillin')
  expect(log).toContain('event:profile_used')
})

test('a failed event log never breaks the chat', async () => {
  const { d } = deps({ logEvent: vi.fn(async () => { throw new Error('db down') }) })
  const r = await handleSend({ conversationId: 'c1', text: 'hello' }, d)
  expect(r.ok).toBe(true)
})

describe('a report or prescription upload', () => {
  const file = { name: 'report.jpg', mediaType: 'image/jpeg', data: Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64') }

  test('can be sent with no words; the chat keeps only a 📎 line and BiLuna gets the file once', async () => {
    const { d, log } = deps()
    const r = await handleSend({ conversationId: 'c1', text: '', attachment: file }, d)
    expect(r.ok).toBe(true)
    expect(log).toContain('add:c1:patient:en:📎 report.jpg')
    expect(d.ask).toHaveBeenCalledWith(expect.anything(), 'en', null, file)
  })

  test('words go under the 📎 line', async () => {
    const { d, log } = deps()
    await handleSend({ conversationId: 'c1', text: 'what does this mean', attachment: file }, d)
    expect(log).toContain('add:c1:patient:en:📎 report.jpg\nwhat does this mean')
  })

  test('a wrong file type is refused before anything is saved', async () => {
    const { d, log } = deps()
    const r = await handleSend({ conversationId: 'c1', text: '', attachment: { ...file, mediaType: 'image/gif' } }, d)
    expect(r).toEqual({ ok: false, error: 'fileType' })
    expect(log).toEqual([])
  })
})

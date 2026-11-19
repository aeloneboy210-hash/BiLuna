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
      return { ok: true as const }
    }),
    loadHistory: vi.fn(async () => [{ author: 'patient' as const, body: 'hi' }]),
    ask: vi.fn(async () => ({ ok: true as const, text: 'reply text' })),
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
  expect(result).toEqual({ ok: true, conversationId: 'new-id', reply: { body: 'reply text', lang: 'en' } })
  expect(log[0]).toBe(`create:${text.slice(0, 60)}`)
  expect(log[1]).toBe(`add:new-id:patient:en:${text}`)
  expect(log[2]).toBe('add:new-id:biluna:en:reply text')
})

test('an existing chat is used, and Bangla is detected', async () => {
  const { d, log } = deps()
  const result = await handleSend({ conversationId: 'c1', text: 'আমার কাশি হচ্ছে' }, d)
  expect(result).toMatchObject({ ok: true, conversationId: 'c1', reply: { lang: 'bn' } })
  expect(d.createConversation).not.toHaveBeenCalled()
  expect(d.ask).toHaveBeenCalledWith(expect.anything(), 'bn')
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

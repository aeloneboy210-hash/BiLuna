import type { Metadata } from 'next'
import { ChatPanel } from '@/components/health/ChatPanel'
import { ConversationList } from '@/components/health/ConversationList'
import { requirePortal } from '@/lib/auth/require-portal'
import { demoDoctor, summaryForConversation } from '@/lib/consult/store'
import { getMessages, listConversations } from '@/lib/health/chat-store'
import { getDict } from '@/lib/i18n/server'
import { feedbackFor } from '@/lib/intelligence/store'

export const metadata: Metadata = { title: 'BiLuna Health' }

// The model gets up to 25 seconds, retried once; leave room for both.
export const maxDuration = 60

const UUID = /^[0-9a-f-]{36}$/i

export default async function HealthPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePortal('patient')
  const { dict, lang } = await getDict()
  const params = await searchParams
  const c = typeof params.c === 'string' && UUID.test(params.c) ? params.c : null
  const q = typeof params.q === 'string' ? params.q.slice(0, 2000) : ''

  const conversations = await listConversations()
  const owned = c && conversations.some((x) => x.id === c) ? c : null
  const messages = owned ? await getMessages(owned) : []
  const feedback = await feedbackFor(messages.filter((m) => m.author === 'biluna').map((m) => m.id))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{dict.health.title}</h1>
        <p className="text-body">{dict.health.intro}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[17rem_1fr]">
        <ConversationList conversations={conversations} activeId={owned} t={dict.health} />
        <ChatPanel
          key={owned ?? 'new'}
          conversationId={owned}
          initial={messages.map(({ id, author, body }) => ({ id, author, body }))}
          feedback={feedback}
          firstQuestion={owned ? '' : q}
          t={dict.health}
          lang={lang}
          emergency={dict.common.emergency}
          summary={owned ? await summaryForConversation(owned) : null}
          doctorName={(await demoDoctor())?.name ?? 'Dr. Karim (demo doctor)'}
          tSummary={dict.summary}
        />
      </div>
    </div>
  )
}

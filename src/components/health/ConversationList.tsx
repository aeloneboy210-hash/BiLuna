import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import type { ConversationSummary } from '@/lib/health/chat-store'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/** Past chats, newest first, with a button for a new chat. Above the chat on a phone, beside it on a laptop. */
export function ConversationList({
  conversations,
  activeId,
  t,
}: {
  conversations: ConversationSummary[]
  activeId: string | null
  t: Dictionary['health']
}) {
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
      {conversations.length === 0 ? (
        <p className="px-1 text-sm text-muted">{t.noChats}</p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:pb-0">
          {conversations.map((c) => {
            const active = c.id === activeId
            return (
              <li key={c.id} className="shrink-0 lg:shrink">
                <Link
                  href={`/patient/health?c=${c.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`block max-w-56 truncate rounded-xl px-3 py-2.5 text-sm lg:max-w-none ${
                    active ? 'bg-tint font-semibold text-ink' : 'border border-line text-body hover:bg-soft lg:border-transparent'
                  }`}
                >
                  {c.title}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

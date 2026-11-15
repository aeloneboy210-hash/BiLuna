import type { Dictionary } from '@/lib/i18n/dictionaries'
import { DEMO_ACCOUNTS } from '@/lib/auth/setup-password'

/** The three demo emails and the portal each one opens. Passwords are never shown anywhere. */
export function DemoAccountList({ dict, title }: { dict: Dictionary; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      <ul className="flex flex-col">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email} className="flex flex-col gap-0.5 border-t border-line py-2 text-sm">
            <span className="font-semibold break-all text-aqua">{account.email}</span>
            <span className="text-body">{dict.portals[account.role].name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

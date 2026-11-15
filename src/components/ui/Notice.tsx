import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** A quiet panel for rules and explanations that sit beside the main content. */
export function Notice({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-cyan/20 bg-soft/50 px-4 py-3.5 ${className}`}>
      <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
      <p className="text-sm leading-relaxed text-body">{children}</p>
    </div>
  )
}

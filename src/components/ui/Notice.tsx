import type { ReactNode } from 'react'

/** A quiet panel for rules and explanations that sit beside the main content. */
export function Notice({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`rounded-2xl bg-soft px-4 py-3 text-sm leading-relaxed text-body ${className}`}>{children}</p>
}

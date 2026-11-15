import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface shadow-[0_8px_32px_rgb(0_10_40/0.45)] ${className}`}>{children}</div>
}

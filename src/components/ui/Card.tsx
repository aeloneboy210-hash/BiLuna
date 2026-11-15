import type { ReactNode } from 'react'

/** A glass panel. `interactive` adds the cyan glow on hover for cards that are links. */
export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return <div className={`glass rounded-2xl ${interactive ? 'glow-edge' : ''} ${className}`}>{children}</div>
}

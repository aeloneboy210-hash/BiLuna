import type { CSSProperties } from 'react'

/** A whole number that counts up from zero in CSS. No JavaScript; the real value is read out by screen readers. */
export function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.round(value))
  return (
    <span className={className}>
      <span aria-hidden="true" className="count-up tabular-nums" style={{ '--target': safe } as CSSProperties} />
      <span className="sr-only">{safe}</span>
    </span>
  )
}

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet'

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-all disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-on-brand shadow-[0_0_28px_rgb(0_168_255/0.45)] hover:bg-cyan',
  secondary: 'border border-cyan/40 bg-surface/60 text-aqua hover:border-cyan hover:shadow-[0_0_24px_rgb(0_168_255/0.3)]',
  quiet: 'min-h-11 px-3 text-sm text-brand hover:bg-soft',
}

export function buttonClass(variant: Variant = 'primary', className = ''): string {
  return `${base} ${variants[variant]} ${className}`
}

export function ButtonLink({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button {...props} className={buttonClass(variant, className)} />
}

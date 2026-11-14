import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet'

const base =
  'inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-semibold transition-colors disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-brand bg-white text-brand hover:bg-soft',
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

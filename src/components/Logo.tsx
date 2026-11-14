import Link from 'next/link'

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 text-ink">
      <svg aria-hidden="true" width="36" height="36" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="21" className="fill-brand" />
        <path d="M28 12a11 11 0 1 0 4 18 9 9 0 0 1-4-18z" fill="#fff" />
      </svg>
      <span className="text-2xl font-bold tracking-tight">{name}</span>
    </Link>
  )
}

import Image from 'next/image'
import Link from 'next/link'

/** The BiLuna logo from the owner's brand board, with the wordmark and the motto. */
export function Logo({ name, motto }: { name: string; motto: string }) {
  return (
    <Link href="/" className="group flex min-h-11 items-center gap-3">
      <Image
        src="/brand/logo-small-v2.webp"
        alt=""
        width={96}
        height={90}
        className="brand-art h-11 w-auto transition-transform duration-300 group-hover:scale-105"
      />
      <span className="flex flex-col">
        <span className="text-gradient font-display text-2xl leading-none font-bold tracking-tight">{name}</span>
        <span className="mt-1 hidden text-[0.6rem] font-semibold tracking-[0.22em] text-muted uppercase sm:block">
          {motto}
        </span>
      </span>
    </Link>
  )
}

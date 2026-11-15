import Link from 'next/link'

/**
 * A simplified drawing of the BiLuna mark: a medical cross with a connected centre and an orbit.
 * Replace the SVG with the official logo file when the owner supplies one.
 */
export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5">
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path
          d="M19 6h10a3 3 0 0 1 3 3v7h7a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-7v7a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3v-7H9a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3h7V9a3 3 0 0 1 3-3z"
          fill="rgb(0 168 255 / 0.14)"
          stroke="#00a8ff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M24 12v24M12 24h24" stroke="#00a8ff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="12" r="1.8" fill="#66f0ff" />
        <circle cx="24" cy="36" r="1.8" fill="#66f0ff" />
        <circle cx="12" cy="24" r="1.8" fill="#66f0ff" />
        <circle cx="36" cy="24" r="1.8" fill="#66f0ff" />
        <circle cx="24" cy="24" r="4.5" fill="#00e0ff" />
        <ellipse
          cx="24"
          cy="24"
          rx="22"
          ry="7.5"
          transform="rotate(-32 24 24)"
          stroke="#00e0ff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="bg-linear-to-r from-ink to-cyan bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">
        {name}
      </span>
    </Link>
  )
}

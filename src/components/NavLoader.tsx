'use client'

import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isPageChange, LOADER_ATTR } from '@/lib/ui/nav-loader'

/** Waits this long before showing, so fast page changes never flash. */
const DELAY_MS = 150
/** Never stays longer than this, even if a page fails to load. */
const MAX_MS = 15_000

/**
 * The intro's logo, orbits and heartbeat as a loading screen: shown when a link, tab or "Try as…" button
 * opens another page, and hidden as soon as the new page is on screen.
 */
export function NavLoader({ label }: { label: string }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState(false)

  // A new page arrived: hide.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false)
  }, [pathname, search])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || !a.href) return
      if (
        isPageChange({
          href: a.href,
          current: window.location.href,
          button: e.button,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          target: a.getAttribute('target'),
          download: a.hasAttribute('download'),
        })
      )
        setLoading(true)
    }
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null
      if (form?.hasAttribute(LOADER_ATTR)) setLoading(true)
    }
    const onShow = () => setLoading(false)
    document.addEventListener('click', onClick)
    document.addEventListener('submit', onSubmit)
    window.addEventListener('pageshow', onShow)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('submit', onSubmit)
      window.removeEventListener('pageshow', onShow)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(false)
      return
    }
    const show = window.setTimeout(() => setShown(true), DELAY_MS)
    const stop = window.setTimeout(() => setLoading(false), MAX_MS)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(stop)
    }
  }, [loading])

  if (!shown) return null

  return (
    <div className="nav-loader fixed inset-0 z-[90] flex flex-col items-center justify-center bg-surface/95" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="relative flex h-40 w-40 items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 300 300" className="nav-loader-atom absolute inset-0 h-full w-full" fill="none">
          {[0, 60, 120].map((tilt) => (
            <g key={tilt} transform={`rotate(${tilt} 150 150)`}>
              <path d="M10 150 A140 50 0 1 1 290 150 A140 50 0 1 1 10 150" stroke="#9cc2f2" strokeWidth="2.5" />
              <circle r="7" fill="#2580eb" className="nav-loader-dot" style={{ animationDelay: `${tilt * -8}ms` }} />
            </g>
          ))}
          <circle cx="150" cy="150" r="58" fill="#ffffff" />
        </svg>
        <Image src="/brand/logo-small-v4.webp" alt="" width={160} height={151} className="nav-loader-logo relative h-[40%] w-auto" />
      </div>
      <p className="mt-1 font-display text-3xl font-bold text-ink" aria-hidden="true">
        Bi<span className="text-cyan">Luna</span>
      </p>
      <svg viewBox="0 0 240 40" className="nav-loader-beat mt-3 h-7 w-44" fill="none" aria-hidden="true">
        <path
          d="M0 20 H70 L82 20 L90 6 L100 34 L110 12 L118 20 H240"
          stroke="#2580eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
      </svg>
    </div>
  )
}

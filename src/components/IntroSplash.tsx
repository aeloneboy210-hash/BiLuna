'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { INTRO_KEY as KEY } from '@/lib/ui/intro'
import { NETWORK_DOTS, NETWORK_LINES } from '@/lib/ui/intro-network'

const LENGTH_MS = 3300

/**
 * BiLuna's opening animation on the welcome page, in the style of the ad's end card but in the site's
 * flat white-and-blue look: a network of lines and dots, rings rippling out, the logo, the name and the
 * tagline, then a fade into the page (about 3 seconds). Shown once per visit, skippable, and never shown
 * to people who ask their device to reduce motion.
 *
 * The CSS animation fades it out on its own, so it can never get stuck. INTRO_GATE_SCRIPT (rendered by the
 * server right after it) hides it before the first paint when it was already seen, so there is no flash.
 */
export function IntroSplash({ tagline, skip }: { tagline: string; skip: string }) {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(KEY) === '1'
      sessionStorage.setItem(KEY, '1')
    } catch {
      // Storage can be blocked; the animation then simply plays.
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Already seen, or motion reduced: remove at once (it is already hidden before paint).
    const timer = window.setTimeout(() => setGone(true), seen || reduce ? 0 : LENGTH_MS)
    return () => window.clearTimeout(timer)
  }, [])

  if (gone) return null

  return (
    <div
      id="biluna-intro"
      className="intro-splash fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-surface"
      onClick={() => setGone(true)}
      aria-hidden="true"
    >
      {/* Network of lines and dots, drifting slowly. */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="intro-network pointer-events-none absolute inset-0 h-full w-full"
        fill="none"
      >
        <path d={NETWORK_LINES} stroke="#bcd6f6" strokeWidth="1.2" />
        {NETWORK_DOTS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? '#2580eb' : '#9cc2f2'} />
        ))}
      </svg>

      <div className="relative flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56">
        {/* Rings rippling out from the logo. */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="intro-ripple pointer-events-none absolute inset-0 rounded-full border-2 border-cyan"
            style={{ animationDelay: `${0.15 + i * 0.45}s` }}
          />
        ))}
        <svg viewBox="0 0 200 200" className="intro-orbit absolute inset-0 h-full w-full" fill="none">
          <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#dbeafc" strokeWidth="3" />
          <circle cx="100" cy="100" r="92" stroke="#2580eb" strokeWidth="3" strokeLinecap="round" className="intro-orbit-arc" />
          <circle cx="100" cy="8" r="6" fill="#2580eb" className="intro-orbit-dot" />
        </svg>
        <Image src="/brand/logo-v4.webp" alt="" width={512} height={482} priority className="intro-logo relative h-[62%] w-auto" />
      </div>

      <p className="intro-name relative mt-6 font-display text-5xl font-bold text-ink sm:text-6xl">
        Bi<span className="text-cyan">Luna</span>
      </p>
      <p className="intro-tagline relative mt-3 px-6 text-center text-xs font-semibold tracking-[0.28em] text-body uppercase sm:text-sm">
        {tagline}
      </p>
      <svg viewBox="0 0 240 40" className="intro-beat relative mt-5 h-8 w-56" fill="none">
        <path
          d="M0 20 H70 L82 20 L90 6 L100 34 L110 12 L118 20 H240"
          stroke="#2580eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
      </svg>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setGone(true)
        }}
        className="absolute right-5 bottom-6 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-body hover:bg-soft"
        tabIndex={-1}
      >
        {skip}
      </button>
    </div>
  )
}

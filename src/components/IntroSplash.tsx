'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { INTRO_KEY as KEY } from '@/lib/ui/intro'
import { NETWORK_DOTS, NETWORK_LINES } from '@/lib/ui/intro-network'

const LENGTH_MS = 3300

/**
 * BiLuna's opening animation on the welcome page, in the style of the ad's end card but in the site's
 * flat white-and-blue look: a network of lines and dots, still orbits around the logo, the name, the tagline and a heartbeat
 * line, then a fade into the page (about 3 seconds). Shown once per visit, skippable, and never shown
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

      <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
        {/* Three still, tilted orbits around the logo, drawn in once. */}
        <svg viewBox="0 0 300 300" className="intro-atom absolute inset-0 h-full w-full" fill="none">
          {[0, 60, 120].map((tilt) => (
            <path
              key={tilt}
              d="M10 150 A140 50 0 1 1 290 150 A140 50 0 1 1 10 150"
              transform={`rotate(${tilt} 150 150)`}
              stroke="#9cc2f2"
              strokeWidth="2"
              pathLength={1}
              className="intro-orbit-path"
            />
          ))}
          <circle cx="150" cy="150" r="58" fill="#ffffff" />
        </svg>
        <Image src="/brand/logo-v4.webp" alt="" width={512} height={482} priority className="intro-logo relative h-[38%] w-auto" />
      </div>

      <p className="intro-name relative mt-2 font-display text-5xl font-bold text-ink sm:text-6xl">
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

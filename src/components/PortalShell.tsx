import type { ReactNode } from 'react'
import { SampleTag } from './ui/SampleTag'

/** The common frame of every portal page: which portal this is, the page title, then the content. */
export function PortalShell({
  portalName,
  title,
  sampleLabel,
  children,
}: {
  portalName: string
  title: string
  sampleLabel?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold text-muted">{portalName}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        </div>
        {sampleLabel ? <SampleTag label={sampleLabel} /> : null}
      </div>
      {children}
    </div>
  )
}

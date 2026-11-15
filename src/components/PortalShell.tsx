import type { ReactNode } from 'react'
import type { IconName } from '@/lib/ui/icons'
import { Hero } from './Hero'

/** The common frame of every portal page: the hero, then the page's own content. */
export function PortalShell({
  icon,
  portalName,
  title,
  subtitle,
  sampleLabel,
  actions,
  children,
}: {
  icon: IconName
  portalName: string
  title: string
  subtitle: string
  sampleLabel?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <Hero
        icon={icon}
        eyebrow={portalName}
        title={title}
        subtitle={subtitle}
        sampleLabel={sampleLabel}
        actions={actions}
      />
      {children}
    </div>
  )
}

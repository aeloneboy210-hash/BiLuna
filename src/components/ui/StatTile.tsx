import type { IconName } from '@/lib/ui/icons'
import { Card } from './Card'
import { CountUp } from './CountUp'
import { IconTile } from './IconTile'

export function StatTile({
  value,
  label,
  icon,
  tone = 'brand',
}: {
  value: number
  label: string
  icon: IconName
  tone?: 'brand' | 'danger'
}) {
  return (
    <Card interactive className="flex items-center gap-4 p-5">
      <IconTile name={icon} tone={tone} />
      <div className="flex min-w-0 flex-col">
        <CountUp
          value={value}
          className={`font-display text-4xl leading-none font-bold ${tone === 'danger' ? 'text-danger' : 'text-gradient'}`}
        />
        <span className="mt-1.5 text-sm text-body">{label}</span>
      </div>
    </Card>
  )
}

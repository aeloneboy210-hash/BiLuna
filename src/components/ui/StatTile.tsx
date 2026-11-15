import { Card } from './Card'

export function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <span className="font-display text-4xl font-bold text-cyan">{value}</span>
      <span className="text-sm text-body">{label}</span>
    </Card>
  )
}

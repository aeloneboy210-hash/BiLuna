import { ICONS, type IconName } from '@/lib/ui/icons'

/** A brand line icon. Decorative by default; pass a label when the icon carries meaning on its own. */
export function Icon({
  name,
  className = 'h-6 w-6',
  label,
}: {
  name: IconName
  className?: string
  label?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ICONS[name].map((shape, i) =>
        shape.kind === 'path' ? (
          <path key={i} d={shape.d} />
        ) : shape.kind === 'circle' ? (
          <circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} />
        ) : (
          <rect key={i} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />
        ),
      )}
    </svg>
  )
}

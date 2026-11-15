/** Marks anything invented for the demo so it is never mistaken for real data. */
export function SampleTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/60 bg-warn/10 px-3 py-1 text-xs font-semibold text-warn">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warn" />
      {label}
    </span>
  )
}

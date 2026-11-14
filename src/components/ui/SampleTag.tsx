/** Marks anything invented for the demo so it is never mistaken for real data. */
export function SampleTag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-warn px-3 py-1 text-xs font-semibold text-warn">{label}</span>
  )
}

export function DemoBanner({ text }: { text: string }) {
  return (
    <div role="note" className="border-b border-line bg-banner px-3 py-2 text-center text-xs font-semibold text-ink sm:text-sm">
      {text}
    </div>
  )
}

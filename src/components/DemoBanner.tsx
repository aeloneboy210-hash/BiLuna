export function DemoBanner({ text }: { text: string }) {
  return (
    <div role="note" className="bg-ink px-3 py-2 text-center text-xs text-white sm:text-sm">
      {text}
    </div>
  )
}

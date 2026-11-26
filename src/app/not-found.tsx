import Link from 'next/link'
import { getDict } from '@/lib/i18n/server'

/** Any address that does not exist, in the visitor's language. The demo banner comes from the root layout. */
export default async function NotFound() {
  const { dict } = await getDict()
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">{dict.notFound.title}</h1>
      <p className="text-body">{dict.notFound.text}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 font-semibold text-on-brand hover:bg-aqua"
      >
        {dict.notFound.home}
      </Link>
    </main>
  )
}

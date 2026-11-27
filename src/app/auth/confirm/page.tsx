import type { Metadata } from 'next'
import { confirmEmailLink } from '@/app/(site)/sign-in/actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Finish signing in', robots: { index: false } }

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '')

/**
 * Where the links in BiLuna's emails land (confirm your email, choose a new password). Nothing happens
 * until the person taps Continue; the tap signs them in (see confirmEmailLink).
 */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { dict } = await getDict()
  const p = await searchParams
  return (
    <main id="content" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{dict.auth.continueTitle}</h1>
        <p className="text-body">{dict.auth.continueText}</p>
        <form action={confirmEmailLink} data-page-loader="">
          <input type="hidden" name="token_hash" value={one(p.token_hash)} />
          <input type="hidden" name="code" value={one(p.code)} />
          <input type="hidden" name="type" value={one(p.type)} />
          <input type="hidden" name="next" value={one(p.next)} />
          <Button type="submit" className="w-full">
            {dict.auth.continue}
          </Button>
        </form>
      </Card>
    </main>
  )
}

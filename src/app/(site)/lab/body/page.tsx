import type { Metadata } from 'next'
import { BodyLab } from '@/components/body/BodyLab'
import { getDict } from '@/lib/i18n/server'

export const metadata: Metadata = { title: '3D body test', robots: { index: false } }

/** A test page for choosing the 3D body. Not linked from the menu. */
export default async function BodyLabPage() {
  const { lang } = await getDict()
  return <BodyLab lang={lang} />
}

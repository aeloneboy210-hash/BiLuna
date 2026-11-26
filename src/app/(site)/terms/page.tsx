import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { getDict } from '@/lib/i18n/server'
import { TERMS, UPDATED } from '@/lib/legal/content'

export const metadata: Metadata = { title: 'Terms of Use' }

export default async function TermsPage() {
  const { lang, dict } = await getDict()
  return <LegalPage page={TERMS[lang]} updatedLabel={dict.legal.updated} updated={UPDATED[lang]} />
}

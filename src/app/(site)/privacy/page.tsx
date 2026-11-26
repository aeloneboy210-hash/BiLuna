import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { getDict } from '@/lib/i18n/server'
import { PRIVACY, UPDATED } from '@/lib/legal/content'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default async function PrivacyPage() {
  const { lang, dict } = await getDict()
  return <LegalPage page={PRIVACY[lang]} updatedLabel={dict.legal.updated} updated={UPDATED[lang]} />
}

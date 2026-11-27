import type { Lang } from '@/lib/i18n/lang'

/**
 * BiLuna's guideline cards: the part the chat screen needs (title and sources). The card text the AI reads is in
 * content.ts, which only the server loads. Each card is written in plain words from the pages listed under it.
 */
export type CardId =
  | 'fever'
  | 'dengue'
  | 'diarrhoea'
  | 'cold'
  | 'pneumonia'
  | 'gastric'
  | 'headache'
  | 'bloodPressure'
  | 'diabetes'
  | 'pregnancy'
  | 'childDanger'
  | 'typhoid'
  | 'jaundice'
  | 'skin'
  | 'asthma'
  | 'anaemia'
  | 'uti'
  | 'allergy'
  | 'backPain'
  | 'stress'

export type Source = { name: string; url: string }

export type CardMeta = {
  id: CardId
  title: Record<Lang, string>
  sources: Source[]
  /** True only once a doctor has read and approved the card. */
  reviewed: boolean
}

const WHO = (slug: string) => `https://www.who.int/news-room/fact-sheets/detail/${slug}`

export const CATALOG: CardMeta[] = [
  {
    id: 'fever',
    title: { en: 'Fever', bn: 'জ্বর' },
    sources: [{ name: 'NHS — High temperature (fever) in adults', url: 'https://www.nhs.uk/conditions/fever-in-adults/' }],
    reviewed: false,
  },
  {
    id: 'dengue',
    title: { en: 'Dengue', bn: 'ডেঙ্গু' },
    sources: [{ name: 'WHO — Dengue and severe dengue', url: WHO('dengue-and-severe-dengue') }],
    reviewed: false,
  },
  {
    id: 'diarrhoea',
    title: { en: 'Diarrhoea and ORS', bn: 'ডায়রিয়া ও স্যালাইন' },
    sources: [{ name: 'WHO — Diarrhoea', url: 'https://www.who.int/health-topics/diarrhoea' }],
    reviewed: false,
  },
  {
    id: 'cold',
    title: { en: 'Cough and cold', bn: 'সর্দি-কাশি' },
    sources: [{ name: 'NHS — Common cold', url: 'https://www.nhs.uk/conditions/common-cold/' }],
    reviewed: false,
  },
  {
    id: 'pneumonia',
    title: { en: 'Pneumonia signs', bn: 'নিউমোনিয়ার লক্ষণ' },
    sources: [
      { name: 'WHO — Pneumonia in children', url: WHO('pneumonia') },
      { name: 'UNICEF — Pneumonia in children', url: 'https://www.unicef.org/stories/childhood-pneumonia-explained' },
    ],
    reviewed: false,
  },
  {
    id: 'gastric',
    title: { en: 'Gastric, acidity and heartburn', bn: 'গ্যাস্ট্রিক, অ্যাসিডিটি ও বুক জ্বালা' },
    sources: [
      { name: 'NHS — Indigestion', url: 'https://www.nhs.uk/conditions/indigestion/' },
      { name: 'NHS — Heartburn and acid reflux', url: 'https://www.nhs.uk/conditions/heartburn-and-acid-reflux/' },
    ],
    reviewed: false,
  },
  {
    id: 'headache',
    title: { en: 'Headache', bn: 'মাথাব্যথা' },
    sources: [{ name: 'WHO — Migraine and other headache disorders', url: WHO('headache-disorders') }],
    reviewed: false,
  },
  {
    id: 'bloodPressure',
    title: { en: 'High blood pressure', bn: 'উচ্চ রক্তচাপ' },
    sources: [{ name: 'WHO — Hypertension', url: WHO('hypertension') }],
    reviewed: false,
  },
  {
    id: 'diabetes',
    title: { en: 'Diabetes', bn: 'ডায়াবেটিস' },
    sources: [{ name: 'WHO — Diabetes', url: WHO('diabetes') }],
    reviewed: false,
  },
  {
    id: 'pregnancy',
    title: { en: 'Danger signs in pregnancy', bn: 'গর্ভাবস্থার বিপদ চিহ্ন' },
    sources: [{ name: 'CDC — Urgent maternal warning signs', url: 'https://www.cdc.gov/hearher/maternal-warning-signs/' }],
    reviewed: false,
  },
  {
    id: 'childDanger',
    title: { en: 'Danger signs in a sick child', bn: 'অসুস্থ শিশুর বিপদ চিহ্ন' },
    sources: [
      { name: 'WHO — Integrated Management of Childhood Illness chart', url: 'https://applications.emro.who.int/dsaf/libcat/EMRDOC_16_EN.pdf' },
    ],
    reviewed: false,
  },
  {
    id: 'typhoid',
    title: { en: 'Typhoid', bn: 'টাইফয়েড' },
    sources: [{ name: 'WHO — Typhoid', url: WHO('typhoid') }],
    reviewed: false,
  },
  {
    id: 'jaundice',
    title: { en: 'Jaundice', bn: 'জন্ডিস' },
    sources: [{ name: 'WHO — Hepatitis E', url: WHO('hepatitis-e') }],
    reviewed: false,
  },
  {
    id: 'skin',
    title: { en: 'Itchy skin and scabies', bn: 'চুলকানি ও খোসপাঁচড়া' },
    sources: [{ name: 'WHO — Scabies', url: WHO('scabies') }],
    reviewed: false,
  },
  {
    id: 'asthma',
    title: { en: 'Asthma', bn: 'হাঁপানি' },
    sources: [{ name: 'WHO — Asthma', url: WHO('asthma') }],
    reviewed: false,
  },
  {
    id: 'anaemia',
    title: { en: 'Anaemia', bn: 'রক্তস্বল্পতা' },
    sources: [{ name: 'WHO — Anaemia', url: WHO('anaemia') }],
    reviewed: false,
  },
  {
    id: 'uti',
    title: { en: 'Urine infection', bn: 'প্রস্রাবের সংক্রমণ' },
    sources: [{ name: 'NHS — Urinary tract infections', url: 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/' }],
    reviewed: false,
  },
  {
    id: 'allergy',
    title: { en: 'Allergy', bn: 'অ্যালার্জি' },
    sources: [
      { name: 'NHS — Allergies', url: 'https://www.nhs.uk/conditions/allergies/' },
      { name: 'NHS — Anaphylaxis', url: 'https://www.nhs.uk/conditions/anaphylaxis/' },
    ],
    reviewed: false,
  },
  {
    id: 'backPain',
    title: { en: 'Back pain', bn: 'কোমর ও পিঠে ব্যথা' },
    sources: [{ name: 'WHO — Low back pain', url: WHO('low-back-pain') }],
    reviewed: false,
  },
  {
    id: 'stress',
    title: { en: 'Stress and worry', bn: 'মানসিক চাপ ও দুশ্চিন্তা' },
    sources: [{ name: 'WHO — Stress', url: 'https://www.who.int/news-room/questions-and-answers/item/stress' }],
    reviewed: false,
  },
]

const BY_ID = new Map(CATALOG.map((c) => [c.id, c]))
export const cardMeta = (id: string): CardMeta | undefined => BY_ID.get(id as CardId)

/** Under an answer BiLuna stores which cards it read, as [[sources: dengue, fever]]; the screen turns that into links. */
const TAG = /\[\[\s*sources\s*:([^\]]*)\]\]/gi

export const sourcesTag = (ids: CardId[]) => `[[sources: ${ids.join(', ')}]]`

/** Removes every [[sources:…]] tag and returns the known card ids from the first one. */
export function extractSources(text: string): { text: string; ids: CardId[] } {
  let ids: CardId[] = []
  const clean = text.replace(TAG, (_, list: string) => {
    if (!ids.length) {
      ids = list
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is CardId => BY_ID.has(s as CardId))
        .filter((s, i, all) => all.indexOf(s) === i)
    }
    return ''
  })
  return { text: clean.replace(/\n{3,}/g, '\n\n').trim(), ids }
}

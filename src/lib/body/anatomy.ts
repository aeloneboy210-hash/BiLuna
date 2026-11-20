import type { Lang } from '@/lib/i18n/lang'
import type { OrganId } from './regions'

/** One bone or organ in the 3D anatomy model (public/models/anatomy/parts-v1.json). */
export type AnatomyPart = {
  id: string
  /** English anatomical name, as in Z-Anatomy. */
  name: string
  side: 'left' | 'right' | null
  group: string
  layer: 'skeleton' | 'organs'
  file: string
}

/** Group names in English and Bangla. Bone and organ names stay in English, as medical students learn them. */
export const GROUP_NAMES: Record<string, { en: string; bn: string }> = {
  Cranium: { en: 'Bones of the skull', bn: 'মাথার খুলির হাড়' },
  'Extracranial bones of head': { en: 'Bones of the head', bn: 'মাথার হাড়' },
  Teeth: { en: 'Teeth', bn: 'দাঁত' },
  'Auditory ossicles': { en: 'Ear bones', bn: 'কানের হাড়' },
  'Vertebral column': { en: 'Spine', bn: 'মেরুদণ্ড' },
  'Thoracic skeleton': { en: 'Ribs and breastbone', bn: 'পাঁজর ও বুকের হাড়' },
  'Bones of upper limb': { en: 'Bones of the arm', bn: 'হাতের হাড়' },
  'Bones of hand': { en: 'Bones of the hand', bn: 'হাতের পাতার হাড়' },
  'Bony pelvis': { en: 'Hip bones', bn: 'নিতম্বের হাড়' },
  'Bones of lower limb': { en: 'Bones of the leg and foot', bn: 'পা ও পায়ের পাতার হাড়' },
  Cartilages: { en: 'Cartilage', bn: 'তরুণাস্থি' },
  Heart: { en: 'Heart', bn: 'হৃৎপিণ্ড' },
  Brain: { en: 'Brain', bn: 'মস্তিষ্ক' },
  Eye: { en: 'Eye', bn: 'চোখ' },
  'Nervous system': { en: 'Nervous system', bn: 'স্নায়ুতন্ত্র' },
  'Respiratory system': { en: 'Breathing system', bn: 'শ্বসনতন্ত্র' },
  'Digestive system': { en: 'Digestive system', bn: 'পরিপাকতন্ত্র' },
  'Urinary system': { en: 'Urinary system', bn: 'মূত্রতন্ত্র' },
  'Genital systems': { en: 'Reproductive system', bn: 'প্রজননতন্ত্র' },
  'Endocrine glands': { en: 'Hormone glands', bn: 'হরমোন গ্রন্থি' },
  'Lymphoid system': { en: 'Lymph nodes', bn: 'লসিকা গ্রন্থি' },
  'Abdominopelvic cavity': { en: 'Lining of the belly', bn: 'পেটের আবরণ' },
}

const SIDE = { en: { left: 'left', right: 'right' }, bn: { left: 'বাম', right: 'ডান' } }

/** "Femur (left) · Bones of the leg and foot" */
export function describePart(p: AnatomyPart, lang: Lang): string {
  const side = p.side ? ` (${SIDE[lang][p.side]})` : ''
  const group = GROUP_NAMES[p.group]?.[lang] ?? p.group
  return `${p.name}${side} · ${group}`
}

const ORGAN_MATCH: Record<OrganId, (p: AnatomyPart) => boolean> = {
  brain: (p) => p.group === 'Brain',
  trachea: (p) => p.name === 'Trachea',
  lungs: (p) => / lobe of (left|right) lung$/.test(p.name),
  heart: (p) => /^(Left|Right) (atrium|ventricle)$/.test(p.name),
  liver: (p) => p.name === 'Liver' || / of liver \(/.test(p.name),
  stomach: (p) => p.name === 'Stomach' || p.name === 'Mucosa of stomach',
  intestines: (p) => /colon$|^Duodenum$|^Vermiform appendix$/.test(p.name),
  pancreas: (p) => p.name === 'Pancreas',
  spleen: (p) => p.name === 'Spleen',
  gallbladder: (p) => p.name === 'Gallbladder',
  bladder: (p) => p.name === 'Urinary bladder',
  kidneys: (p) => p.name === 'Kidney' || p.name === 'Renal pelvis',
}

/** The part ids to light up for an organ name, or for one part id. */
export function partsFor(target: OrganId | string, parts: AnatomyPart[]): string[] {
  const match = ORGAN_MATCH[target as OrganId]
  if (match) return parts.filter(match).map((p) => p.id)
  return parts.some((p) => p.id === target) ? [target] : []
}

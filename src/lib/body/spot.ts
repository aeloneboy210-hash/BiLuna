import type { Lang } from '@/lib/i18n/lang'
import type { AnatomyPart } from './anatomy'

/**
 * Where on a part the finger landed, inside the part's own box.
 * u: -1 patient's right … 1 patient's left; v: 0 bottom … 1 top; w: 0 back … 1 front.
 */
export type Spot = { u: number; v: number; w: number }

const WORDS = {
  en: {
    left: 'left',
    right: 'right',
    upper: 'upper',
    lower: 'lower',
    middle: 'middle',
    part: 'part',
    half: 'half',
    lobes: { frontal: 'frontal lobe', parietal: 'parietal lobe', temporal: 'temporal lobe', occipital: 'occipital lobe' },
  },
  bn: {
    left: 'বাম',
    right: 'ডান',
    upper: 'উপরের',
    lower: 'নিচের',
    middle: 'মাঝের',
    part: 'অংশ',
    half: 'অর্ধেক',
    lobes: {
      frontal: 'ফ্রন্টাল লোব (সম্মুখ অংশ)',
      parietal: 'প্যারাইটাল লোব (উপরের অংশ)',
      temporal: 'টেম্পোরাল লোব (পাশের অংশ)',
      occipital: 'অক্সিপিটাল লোব (পেছনের অংশ)',
    },
  },
} as const

/** The cerebrum's lobe under the finger: front is frontal, back is occipital, low sides temporal, top parietal. */
function lobe(s: Spot): keyof (typeof WORDS)['en']['lobes'] {
  if (s.w >= 0.62) return 'frontal'
  if (s.w <= 0.28) return 'occipital'
  if (s.v < 0.45) return 'temporal'
  return 'parietal'
}

/** A short name for the spot on the part, such as "left frontal lobe" or "upper right part". */
export function spotName(part: AnatomyPart, s: Spot, lang: Lang): string {
  const w = WORDS[lang]
  const side = s.u >= 0 ? w.left : w.right
  if (part.name === 'Cerebrum') return `${side} ${w.lobes[lobe(s)]}`
  if (part.name === 'Cerebellum') return `${side} ${w.half}`
  const height = s.v >= 0.66 ? w.upper : s.v <= 0.33 ? w.lower : w.middle
  const across = s.u >= 0.33 ? w.left : s.u <= -0.33 ? w.right : ''
  if (!across) return `${height} ${w.part}`
  // "middle left part" reads oddly; a side alone is clearer in the middle band.
  return height === w.middle ? `${across} ${w.part}` : `${height} ${across} ${w.part}`
}

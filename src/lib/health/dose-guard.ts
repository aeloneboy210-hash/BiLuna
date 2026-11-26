/**
 * BiLuna never tells anyone how much medicine to take. This finds dose amounts in a reply (mg, ml, tablet
 * counts, "1+0+1" schedules, spoons) in English or Bangla, so a reply that invents one can be retried.
 * A dose the patient wrote themselves, or one read from their own uploaded prescription, may be repeated.
 */

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
const toLatin = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))

const NUM = String.raw`(\d+(?:\.\d+)?)`
const PATTERNS: [RegExp, (m: RegExpExecArray) => string][] = [
  [new RegExp(String.raw`${NUM}\s*(?:mcg|µg|মাইক্রোগ্রাম)`, 'gi'), (m) => `${m[1]}mcg`],
  [new RegExp(String.raw`${NUM}\s*(?:mg\b(?!\s*\/\s*d?l\b)|মি\.?\s?গ্রা(?:ম)?|মিলিগ্রাম)`, 'gi'), (m) => `${m[1]}mg`],
  [new RegExp(String.raw`${NUM}\s*(?:ml\b|মিলি(?:লিটার)?|এমএল)`, 'gi'), (m) => `${m[1]}ml`],
  [new RegExp(String.raw`${NUM}\s*(?:iu\b(?!\s*\/\s*d?l\b)|আইইউ)`, 'gi'), (m) => `${m[1]}iu`],
  [
    new RegExp(String.raw`(\d+)\s*(?:টি|টা)?\s*(?:tablets?\b|tabs?\b|capsules?\b|caps?\b|pills?\b|ট্যাবলেট|ক্যাপসুল|বড়ি)`, 'gi'),
    (m) => `${m[1]}tablet`,
  ],
  [new RegExp(String.raw`(?<![\d/])(\d)\s*\+\s*(\d)\s*\+\s*(\d)(?![\d/])`, 'g'), (m) => `${m[1]}+${m[2]}+${m[3]}`],
  [new RegExp(String.raw`${NUM}\s*(?:teaspoons?\b|tablespoons?\b|tsp\b|tbsp\b|চামচ)`, 'gi'), (m) => `${m[1]}spoon`],
]

/** Every dose amount in the text, in reading order, written the same way whatever the language. */
export function dosesIn(text: string): string[] {
  const t = toLatin(text)
  const found: { at: number; dose: string }[] = []
  for (const [re, name] of PATTERNS) {
    re.lastIndex = 0
    for (let m = re.exec(t); m; m = re.exec(t)) found.push({ at: m.index, dose: name(m) })
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.dose)
}

/** Doses in BiLuna's reply that are not already in the given text (the chat so far). */
export function unexplainedDoses(reply: string, patientText: string): string[] {
  const own = new Set(dosesIn(patientText))
  return dosesIn(reply).filter((d) => !own.has(d))
}

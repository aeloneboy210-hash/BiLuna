/**
 * BiLuna never tells anyone how much medicine to take. This finds dose amounts in a reply (mg, ml, tablet
 * counts, "1+0+1" or "1-0-1" schedules, spoons, drops, puffs, grams) in English or Bangla, so a reply that invents one can be retried.
 * A dose the patient wrote themselves, or one read from their own uploaded prescription, may be repeated.
 */

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

/** The words a dose amount can be followed by, used to read number words only when they are a dose. */
const UNIT_AHEAD = String.raw`(?=\s*(?:টি|টা)?\s*(?:(?:tablets?|tabs?|capsules?|caps?|pills?|teaspoons?|tablespoons?|tsp|tbsp|drops?|puffs?|sachets?)\b|ট্যাবলেট|ক্যাপসুল|বড়ি|চামচ|ফোঁটা|স্যাশে|প্যাকেট))`
const WORD_NUMBERS: [RegExp, string][] = [
  [/\bhalf (?:an? )?/gi, '0.5 '],
  [/½\s*/g, '0.5 '],
  [/¼\s*/g, '0.25 '],
  [/(?<![\d/.])1\s*\/\s*2(?![\d/])/g, '0.5'],
  [/(?<![\d/.])1\s*\/\s*4(?![\d/])/g, '0.25'],
  [/আধা?\s+/g, '0.5 '],
  [new RegExp(String.raw`\bone${UNIT_AHEAD}`, 'gi'), '1'],
  [new RegExp(String.raw`\btwo${UNIT_AHEAD}`, 'gi'), '2'],
  [new RegExp(String.raw`\bthree${UNIT_AHEAD}`, 'gi'), '3'],
  [new RegExp(String.raw`\bfour${UNIT_AHEAD}`, 'gi'), '4'],
  [new RegExp(String.raw`এক(?:টি|টা)?${UNIT_AHEAD}`, 'g'), '1'],
  [new RegExp(String.raw`দু(?:ই|টি|টো|টা|ইটা)${UNIT_AHEAD}`, 'g'), '2'],
  [new RegExp(String.raw`তিন(?:টি|টা)?${UNIT_AHEAD}`, 'g'), '3'],
  [new RegExp(String.raw`চার(?:টি|টা)?${UNIT_AHEAD}`, 'g'), '4'],
]

/** The same amount written the same way: Bangla digits, "1,000", ".5", "half", "½", "1/2", "two", "দুটি". */
function normalize(text: string): string {
  let t = text
    .normalize('NFC')
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
  for (const [re, to] of WORD_NUMBERS) t = t.replace(re, to)
  return t
}

const NUM = String.raw`((?:\d+)?\.?\d+)`
const amount = (n: string) => String(Number(n))
const PATTERNS: [RegExp, (m: RegExpExecArray) => string][] = [
  [new RegExp(String.raw`${NUM}\s*(?:mcg|µg|micrograms?\b|মাইক্রোগ্রাম)`, 'gi'), (m) => `${amount(m[1])}mcg`],
  [
    new RegExp(String.raw`${NUM}\s*(?:(?:mg|milligrams?)\b(?!\s*\/\s*d?l\b)|মি\.?\s?গ্রা(?:ম)?|মিলিগ্রাম)`, 'gi'),
    (m) => `${amount(m[1])}mg`,
  ],
  [new RegExp(String.raw`${NUM}\s*(?:(?:g|gm|gms|grams?)\b(?!\s*\/)(?!\s+(?:of|fiber|fibre|protein|sugar|fat|carbs?|salt|network|data)\b)|গ্রাম)`, 'gi'), (m) => `${amount(m[1])}g`],
  [new RegExp(String.raw`${NUM}\s*(?:(?:ml|cc)\b(?!\s*\/)|মিলি(?!গ্রাম)(?:লিটার)?|এমএল)`, 'gi'), (m) => `${amount(m[1])}ml`],
  [new RegExp(String.raw`${NUM}\s*(?:iu\b(?!\s*\/\s*d?l\b)(?!\s*\/\s*l\b)|আইইউ)`, 'gi'), (m) => `${amount(m[1])}iu`],
  [
    new RegExp(String.raw`${NUM}\s*(?:টি|টা)?\s*(?:tablets?\b|tabs?\b|capsules?\b|caps?\b|pills?\b|ট্যাবলেট|ক্যাপসুল|বড়ি)`, 'gi'),
    (m) => `${amount(m[1])}tablet`,
  ],
  [
    new RegExp(String.raw`(?<![\d/.\-+])(\d)\s*\+\s*(\d)\s*\+\s*(\d)(?![\d/\-+]|\.\d)`, 'g'),
    (m) => `${m[1]}+${m[2]}+${m[3]}`,
  ],
  // The dash form ("1-0-1") only with 0, 1 or 2 per time of day, so "4-7-8 breathing" or "3-2-1" is not one.
  [
    new RegExp(String.raw`(?<![\d/.\-+])([0-2])\s*-\s*([0-2])\s*-\s*([0-2])(?![\d/\-+]|\.\d)`, 'g'),
    (m) => `${m[1]}+${m[2]}+${m[3]}`,
  ],
  [new RegExp(String.raw`${NUM}\s*(?:teaspoons?\b|tablespoons?\b|tsp\b|tbsp\b|চামচ)`, 'gi'), (m) => `${amount(m[1])}spoon`],
  [new RegExp(String.raw`${NUM}\s*(?:drops?\b|ফোঁটা)`, 'gi'), (m) => `${amount(m[1])}drop`],
  [new RegExp(String.raw`${NUM}\s*(?:puffs?\b|চাপ)`, 'gi'), (m) => `${amount(m[1])}puff`],
  [new RegExp(String.raw`${NUM}\s*(?:sachets?\b|স্যাশে|প্যাকেট)`, 'gi'), (m) => `${amount(m[1])}sachet`],
]

/** Every dose amount in the text, in reading order, written the same way whatever the language. */
export function dosesIn(text: string): string[] {
  const t = normalize(text)
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

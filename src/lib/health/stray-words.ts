/**
 * Some open models slip a word from another language into Bangla ("জ্বর menurunkan ব্যবহৃত হয়").
 * Finds lowercase Latin-letter words of 4+ letters sitting between two Bangla words, outside brackets.
 * Capitalised names (Napa, Ace) and words in brackets ("(Paracetamol)") are allowed.
 */
const BANGLA = /[ঀ-৿]/

/** English medical words Bangla speakers use as they are; not a slip. */
const MEDICAL = new Set(
  'paracetamol dengue typhoid malaria covid corona virus viral fever tablet capsule syrup saline ors test report doctor pharmacist hospital emergency pressure sugar diabetes asthma allergy antibiotic vitamin calcium iron insulin gastric acidity infection migraine stroke cancer ultrasound xray scan blood urine cough cold'.split(' '),
)

export function strayWords(text: string): string[] {
  const noBrackets = text.replace(/\([^)]*\)/g, ' ')
  const tokens = noBrackets.split(/\s+/).filter(Boolean)
  const found: string[] = []
  for (let i = 1; i < tokens.length - 1; i++) {
    // Quotes and a Bangla ending joined with a hyphen ("menurunkan-এর") are taken off before the check.
    const word = tokens[i].replace(/^["'“‘(]+/, '').replace(/-[ঀ-৿]+$/, '').replace(/["'”’).,;:!?।]+$/, '')
    if (/^[a-z]{4,}$/.test(word) && !MEDICAL.has(word) && BANGLA.test(tokens[i - 1]) && BANGLA.test(tokens[i + 1])) found.push(word)
  }
  return found
}

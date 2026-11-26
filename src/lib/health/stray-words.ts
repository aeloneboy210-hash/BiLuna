/**
 * Some open models slip a word from another language into Bangla ("জ্বর menurunkan ব্যবহৃত হয়").
 * Finds lowercase Latin-letter words of 4+ letters sitting between two Bangla words, outside brackets.
 * Capitalised names (Napa, Ace) and words in brackets ("(Paracetamol)") are allowed.
 */
const BANGLA = /[ঀ-৿]/

export function strayWords(text: string): string[] {
  const noBrackets = text.replace(/\([^)]*\)/g, ' ')
  const tokens = noBrackets.split(/\s+/).filter(Boolean)
  const found: string[] = []
  for (let i = 1; i < tokens.length - 1; i++) {
    const word = tokens[i].replace(/[.,;:!?।]+$/, '')
    if (/^[a-z]{4,}$/.test(word) && BANGLA.test(tokens[i - 1]) && BANGLA.test(tokens[i + 1])) found.push(word)
  }
  return found
}

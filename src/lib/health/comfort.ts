/**
 * Stock comfort lines ("I'm here with you", "আমি আপনার পাশে আছি") feel empty when they open every reply, and
 * testers said so (November). After BiLuna's first reply in a chat, a reply that still opens with them loses
 * those opening sentences. Only these set phrases count; a sentence that answers a feeling the patient named
 * in other words stays.
 */
const STOCK = [
  /\bI(?:['’]m| am) (?:here (?:with|for) you|right here)\b/i,
  /\bI (?:can )?understand\b/i,
  /\b(?:I['’]m|I am) (?:so |very |really )?sorry (?:to hear|you(?:['’]re| are))/i,
  /\bthat (?:sounds|must be|must feel) (?:really |very |so |quite )?(?:uncomfortable|painful|tough|hard|difficult|draining|exhausting|worrying|frustrating|unpleasant|tiring|awful)/i,
  /পাশে আছি/,
  /বুঝতে পারছি/,
  /শুনে (?:খুব |অনেক )?(?:খারাপ|কষ্ট) (?:লাগছে|লাগল)/,
  /নিশ্চয়ই (?:খুব |অনেক )?(?:অস্বস্তি|কষ্ট|খারাপ)/,
  /(?:দুঃখিত|দুঃখ পেলাম)/,
]

/** The first sentence of a paragraph: up to and including its end mark (. ! ? or the Bangla ।). */
const FIRST_SENTENCE = /^[^.!?।\n]*[.!?।]+\s*/u

export function dropStockOpeners(text: string): string {
  let rest = text.trimStart()
  // At most the first two sentences, and only while each is a stock line.
  for (let i = 0; i < 2; i++) {
    const m = FIRST_SENTENCE.exec(rest)
    if (!m || !STOCK.some((re) => re.test(m[0]))) break
    const after = rest.slice(m[0].length)
    // Never leave a reply with nothing in it.
    if (!after.trim()) break
    rest = after.trimStart()
  }
  return rest
}

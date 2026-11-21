/**
 * Tap-to-answer buttons: BiLuna may end a reply with [[options: A | B | C]], short answers to its
 * question that the patient can send with one tap. At most 4, each under 40 characters.
 */
const TAG = /\[\[\s*options\s*:([^\]]*)\]\]/gi
const MAX = 4
const MAX_LEN = 40

export const optionsTag = (options: string[]) => `[[options: ${options.join(' | ')}]]`

export function extractOptions(text: string): { text: string; options: string[] } {
  let options: string[] = []
  const clean = text.replace(TAG, (_, list: string) => {
    if (!options.length) {
      options = list
        .split('|')
        .map((o) => o.trim())
        .filter((o) => o && o.length <= MAX_LEN)
        .slice(0, MAX)
    }
    return ''
  })
  return { text: clean.replace(/\n{3,}/g, '\n\n').trim(), options }
}

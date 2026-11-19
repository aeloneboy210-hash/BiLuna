import { readFileSync } from 'node:fs'
import path from 'node:path'

// The theme lives in CSS, so this reads the tokens straight from the stylesheet
// and checks that every text/background pair the app uses is readable.
const css = readFileSync(path.resolve(__dirname, '../../src/app/globals.css'), 'utf8')

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`theme token --color-${name} is missing`)
  return match[1]
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('palette follows the BiLuna logo', () => {
  expect(token('surface').toLowerCase()).toBe('#ffffff') // white page and cards
  expect(token('ink').toLowerCase()).toBe('#0c2a5c') // logo navy
  expect(token('cyan').toLowerCase()).toBe('#2580eb') // logo blue
  expect(token('tint').toLowerCase()).toBe('#dbeafc') // logo light blue
})

test('the theme is flat: no gradients or glows in the stylesheet', () => {
  expect(css).not.toMatch(/gradient\(/)
})

test.each([
  ['ink', 'ground'], ['ink', 'surface'], ['ink', 'soft'], ['ink', 'banner'], ['muted', 'soft'],
  ['body', 'ground'], ['body', 'surface'], ['body', 'soft'],
  ['muted', 'ground'], ['muted', 'surface'],
  ['brand', 'ground'], ['brand', 'surface'], ['brand', 'soft'],
  ['aqua', 'surface'], ['ink', 'tint'], ['body', 'tint'],
  ['on-brand', 'brand'], ['on-brand', 'aqua'], ['on-brand', 'ink'], ['tint', 'ink'],
  ['danger', 'surface'], ['warn', 'surface'], ['warn', 'ground'], ['ok', 'surface'], ['warn', 'soft'],
])('%s text on %s is readable (4.5:1)', (fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
})

test.each([['field', 'surface'], ['brand', 'surface'], ['cyan', 'surface'], ['cyan', 'soft']])('%s border on %s is visible (3:1)', (fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3)
})

test('fonts follow the brand board', () => {
  expect(css).toMatch(/--font-display:\s*"Space Grotesk Variable"/)
  expect(css).toMatch(/--font-sans:\s*"Manrope Variable"/)
})

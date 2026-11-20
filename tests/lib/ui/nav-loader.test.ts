import { isPageChange } from '@/lib/ui/nav-loader'

const here = 'https://biluna.vercel.app/patient'
const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }

test('a plain click on a link to another page shows the loader', () => {
  expect(isPageChange({ href: 'https://biluna.vercel.app/patient/health', current: here, ...click })).toBe(true)
  expect(isPageChange({ href: 'https://biluna.vercel.app/patient?tab=x', current: here, ...click })).toBe(true)
})

test('same page, hash links, other sites, new tabs, downloads and modifier clicks do not', () => {
  expect(isPageChange({ href: here, current: here, ...click })).toBe(false)
  expect(isPageChange({ href: `${here}#top`, current: here, ...click })).toBe(false)
  expect(isPageChange({ href: 'https://example.com/', current: here, ...click })).toBe(false)
  expect(isPageChange({ href: 'https://biluna.vercel.app/x', current: here, ...click, target: '_blank' })).toBe(false)
  expect(isPageChange({ href: 'https://biluna.vercel.app/x', current: here, ...click, download: true })).toBe(false)
  expect(isPageChange({ href: 'https://biluna.vercel.app/x', current: here, ...click, ctrlKey: true })).toBe(false)
  expect(isPageChange({ href: 'https://biluna.vercel.app/x', current: here, ...click, button: 1 })).toBe(false)
  expect(isPageChange({ href: 'mailto:a@b.c', current: here, ...click })).toBe(false)
})

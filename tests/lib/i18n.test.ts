import { dictionaries } from '@/lib/i18n/dictionaries'
import { parseLang } from '@/lib/i18n/lang'

const leaves = (o: object, p = ''): [string, unknown][] =>
  Object.entries(o).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? leaves(v, `${p}${k}.`) : [[`${p}${k}`, v] as [string, unknown]],
  )

test('Bangla has exactly the English keys', () => {
  const keys = (o: object) => leaves(o).map(([k]) => k).sort()
  expect(keys(dictionaries.bn)).toEqual(keys(dictionaries.en))
})
test('no empty strings in either language', () => {
  for (const d of [dictionaries.en, dictionaries.bn]) {
    for (const [key, value] of leaves(d)) {
      expect(typeof value, key).toBe('string')
      expect((value as string).trim(), key).not.toBe('')
    }
  }
})
test('banner copy is exact', () => {
  expect(dictionaries.en.banner).toBe('Demo — fictional data — not medical advice')
  expect(dictionaries.bn.banner).toBe('ডেমো — কাল্পনিক তথ্য — চিকিৎসা পরামর্শ নয়')
})
test('English description is the approved text', () => {
  expect(dictionaries.en.description).toBe(
    "BiLuna — your personal healthcare AI companion. Feeling sick? Just tell me how you feel. I'll help you understand what might be going on, explain it in simple words, and show it to you in 3D. I'll tell you how to stay safe and when to see a doctor. Give me a medicine name and I'll explain what it's for. Worried about finding a good hospital or doctor? I'll find ones near you that fit your need and help you request an appointment. I'll help you choose the most affordable option too. And that's not all: you can learn about health and medicine with me, and get help with your research.",
  )
})
test('portal names are exact in English', () => {
  expect(dictionaries.en.portals.patient.name).toBe('Patient Portal')
  expect(dictionaries.en.portals.doctor.name).toBe('Healthcare Professional Portal')
  expect(dictionaries.en.portals.org_admin.name).toBe('Hospitals & Organizations Portal')
})
test.each([undefined, '', 'fr', 'EN', 'BN', '<script>', 'bn '])('parseLang(%p) is en', (v) => {
  expect(parseLang(v)).toBe('en')
})
test('parseLang keeps bn', () => expect(parseLang('bn')).toBe('bn'))

import parts from '../../../public/models/anatomy/parts-v1.json'
import { GROUP_NAMES, describePart, partsFor, type AnatomyPart } from '@/lib/body/anatomy'

const all = parts as AnatomyPart[]
const byName = (n: string, side: string | null = null) => all.find((p) => p.name === n && p.side === side)!

test('the catalogue has every bone and organ part, each with a unique id', () => {
  expect(all.filter((p) => p.layer === 'skeleton')).toHaveLength(329)
  expect(all.filter((p) => p.layer === 'organs').length).toBeGreaterThanOrEqual(140)
  expect(new Set(all.map((p) => p.id)).size).toBe(all.length)
})

test('every group has an English and a Bangla name', () => {
  for (const g of new Set(all.map((p) => p.group))) {
    expect(GROUP_NAMES[g], g).toBeDefined()
    expect(GROUP_NAMES[g].bn).toMatch(/[ঀ-৿]/)
  }
})

test('a part is described with its group and side', () => {
  const femur = all.find((p) => p.name === 'Femur' && p.side === 'left')!
  expect(describePart(femur, 'en')).toBe('Femur (left) · Bones of the leg and foot')
  expect(describePart(femur, 'bn')).toBe('Femur (বাম) · পা ও পায়ের পাতার হাড়')
})

test.each([
  ['lungs', 5],
  ['heart', 4],
  ['kidneys', 2],
  ['brain', 3],
] as const)('%s lights up %i or more parts', (organ, min) => {
  expect(partsFor(organ, all).length).toBeGreaterThanOrEqual(min)
})

test.each(['liver', 'stomach', 'intestines', 'pancreas', 'spleen', 'gallbladder', 'bladder', 'trachea'] as const)('%s finds its part', (organ) => {
  expect(partsFor(organ, all).length).toBeGreaterThan(0)
})

test('a single part id lights up just that part', () => {
  const femur = byName('Femur', 'left')
  expect(partsFor(femur.id, all)).toEqual([femur.id])
})

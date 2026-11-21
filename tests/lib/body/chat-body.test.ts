import { bodyTag, extractBodyTag, pointedLine, splitPointed } from '@/lib/body/chat-body'
import type { AnatomyPart } from '@/lib/body/anatomy'

const tibia: AnatomyPart = { id: 'tibia_l', name: 'Tibia', side: 'left', group: 'Bones of lower limb', layer: 'skeleton', file: 'skeleton-v1' }

test('a valid tag is removed and its organ returned', () => {
  expect(extractBodyTag('It may be your lungs.\n\nHow sure I am: fair.\n[[body:lungs]]')).toEqual({
    text: 'It may be your lungs.\n\nHow sure I am: fair.',
    organ: 'lungs',
  })
})

test('an unknown organ is dropped, and the text is cleaned', () => {
  expect(extractBodyTag('Hello [[body:soul]] there')).toEqual({ text: 'Hello  there', organ: null })
})

test('only the first valid tag counts; all tags are removed', () => {
  expect(extractBodyTag('[[body:nose]]A\n[[ body : Heart ]]\nB [[body:liver]]')).toEqual({ text: 'A\n\nB', organ: 'heart' })
})

test('text without a tag is unchanged', () => {
  expect(extractBodyTag('Plain reply')).toEqual({ text: 'Plain reply', organ: null })
})

test('bodyTag writes the tag back', () => {
  expect(bodyTag('kidneys')).toBe('[[body:kidneys]]')
})

test('pointed line in English and Bangla', () => {
  expect(pointedLine({ region: 'leftLeg', part: tibia }, 'en')).toBe('📍 Where it hurts: Left leg · Tibia (left)')
  expect(pointedLine({ region: 'leftLeg', part: tibia }, 'bn')).toBe('📍 কোথায় সমস্যা: বাম পা · Tibia (বাম)')
  expect(pointedLine({ region: 'chest', part: null }, 'en')).toBe('📍 Where it hurts: Chest')
})

test('splitPointed separates the pointed line from the words', () => {
  expect(splitPointed('📍 Where it hurts: Chest\nIt burns')).toEqual({ point: 'Where it hurts: Chest', rest: 'It burns' })
  expect(splitPointed('📍 Where it hurts: Chest')).toEqual({ point: 'Where it hurts: Chest', rest: '' })
  expect(splitPointed('No point here')).toEqual({ point: null, rest: 'No point here' })
})

test('the pointed line names the exact spot on the part', () => {
  const brain: AnatomyPart = { id: 'cerebrum', name: 'Cerebrum', side: null, group: 'Brain', layer: 'organs', file: 'organs-v1' }
  expect(pointedLine({ region: 'head', part: brain, spot: { u: 0.5, v: 0.6, w: 0.85 } }, 'en')).toBe(
    '📍 Where it hurts: Head · Cerebrum, left frontal lobe',
  )
})

import { expect, test } from 'vitest'
import { dropStockOpeners } from '@/lib/health/comfort'

test.each([
  // The two lines a November tester circled.
  ['জ্বর খুব বেশি হলে শরীর খুব দুর্বল লাগে, আমি বুঝতে পারছি।\n\nআর কোনো সমস্যা আছে?', 'আর কোনো সমস্যা আছে?'],
  [
    'শরীরের ব্যথা আর জ্বরের কারণে আপনি নিশ্চয়ই খুব অস্বস্তি বোধ করছেন। আমি আপনার পাশে আছি।\n\nআপনার এই সমস্যাগুলো এই কারণে হতে পারে:',
    'আপনার এই সমস্যাগুলো এই কারণে হতে পারে:',
  ],
  ['শুনে খুব খারাপ লাগছে। আমি আপনার পাশে আছি। আপনার জ্বর কত?', 'আপনার জ্বর কত?'],
  ["That sounds really uncomfortable. I'm here with you.\n\nIt may be acid reflux.", 'It may be acid reflux.'],
  ['I understand. How long has it hurt?', 'How long has it hurt?'],
])('drops the stock opening of %p', (input, out) => {
  expect(dropStockOpeners(input)).toBe(out)
})

test.each([
  'It may be a common cold. Rest and drink water.',
  'Being scared at night is very hard. Try slow breaths.',
  'আপনার জ্বর কত?',
])('keeps a reply that opens with real content: %p', (input) => {
  expect(dropStockOpeners(input)).toBe(input)
})

test('never empties a reply that is only a stock line', () => {
  expect(dropStockOpeners("I'm here with you.")).toBe("I'm here with you.")
})

test('stops after two sentences', () => {
  expect(dropStockOpeners('I understand. I am here with you. I am sorry to hear that. Rest.')).toBe('I am sorry to hear that. Rest.')
})

import { expect, test } from 'vitest'
import { isRude } from '@/lib/health/rude'

test.each(['fuck you', 'no fuck you bitch', 'you are useless', 'shut up', 'তুই একটা ফালতু বেয়াদব', 'chup kor', 'tui ekta faltu'])(
  '%p is rude',
  (t) => expect(isRude(t)).toBe(true),
)

test.each(['I have a headache', 'my stomach hurts a lot', 'বালিশে মাথা রাখলে ব্যথা', 'shutter fell on my hand', 'amar pet betha'])(
  '%p is not rude',
  (t) => expect(isRude(t)).toBe(false),
)

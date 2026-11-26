import { checkReply } from '@/lib/health/safety-filter'
test.each([
  ['bn', 'আপনার অবশ্যই দ্রুত একজন ডাক্তার দেখানো উচিত।\nআমি কতটা নিশ্চিত: সাধারণ তথ্য।'],
  ['en', 'This is definitely worth checking with a doctor soon.\nHow sure I am: general info.'],
  ['en', 'You definitely have to see a doctor today.\nHow sure I am: general info.'],
] as const)('%s safe advice not blocked: %s', (lang, r) => {
  expect(checkReply(r, lang).ok).toBe(true)
})

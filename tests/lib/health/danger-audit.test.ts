import { detectDanger } from '@/lib/health/danger'
import { checkReply } from '@/lib/health/safety-filter'

const shouldFire: string[] = [
  'I have severe chest pain and sweating',
  'my chest hurts a lot',
  'pain in my chest spreading to my left arm',
  'i cant breath',
  'I can not breathe properly',
  'struggling to breathe',
  'breathless and lips turning blue',
  'amar buke betha korche',
  'buke khub betha',
  'shash nite parchi na',
  'shash nite kosto hocche',
  'nishash nite parchi na',
  'বুকে ব্যথা করছে',
  'বুকে খুব ব্যথা',
  'বুকের বাম পাশে ব্যথা',
  'বুক ব্যথা আর ঘাম হচ্ছে',
  'শ্বাস নিতে কষ্ট হচ্ছে',
  'নিঃশ্বাস নিতে পারছি না',
  'I want to kill myself',
  'i dont want to live anymore',
  'thinking of ending my life',
  'I cut myself last night',
  'আমি আর বাঁচতে চাই না',
  'মরে যাব ভাবছি',
  'ami mor jete chai',
  'ami ar bachte chai na',
  'my father face is drooping and he cant lift his arm',
  'sudden weakness in left arm and leg',
  'বাবার মুখ বেঁকে গেছে',
  'হঠাৎ এক হাত অবশ হয়ে গেছে',
  'my baby is unconscious',
  'my child is not responding',
  'he collapsed and is not breathing',
  'বাচ্চা অজ্ঞান হয়ে গেছে',
  'she is bleeding heavily after delivery',
  'blood is not stopping from the cut',
  'অনেক রক্ত পড়ছে',
  'রক্ত পড়া বন্ধ হচ্ছে না',
  'my son is having a fit',
  'having seizures',
  'বাচ্চার খিঁচুনি হচ্ছে',
  'my child swallowed rat poison',
  'he drank pesticide',
  'took 20 sleeping pills',
  'বিষ খেয়েছে',
  'ইঁদুরের বিষ খেয়ে ফেলেছে',
  'I am pregnant and bleeding',
  'pregnant with heavy bleeding',
  '7 months pregnant, bleeding',
  'আমি গর্ভবতী, রক্ত যাচ্ছে',
  'প্রেগন্যান্ট অবস্থায় রক্তপাত',
  'snake bit me',
  'সাপে কেটেছে',
  'my lips and tongue are swelling after eating shrimp',
  'my throat is closing',
  'gola fule jacche, shash nite parchi na',
  'chest pain',
  'heart attack hoyeche mone hoy',
]
const shouldNotFire: string[] = [
  'I have a mild headache',
  'what is a heart?',
  'my shoes fit well and fits nicely',
  'which shoe size fits me',
  'I feel a bit tired today',
  'আমার মাথা ব্যথা',
  'cough for two days',
  'pain 3/10 in my knee',
  'I stopped bleeding from the small cut',
]

test.each(shouldFire)('fires: %s', (m) => {
  expect(detectDanger(m)).not.toBeNull()
})
test.each(shouldNotFire)('quiet: %s', (m) => {
  expect(detectDanger(m)).toBeNull()
})

const bnNormal = [
  'এটি কয়েকটি কারণে হতে পারে। একটি সাধারণ কারণ হলো পানিশূন্যতা।\nআমি কতটা নিশ্চিত: সাধারণ তথ্য।',
  'মাথাব্যথার কারণ হলো অনেক কিছু হতে পারে।\nআমি কতটা নিশ্চিত: সাধারণ তথ্য।',
]
test.each(bnNormal)('bn normal reply not blocked: %s', (r) => {
  expect(checkReply(r, 'bn').ok).toBe(true)
})
test('en normal: one common cause is', () => {
  expect(checkReply('One possible cause is dehydration.\nHow sure I am: general info.', 'en').ok).toBe(true)
})
test.each(['📍 কোথায় সমস্যা: বুক · ব্যথা 4/10', '📍 Where it hurts: Chest · Pain 3/10', '📍 কোথায় সমস্যা: বুক'])('chest tap with low pain stays quiet: %s', (m) => {
  expect(detectDanger(m)).toBeNull()
})

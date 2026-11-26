import { detectDanger, type DangerKind } from '@/lib/health/danger'

// Found by the November bug hunt: real ways people type emergencies that got no 999 card.
const precomposed = (s: string) => s.replace(/ড়/g, 'ড়').replace(/য়/g, 'য়').replace(/ঢ়/g, 'ঢ়')

const cases: [string, DangerKind][] = [
  // the common ব্যাথা spelling
  ['বুকে ব্যাথা', 'heart'],
  ['বুক ব্যাথা করছে', 'heart'],
  ['বুকে প্রচন্ড ব্যাথা', 'heart'],
  ['বুকের বাম পাশে ব্যাথা', 'heart'],
  // না written joined
  ['শ্বাস নিতে পারছিনা', 'breathing'],
  ['নিঃশ্বাস নিতে পারছিনা', 'breathing'],
  ['আমি আর বাঁচতে চাইনা', 'selfHarm'],
  ['রক্ত বন্ধ হচ্ছেনা', 'bleeding'],
  ['শ্বাস কষ্ট হচ্ছে', 'breathing'],
  ['খিচুনি হচ্ছে', 'seizure'],
  // spacing, hyphens, new lines
  ['chest  pain', 'heart'],
  ['chest-pain since morning', 'heart'],
  ['chest\npain', 'heart'],
  // English and Banglish
  ['i wanna die', 'selfHarm'],
  ['I feel like ending it all', 'selfHarm'],
  ['atmohatya korbo', 'selfHarm'],
  ['ami more jabo', 'selfHarm'],
  ['shas nite parchi na', 'breathing'],
  ['shash nite parchina', 'breathing'],
  ['nisshash nite parchi na', 'breathing'],
  ['shas kosto', 'breathing'],
  ['bukey betha', 'heart'],
  ['buke byatha', 'heart'],
  ['fits hocche', 'seizure'],
  ['kotha joriye jacche', 'stroke'],
  ['lips turned blue', 'breathing'],
  ['took ২০ pills', 'poison'],
  ['অনেক গুলো ঘুমের ওষুধ খেয়েছে', 'poison'],
  // pain scale in any digits and spacing
  ['pain ১০/১০', 'severePain'],
  ['ব্যথা ১০/১০', 'severePain'],
  ['Pain 10 / 10', 'severePain'],
  ['pain is 10/10', 'severePain'],
]

test.each(cases)('%p shows the %p card', (text, kind) => {
  expect(detectDanger(text)).toBe(kind)
})

const composed: [string, DangerKind][] = [
  ['সাপে কামড়েছে', 'snake'],
  ['রক্ত পড়া বন্ধ হচ্ছে না', 'bleeding'],
  ['কথা জড়িয়ে যাচ্ছে', 'stroke'],
  ['জ্ঞান হারিয়েছে', 'unconscious'],
  ['সাড়া দিচ্ছে না', 'unconscious'],
  ['পুড়ে গেছে', 'burn'],
  ['হাত অবশ হয়ে গেছে', 'stroke'],
]

test.each(composed)('%p typed with one-character ড়/য় still shows the %p card', (text, kind) => {
  expect(detectDanger(text)).toBe(kind)
  expect(detectDanger(precomposed(text))).toBe(kind)
})

test.each(['I have a mild cough', 'আমার একটু সর্দি', 'pain 3/10', 'ব্যথা ৪/১০', 'আমি ডাক্তারকে বিশ্বাস করি', 'বিছানা থেকে উঠতে ইচ্ছা করে না'])(
  'no card for an ordinary message: %p',
  (text) => expect(detectDanger(text)).toBeNull(),
)

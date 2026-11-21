import { detectDanger } from '@/lib/health/danger'

test.each([
  ['I have chest pain spreading to my left arm', 'heart'],
  ['বুকে ব্যথা আর ঘাম হচ্ছে', 'heart'],
  ['buke betha korche', 'heart'],
  ["My father can't breathe properly", 'breathing'],
  ['শ্বাস নিতে পারছি না', 'breathing'],
  ['her face is drooping and speech is slurred', 'stroke'],
  ['মায়ের মুখ বেঁকে গেছে', 'stroke'],
  ['he fainted and is not waking up', 'unconscious'],
  ['বাবা অজ্ঞান হয়ে গেছে', 'unconscious'],
  ["the bleeding won't stop", 'bleeding'],
  ['রক্তবমি হচ্ছে', 'bleeding'],
  ['my son is having a seizure', 'seizure'],
  ['খিঁচুনি হচ্ছে', 'seizure'],
  ['she took too many pills', 'poison'],
  ['বিষ খেয়েছে', 'poison'],
  ['my throat is swelling after eating prawns', 'allergy'],
  ['bitten by a snake in the field', 'snake'],
  ['সাপে কামড় দিয়েছে', 'snake'],
  ['severe burn on my hand from hot oil', 'burn'],
  ["I'm pregnant and bleeding", 'pregnancy'],
  ['I want to kill myself', 'selfHarm'],
  ['আমি আর বাঁচতে চাই না', 'selfHarm'],
  ['📍 Where it hurts: Head · Pain 10/10', 'severePain'],
  ['📍 কোথায় সমস্যা: বুক · ব্যথা 9/10', 'severePain'],
] as const)('%s → %s', (text, kind) => {
  expect(detectDanger(text)).toBe(kind)
})

test('ordinary messages show no emergency card', () => {
  for (const text of ['I have a mild headache since morning', 'আমার একটু সর্দি', '📍 Where it hurts: Chest · Pain 4/10', 'how do you work', 'What is a heart?']) {
    expect(detectDanger(text)).toBeNull()
  }
})

test('self-harm wins over everything else', () => {
  expect(detectDanger('chest pain and I want to die')).toBe('selfHarm')
})

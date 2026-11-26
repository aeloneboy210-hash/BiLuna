import { guessOrgan } from '@/lib/body/chat-body'

test.each([
  ['I have a cough for 3 days', 'lungs'],
  ['গত দুই দিন ধরে আমার কাশি আর গলা ব্যথা', 'lungs'],
  ['I feel short of breath when I climb stairs', 'lungs'],
  ['My throat hurts when I swallow', 'trachea'],
  ['আমার গলা ব্যথা', 'trachea'],
  ['I have a mild headache every afternoon', 'brain'],
  ['মাথা ব্যথা করছে', 'brain'],
  ['I have heartburn after dinner', 'stomach'],
  ['পেটে গ্যাস আর অম্বল', 'stomach'],
  ['I have had diarrhoea since yesterday', 'intestines'],
  ['পাতলা পায়খানা হচ্ছে', 'intestines'],
  ['It burns when I urinate', 'bladder'],
  ['প্রস্রাবে জ্বালাপোড়া', 'bladder'],
  ['My eyes look yellow, could it be jaundice?', 'liver'],
  ['My heart is racing, palpitations', 'heart'],
] as const)('%s → %s', (text, organ) => {
  expect(guessOrgan(text)).toBe(organ)
})

test.each(['Hello', 'Thank you!', 'My left knee hurts', 'I feel tired', ''])('no organ for "%s"', (text) => {
  expect(guessOrgan(text)).toBeNull()
})

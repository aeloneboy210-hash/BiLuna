/**
 * The fixed danger-word check. It runs on every patient message before and apart from the AI,
 * so the emergency card can never depend on the model. English, Bangla and common Banglish.
 */
export type DangerKind =
  | 'selfHarm'
  | 'heart'
  | 'breathing'
  | 'stroke'
  | 'unconscious'
  | 'bleeding'
  | 'seizure'
  | 'poison'
  | 'allergy'
  | 'snake'
  | 'burn'
  | 'pregnancy'
  | 'severePain'

/** Checked in this order: the first match decides the card. Self-harm always comes first. */
const RULES: [DangerKind, RegExp[]][] = [
  [
    'selfHarm',
    [
      /\b(kill|hurt|harm) (myself|my self)\b/,
      /\bsuicid/,
      /\bend (my|this) life\b/,
      /\bwant to die\b/,
      /\bself[- ]?harm/,
      /আত্মহত্যা/,
      /মরে যেতে চাই/,
      /বাঁচতে চাই না/,
      /নিজেকে (শেষ|মেরে)/,
      /\bmore jete chai\b/,
    ],
  ],
  [
    'heart',
    [/\bchest (pain|pressure|tightness)\b/, /\bheart attack\b/, /বুকে? (ব্যথা|চাপ)/, /হার্ট অ্যাটাক/, /\bbuke? (betha|bytha|batha|chap)\b/],
  ],
  [
    'breathing',
    [
      /\b(can'?t|cannot|can not|unable to) breathe?\b/,
      /\b(difficulty|trouble) breathing\b/,
      /\bshort(ness)? of breath\b/,
      /\bchoking\b/,
      /শ্বাস নিতে পারছি না/,
      /শ্বাসকষ্ট/,
      /দম বন্ধ/,
      /\bshash nite parchi na\b/,
    ],
  ],
  [
    'stroke',
    [
      /\bstroke\b/,
      /\bface (is )?droop/,
      /\bslurred speech\b|\bspeech is slurred\b/,
      /\b(can'?t|cannot) (speak|talk)\b/,
      /\bone side (of (the|my|his|her) body )?(is )?(weak|numb)\b/,
      /\b(numb|weak) on one side\b/,
      /মুখ বেঁকে/,
      /কথা জড়িয়ে/,
      /স্ট্রোক/,
      /এক পাশ অবশ/,
    ],
  ],
  [
    'unconscious',
    [/\bunconscious\b/, /\bfainted\b/, /\bpassed out\b/, /\bnot waking( up)?\b/, /অজ্ঞান/, /জ্ঞান (হারিয়েছে|নেই|ফিরছে না)/, /\bogyan\b/],
  ],
  [
    'bleeding',
    [
      /\b(heavy|severe) bleeding\b/,
      /\bbleeding (won'?t|will not|doesn'?t|does not) stop\b/,
      /\b(won'?t|will not) stop bleeding\b/,
      /\bbleeding a lot\b/,
      /\b(vomiting|coughing) (up )?blood\b/,
      /\bblood in (my )?vomit\b/,
      /রক্ত(পাত)? বন্ধ হচ্ছে না/,
      /অনেক রক্ত/,
      /রক্তবমি/,
    ],
  ],
  ['seizure', [/\bseizure/, /\bconvulsion/, /\bfits\b/, /খিঁচুনি/]],
  [
    'poison',
    [/\bpoison/, /\boverdose/, /\btoo many (pills|tablets)\b/, /\bdrank (bleach|kerosene|pesticide)\b/, /বিষ খে/, /বেশি ওষুধ খে/, /কীটনাশক/],
  ],
  ['allergy', [/\bthroat (is )?swell/, /\bswollen throat\b/, /\banaphyla/, /গলা ফুলে/]],
  ['snake', [/\bsnake ?bite\b/, /\bbitten by a snake\b/, /সাপে? কামড়/, /\bshap(e)? kamor\b/]],
  ['burn', [/\b(severe|bad) burns?\b/, /\bburn(ed|t) badly\b/, /পুড়ে গেছে/]],
  ['pregnancy', [/\bpregnan\w*\b.*\bbleed/, /\bbleed\w*\b.*\bpregnan/, /গর্ভবতী.*রক্ত/, /রক্ত.*গর্ভবতী/]],
  // A 9 or 10 on the pain scale sent with a point on the body.
  ['severePain', [/(pain|ব্যথা) (9|10)\/10/]],
]

/** The kind of emergency a message may describe, or null. */
export function detectDanger(text: string): DangerKind | null {
  const t = text.toLowerCase().replace(/[’`]/g, "'")
  for (const [kind, patterns] of RULES) if (patterns.some((p) => p.test(t))) return kind
  return null
}

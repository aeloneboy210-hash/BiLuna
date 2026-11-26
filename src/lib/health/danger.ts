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
      /\b(don'?t|do not) want to (live|be alive)\b/,
      /\bend(ing)? (my|this) life\b/,
      /\b(cut|cutting|cuts) myself\b/,
      /\btake my (own )?life\b/,
      /মরে যা(ব|বো|ই)/,
      /নিজের ক্ষতি/,
      /হাত কেটে ফেল/,
      /\bmor(e)? (jete|jabo|jaite) chai\b/,
      /\bbach(t|th)e chai na\b/,
      /\batmohotta\b/,
    ],
  ],
  [
    'heart',
    [/\bchest (pain|pressure|tightness)\b/, /\bheart attack\b/, /বুকে? (ব্যথা|চাপ)/, /হার্ট অ্যাটাক/, /\bbuke? (betha|bytha|batha|chap)\b/,
      /\bchest (hurts|is hurting|feels (tight|heavy))\b/,
      /\bpain in (my |the )?chest\b/,
      /বুকে?র?[^·\n]{0,25}(ব্যথা|চাপ)/,
      /\bbuke?r? \w+ (betha|bytha|batha|chap)\b/,
      /\bheart attack\b/,
    ],
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
      /\b(struggling|hard|difficult|hard time) (to )?breath/,
      /\bbreathless\b/,
      /\b(lips|face) (are |is )?(turning )?blue\b/,
      /\bnot breathing\b/,
      /শ্বাস নিতে (কষ্ট|সমস্যা)/,
      /নিঃশ্বাস নিতে (পারছি না|পারছে না|কষ্ট)/,
      /শ্বাস (বন্ধ|নিচ্ছে না)/,
      /\b(ni)?shash nite (parchi na|parche na|kosto|kashto|kosto hocche)\b/,
      /\bshash kosto\b/,
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
      /\bsudden (weakness|numbness)\b/,
      /\b(can'?t|cannot) (lift|move) (his|her|my) (arm|leg)\b/,
      /হঠাৎ[^·\n]{0,20}অবশ/,
      /(হাত|পা) অবশ হয়ে গেছে/,
    ],
  ],
  [
    'unconscious',
    [/\bunconscious\b/, /\bfainted\b/, /\bpassed out\b/, /\bnot waking( up)?\b/, /অজ্ঞান/, /জ্ঞান (হারিয়েছে|নেই|ফিরছে না)/, /\bogyan\b/,
      /\bnot responding\b/, /\bunresponsive\b/, /\bcollapsed\b/, /সাড়া দিচ্ছে না/, /\bsara dicche na\b/],
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
      /\bbleeding (heavily|badly|nonstop|non-stop)\b/,
      /\bblood (is |isn'?t )?(not )?stopping\b|\bblood won'?t stop\b/,
      /রক্ত পড়া বন্ধ হচ্ছে না/,
      /রক্ত (পড়া )?থামছে না/,
      /\brokto (bondho hocche na|thamche na)\b/,
    ],
  ],
  ['seizure', [/\bseizure/, /\bconvulsion/, /\b(having|has|had|getting|got) (a )?fits?\b/, /খিঁচুনি/, /\bkhichuni\b/]],
  [
    'poison',
    [/\bpoison/, /\boverdose/, /\btoo many (pills|tablets)\b/, /\bdrank (bleach|kerosene|pesticide)\b/, /বিষ খে/, /বেশি ওষুধ খে/, /কীটনাশক/,
      /\b(took|swallowed|ate|drank) \d+ (\w+ )?(pills|tablets)\b/, /\bswallowed (\w+ )?(poison|bleach|kerosene|battery)/, /\bbish khe/, /অনেকগুলো? (ঘুমের )?(ওষুধ|ট্যাবলেট) খে/],
  ],
  ['allergy', [/\bthroat (is )?(swell|closing|closing up)/, /\bswollen throat\b/, /\banaphyla/, /গলা ফুলে/, /\b(lips|tongue|face)( and (lips|tongue|face))? (is |are )?swell/, /জিভ ফুলে/, /ঠোঁট ফুলে/, /\bgola fule\b/]],
  ['snake', [/\bsnake ?bite\b/, /\bbitten by a snake\b/, /সাপে? কামড়/, /\bshap(e)? kamor\b/, /\bsnake (bit|bite|bitten)\b/, /সাপে কেটে/, /\bshap(e)? kete\b/]],
  ['burn', [/\b(severe|bad) burns?\b/, /\bburn(ed|t) badly\b/, /পুড়ে গেছে/]],
  ['pregnancy', [/\bpregnan\w*\b.*\bbleed/, /\bbleed\w*\b.*\bpregnan/, /গর্ভবতী.*রক্ত/, /রক্ত.*গর্ভবতী/, /(প্রেগন্যান্ট|গর্ভাবস্থা|অন্তঃসত্ত্বা).*রক্ত/, /\bbleeding .{0,20}after (delivery|giving birth|childbirth)\b/, /প্রসবের পর .{0,15}রক্ত/]],
  // A 9 or 10 on the pain scale sent with a point on the body.
  ['severePain', [/(pain|ব্যথা) (9|10)\/10/]],
]

/** The kind of emergency a message may describe, or null. */
export function detectDanger(text: string): DangerKind | null {
  const t = text.toLowerCase().replace(/[’`]/g, "'")
  for (const [kind, patterns] of RULES) if (patterns.some((p) => p.test(t))) return kind
  return null
}

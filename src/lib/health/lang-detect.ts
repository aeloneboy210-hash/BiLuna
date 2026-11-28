import type { Lang } from '@/lib/i18n/lang'

/** Common words of Bangla written in English letters ("Banglish"), as patients type it on phones. */
const BANGLISH = new Set(
  (
    'ami amar amake amr apni apnar apnake tumi tomar ki kemon keno ekhon kal theke din dhore khub onek ' +
    'betha batha bytha matha buke buk pete jor jvor jhor kashi kosto koshto hocche hoche korche korchi ' +
    'parchi parchina parina na nai nei shash nishash nite lagche lage bhalo valo jacche dicche bhugchi ' +
    'ji jee hae hya accha thik ashche asche oshudh osudh oshud khabo khete khacchi pet ghurche ghure sorir shorir ' +
    'kharap dorkar kotha jhor jor jvor gola kan chokh pa hat pith kichu ektu besi beshi kom ' +
    // More everyday words, from what testers typed (November feedback: Banglish was getting English answers).
    'e r ar o ei oi eta eita oita ota je jodi tahole kintu ba ebong shathe sathe jonno moto por age pore ' +
    'ki kivabe kibhabe kibabe koto kobe kothay kon konta keu naki bujhbo bujhi bujhtesi bolo bolen bolun ' +
    'korbo korbe korben korte kore korsi korse kortese kortesi kortasi korlam korechi koreche hoy hoi hobe ' +
    'hoise hoyeche hoyese hoyechhe hocche hosse hossa hoitese hoito hoilo holo gese geche gelo jabe ' +
    'khaise khaisi khailam khaite khabar khawa khete khabo khai khay pani paani parbo parben pari pare ' +
    'dile dibo diben dao nibo nite neya ase ache achhe aache achi asi nai thake thakbe chai lagbe ' +
    'lagtese lagteche lagse lagchhe lagtasi bomi bomibomi kashi sordi thanda gorom matha mathabetha ' +
    'mathabatha ghum ghumate jala jalapora chulkani dhorse dhoreche fula fule shukna kosht kombe barse ' +
    'bartese amma ammu ammur abba abbu abbur baba babar maa mayer vai bhai vaiya apu bon bou chele meye ' +
    'bacha baccha bachcha bacchar jinis gula gulo guli valo bhalo kharap khub onek ektu shudhu ' +
    'tai tao toh na naa haa hae ji jee accha achha thik ache shob sob sobai ekdom shuru ' +
    'chap buke bukh pith komor peshab proshrab paikhana paykhana patla payokhana shorire sorire gaye ' +
    'amk amay amare banglai banglay banglate bangla raat sokal bikal shondha ajke aj kalke gotokal porshu shoptaho bochor'
  ).split(' '),
)

/** Common English words that are never Banglish. Medical words (pain, fever, chest) are left out: Banglish uses them too. */
const ENGLISH = new Set(
  (
    'i me my mine you your yours he him his she her it its we us our they them their this that these those ' +
    'is am are was were be been being have has had do does did can could will would should shall may might ' +
    'must not no yes the a an and or but if so of to in on at for from with by about since after before ' +
    'until because what when where why how which who very too also just only still again now today ' +
    'yesterday tomorrow day days week weeks night morning there here than then any some much many more ' +
    'most less lot got get gets getting please thanks thank feeling hurts hurt help since'
  ).split(' '),
)

/** Bangla verb endings typed in English letters: "hocche", "lagtese", "korlam", "khabo". */
const BANGLISH_ENDING = /(?:cche|cchi|chhe|chhi|tese|tesi|tasi|tase|ssi|sse|lam|bo|ben)$|(?<!a)che$|chi$/

const isBanglish = (w: string) => BANGLISH.has(w) || (w.length >= 4 && !ENGLISH.has(w) && BANGLISH_ENDING.test(w))

/** Like typedLang, but English when the text is too short to tell. For checking a whole reply's language. */
export function detectLang(text: string): Lang {
  return typedLang(text) ?? 'en'
}

/**
 * The language of what the patient typed, or null when it is too short to tell: a number, an emoji, "ok",
 * a brand name. Then the chat keeps the language it already has, so a Bangla chat does not turn English
 * because the patient answered "3" or "ok". Bangla script decides at once; a short Latin-letter message
 * counts only if all of it is common Banglish ("jor", "ji"); longer ones need at least two Banglish words and
 * more Banglish than plain English words, so "chest e pain hocche" is Bangla and "my matha betha since 2 days"
 * English. People who write Banglish usually read Bangla better than English, so they get Bangla answers.
 */
export function typedLang(text: string): Lang | null {
  const letters = text.match(/\p{L}|\p{M}/gu) ?? []
  if (letters.length === 0) return null
  const bangla = letters.filter((ch) => /[ঀ-৿]/.test(ch)).length
  if (bangla / letters.length >= 0.3) return 'bn'
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const banglish = words.filter(isBanglish).length
  if (words.length < 3) return banglish > 0 && banglish === words.length ? 'bn' : null
  // Banglish wins when it has more of its own words than plain English words; medical words count for neither.
  const english = words.filter((w) => ENGLISH.has(w)).length
  return banglish >= 2 && banglish > english ? 'bn' : 'en'
}

/**
 * The language the patient is writing the chat in now: that of their latest message with words of their own
 * (not BiLuna's replies, not the "📍 Where it hurts" or "📎 file" lines, which are written in the site's
 * language). A patient who switches from Bangla to English mid-chat gets English from then on. Null if they
 * wrote no words.
 */
export function chatLang(history: { author: 'patient' | 'biluna'; body: string }[]): Lang | null {
  for (const m of [...history].reverse()) {
    if (m.author !== 'patient') continue
    const words = m.body
      .split('\n')
      .filter((line) => !/^\s*(📍|📎)/u.test(line))
      .join('\n')
      .trim()
    const lang = typedLang(words)
    if (lang) return lang
  }
  return null
}

const MENTIONS_BN = /(?<![a-z])(?:bangla\w*|bengali|bangali)(?![a-z])|বাংলা/iu
const MENTIONS_EN = /(?<![a-z])(?:english|ingreji|engliish)(?![a-z])|ইংরেজি|ইংলিশ/iu
const ASKS = /(?<![a-z])(?:bolo|bolen|bolun|bol|bolba|bolben|kotha|likho|lekho|speak|talk|reply|answer|write|say|use|please|plz|pls|te|e|a|y|i)(?![a-z])|বল|লিখ|কথা|দাও|দিন|উত্তর/iu

/**
 * "amk banglai bolo", "বাংলায় বলো", "please speak English": the patient asks BiLuna to change its language.
 * Returns that language, or null. Short messages only, naming one language, so "I don't understand the
 * English words in my Bangla report" is not a request.
 */
export function asksForLanguage(text: string): Lang | null {
  const words = text.trim().split(/\s+/)
  if (words.length > 8) return null
  const bn = MENTIONS_BN.test(text)
  const en = MENTIONS_EN.test(text)
  // One or two words ("Bangla?", "English please") are a request on their own.
  if (bn === en || (words.length > 2 && !ASKS.test(text))) return null
  return bn ? 'bn' : 'en'
}

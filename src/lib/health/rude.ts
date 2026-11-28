/**
 * Swearing or insults aimed at BiLuna, in English, Bangla or Banglish. Used only to keep the reply short and
 * calm: a rude message is small talk, so its reply gets no "How sure I am" line. Danger words are checked
 * separately and always win.
 */
const RUDE =
  /(?<![a-z])(?:f+u+c+k\w*|fck\w*|f\*+k\w*|wtf|bitch\w*|bastard\w*|asshole\w*|idiot\w*|stupid|dumb|moron\w*|shut up|useless|faltu|shala|kutta|harami|gadha|chup kor\w*|beyadob)(?![a-z])|বেয়াদব|ফালতু|শালা|কুত্তা|হারামি|গাধা|চুপ কর|বোকাচোদা|বাল(?![ঀ-৿])/iu

export const isRude = (text: string) => RUDE.test(text.normalize('NFC'))

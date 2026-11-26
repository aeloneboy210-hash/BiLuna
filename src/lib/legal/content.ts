import type { Lang } from '@/lib/i18n/lang'

/**
 * BiLuna's Privacy Policy and Terms, in plain words. Written by the BiLuna team from how the app really
 * works; not yet reviewed by a lawyer (said on the page). Raise CONSENT_VERSION when either changes in a
 * way people must agree to again: everyone is then asked once more.
 */
export const CONSENT_VERSION = '2026-11-26'
export const UPDATED: Record<Lang, string> = { en: '26 November 2026', bn: '২৬ নভেম্বর ২০২৬' }

export type Section = { heading: string; body: string[] }
export type LegalPage = { title: string; intro: string; sections: Section[]; notLawyer: string }

export const PRIVACY: Record<Lang, LegalPage> = {
  en: {
    title: 'Privacy Policy',
    intro:
      'BiLuna is a healthcare AI companion built by a student team in Bangladesh. This page says, in plain words, what BiLuna keeps about you, who can see it, and how you can take it with you or delete it.',
    sections: [
      {
        heading: 'What BiLuna keeps',
        body: [
          'Your account: your name and email (and, if you use Google, the name and email Google gives us).',
          'Your chats with BiLuna, and the summaries you make for a doctor.',
          'Your health profile (age, conditions, medicines, allergies), only if you fill it in. You decide if BiLuna may use it in answers.',
          'Your 👍 / 👎 on answers, how many messages you sent today (for the daily limit), and a simple activity log.',
          'Files you upload (reports, prescriptions) are not kept. BiLuna reads them once to answer; the chat keeps only the file name.',
        ],
      },
      {
        heading: 'Who can see it',
        body: [
          'Only you can see your chats, profile and summaries.',
          'A doctor sees a summary only if you share it, and only until you stop sharing. Right now there are no verified doctors on BiLuna, so sharing is not yet open for real accounts.',
          'The people who run BiLuna can technically reach the database. They will only look to fix a problem or keep someone safe.',
          'BiLuna never sells your data, never shows you ads, and does not use your chats to train AI.',
        ],
      },
      {
        heading: 'Services BiLuna uses',
        body: [
          'Your account and chats are stored with Supabase, on servers in Mumbai, India.',
          'The website runs on Vercel.',
          "To write an answer, your message is sent to Cloudflare's AI service (the Gemma AI model). It answers and BiLuna saves the reply.",
          'If you sign in with Google, Google tells BiLuna your name and email.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'Download your data at any time from the Account page (one file with your chats, profile and summaries).',
          'Delete your account at any time from the Account page. Everything is removed from BiLuna at once and cannot be brought back.',
          'Delete single chats, or stop sharing a summary, at any time.',
        ],
      },
      {
        heading: 'Children',
        body: ['BiLuna is for people aged 18 or over. A parent or guardian may use it for their child, from their own account.'],
      },
      {
        heading: 'Changes',
        body: ['If this policy changes in an important way, BiLuna will ask you to read and agree again.'],
      },
    ],
    notLawyer: 'Written by the BiLuna team. Not yet reviewed by a lawyer.',
  },
  bn: {
    title: 'গোপনীয়তা নীতি',
    intro:
      'বিলুনা বাংলাদেশের একটি শিক্ষার্থী দলের তৈরি স্বাস্থ্যসেবা এআই সঙ্গী। এই পাতায় সহজ ভাষায় বলা হলো বিলুনা আপনার কী কী তথ্য রাখে, কে তা দেখতে পারে, আর কীভাবে আপনি তা নিয়ে যেতে বা মুছে ফেলতে পারেন।',
    sections: [
      {
        heading: 'বিলুনা কী রাখে',
        body: [
          'আপনার অ্যাকাউন্ট: আপনার নাম ও ইমেইল (গুগল দিয়ে খুললে, গুগল যে নাম ও ইমেইল দেয়)।',
          'বিলুনার সঙ্গে আপনার চ্যাট, আর ডাক্তারের জন্য তৈরি করা সারাংশ।',
          'আপনার স্বাস্থ্য প্রোফাইল (বয়স, রোগ, ওষুধ, অ্যালার্জি), শুধু আপনি পূরণ করলে। উত্তরে বিলুনা তা ব্যবহার করবে কি না, আপনিই ঠিক করবেন।',
          'উত্তরে আপনার 👍 / 👎, আজ কয়টি মেসেজ পাঠিয়েছেন (দৈনিক সীমার জন্য), আর একটি সাধারণ কার্যক্রম লগ।',
          'আপলোড করা ফাইল (রিপোর্ট, প্রেসক্রিপশন) রাখা হয় না। উত্তর দিতে বিলুনা একবার পড়ে; চ্যাটে শুধু ফাইলের নাম থাকে।',
        ],
      },
      {
        heading: 'কে দেখতে পারে',
        body: [
          'আপনার চ্যাট, প্রোফাইল ও সারাংশ শুধু আপনিই দেখতে পারেন।',
          'আপনি শেয়ার করলে তবেই একজন ডাক্তার সারাংশ দেখেন, আর শেয়ার বন্ধ করা পর্যন্তই। এখন বিলুনায় কোনো যাচাই করা ডাক্তার নেই, তাই আসল অ্যাকাউন্টে শেয়ার এখনো চালু নয়।',
          'যাঁরা বিলুনা চালান, তাঁরা প্রযুক্তিগতভাবে ডেটাবেসে পৌঁছাতে পারেন। শুধু কোনো সমস্যা ঠিক করতে বা কাউকে নিরাপদ রাখতেই তাঁরা দেখবেন।',
          'বিলুনা কখনো আপনার তথ্য বিক্রি করে না, বিজ্ঞাপন দেখায় না, আর আপনার চ্যাট দিয়ে এআই প্রশিক্ষণ দেয় না।',
        ],
      },
      {
        heading: 'বিলুনা যে সেবাগুলো ব্যবহার করে',
        body: [
          'আপনার অ্যাকাউন্ট ও চ্যাট রাখা হয় Supabase-এ, ভারতের মুম্বাইয়ের সার্ভারে।',
          'ওয়েবসাইটটি চলে Vercel-এ।',
          'উত্তর লিখতে আপনার মেসেজ Cloudflare-এর এআই সেবায় (Gemma এআই মডেল) পাঠানো হয়। সে উত্তর দেয়, আর বিলুনা উত্তরটি সংরক্ষণ করে।',
          'গুগল দিয়ে সাইন ইন করলে গুগল বিলুনাকে আপনার নাম ও ইমেইল জানায়।',
        ],
      },
      {
        heading: 'আপনার পছন্দ',
        body: [
          'অ্যাকাউন্ট পাতা থেকে যেকোনো সময় আপনার তথ্য ডাউনলোড করুন (চ্যাট, প্রোফাইল ও সারাংশ এক ফাইলে)।',
          'অ্যাকাউন্ট পাতা থেকে যেকোনো সময় অ্যাকাউন্ট মুছে ফেলুন। সবকিছু সঙ্গে সঙ্গে বিলুনা থেকে মুছে যায়, আর ফেরত আনা যায় না।',
          'যেকোনো সময় আলাদা চ্যাট মুছুন, বা সারাংশ শেয়ার বন্ধ করুন।',
        ],
      },
      {
        heading: 'শিশু',
        body: ['বিলুনা ১৮ বছর বা তার বেশি বয়সীদের জন্য। বাবা-মা বা অভিভাবক নিজের অ্যাকাউন্ট থেকে সন্তানের জন্য ব্যবহার করতে পারেন।'],
      },
      {
        heading: 'পরিবর্তন',
        body: ['এই নীতিতে গুরুত্বপূর্ণ কোনো পরিবর্তন হলে বিলুনা আপনাকে আবার পড়ে সম্মতি দিতে বলবে।'],
      },
    ],
    notLawyer: 'বিলুনা দলের লেখা। এখনো কোনো আইনজীবী যাচাই করেননি।',
  },
}

export const TERMS: Record<Lang, LegalPage> = {
  en: {
    title: 'Terms of Use',
    intro: 'By using BiLuna you agree to these terms. Please read them; they are short.',
    sections: [
      {
        heading: 'BiLuna is not a doctor',
        body: [
          'BiLuna is an AI. It explains what might be going on and when to see a doctor. It does not diagnose, and it never tells you how much medicine to take or to change a medicine.',
          'Always check with a doctor or pharmacist before you act on anything BiLuna says. BiLuna can be wrong.',
        ],
      },
      {
        heading: 'Emergencies',
        body: ['BiLuna is not an emergency service and does not contact anyone for you. In an emergency, call 999 or go to the nearest hospital now.'],
      },
      {
        heading: 'Using BiLuna fairly',
        body: [
          'BiLuna is free. To keep it free for everyone, each account can send up to 150 messages a day, and BiLuna may be busy when many people use it.',
          'Do not upload other people’s health information without their permission. Do not try to break, overload or misuse BiLuna.',
          'The "Try the demo" accounts are shared by everyone. Never type real health information into them.',
          'BiLuna may close an account that is used to harm others or the service.',
        ],
      },
      {
        heading: 'Who may use it',
        body: ['People aged 18 or over. A parent or guardian may use BiLuna for their child from their own account.'],
      },
      {
        heading: 'No guarantee',
        body: [
          'BiLuna is a prototype built by a student team. It is given as it is, without any promise that it is always right, always available, or fit for a particular use.',
        ],
      },
      {
        heading: 'Changes',
        body: ['If these terms change in an important way, BiLuna will ask you to read and agree again.'],
      },
    ],
    notLawyer: 'Written by the BiLuna team. Not yet reviewed by a lawyer.',
  },
  bn: {
    title: 'ব্যবহারের শর্তাবলি',
    intro: 'বিলুনা ব্যবহার করে আপনি এই শর্তগুলোতে সম্মতি দিচ্ছেন। অনুগ্রহ করে পড়ুন; এগুলো ছোট।',
    sections: [
      {
        heading: 'বিলুনা ডাক্তার নয়',
        body: [
          'বিলুনা একটি এআই। কী হতে পারে আর কখন ডাক্তার দেখাতে হবে, তা বুঝিয়ে বলে। এটি রোগ নির্ণয় করে না, আর কখনো ওষুধের মাত্রা বলে না বা ওষুধ বদলাতে বলে না।',
          'বিলুনার কোনো কথায় কাজ করার আগে সবসময় ডাক্তার বা ফার্মাসিস্টের সঙ্গে মিলিয়ে নিন। বিলুনা ভুল করতে পারে।',
        ],
      },
      {
        heading: 'জরুরি অবস্থা',
        body: ['বিলুনা জরুরি সেবা নয়, আর আপনার হয়ে কাউকে যোগাযোগ করে না। জরুরি অবস্থায় এখনই ৯৯৯-এ কল করুন বা নিকটস্থ হাসপাতালে যান।'],
      },
      {
        heading: 'ন্যায্যভাবে ব্যবহার',
        body: [
          'বিলুনা বিনামূল্যে। সবার জন্য বিনামূল্যে রাখতে প্রতিটি অ্যাকাউন্ট দিনে ১৫০টি পর্যন্ত মেসেজ পাঠাতে পারে, আর অনেকে একসঙ্গে ব্যবহার করলে বিলুনা ব্যস্ত থাকতে পারে।',
          'অনুমতি ছাড়া অন্যের স্বাস্থ্য তথ্য আপলোড করবেন না। বিলুনা ভাঙা, অতিরিক্ত চাপ দেওয়া বা অপব্যবহারের চেষ্টা করবেন না।',
          '"ডেমো দেখুন" অ্যাকাউন্টগুলো সবাই মিলে ব্যবহার করে। সেখানে কখনো আসল স্বাস্থ্য তথ্য লিখবেন না।',
          'অন্যের বা সেবার ক্ষতি করতে ব্যবহৃত অ্যাকাউন্ট বিলুনা বন্ধ করে দিতে পারে।',
        ],
      },
      {
        heading: 'কে ব্যবহার করতে পারেন',
        body: ['১৮ বছর বা তার বেশি বয়সীরা। বাবা-মা বা অভিভাবক নিজের অ্যাকাউন্ট থেকে সন্তানের জন্য বিলুনা ব্যবহার করতে পারেন।'],
      },
      {
        heading: 'কোনো নিশ্চয়তা নেই',
        body: [
          'বিলুনা একটি শিক্ষার্থী দলের তৈরি প্রোটোটাইপ। এটি যেমন আছে তেমনই দেওয়া হচ্ছে; সবসময় সঠিক, সবসময় চালু বা কোনো নির্দিষ্ট কাজের উপযুক্ত হবে, এমন কোনো প্রতিশ্রুতি নেই।',
        ],
      },
      {
        heading: 'পরিবর্তন',
        body: ['এই শর্তে গুরুত্বপূর্ণ কোনো পরিবর্তন হলে বিলুনা আপনাকে আবার পড়ে সম্মতি দিতে বলবে।'],
      },
    ],
    notLawyer: 'বিলুনা দলের লেখা। এখনো কোনো আইনজীবী যাচাই করেননি।',
  },
}

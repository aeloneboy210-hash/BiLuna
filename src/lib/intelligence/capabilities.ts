/**
 * The 35 parts of BiLuna Intelligence from the owner's blueprint, and how far each is built.
 * working = works in the demo today · demo = planned for this demo · roadmap = shown, not built.
 * Change a status here when a feature ships; tests/lib/intelligence/capabilities.test.ts checks the list.
 */
export type CapabilityStatus = 'working' | 'demo' | 'roadmap'
type Text = { en: string; bn: string }
export type Capability = { id: string; name: Text; status: CapabilityStatus; where: Text }
export type CapabilityGroup = { id: string; name: Text; items: Capability[] }

const c = (id: string, en: string, bn: string, status: CapabilityStatus, whereEn: string, whereBn: string): Capability => ({
  id,
  name: { en, bn },
  status,
  where: { en: whereEn, bn: whereBn },
})

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    id: 'core',
    name: { en: 'Core AI', bn: 'মূল এআই' },
    items: [
      c('reasoning', 'AI Reasoning Engine', 'এআই যুক্তি ইঞ্জিন', 'working', 'Answers in the Health chat', 'হেলথ চ্যাটের উত্তর'),
      c('medicalKnowledge', 'Medical Knowledge Engine', 'চিকিৎসা জ্ঞান ইঞ্জিন', 'working', 'Not yet reviewed by a doctor', 'এখনো ডাক্তার দ্বারা যাচাই হয়নি'),
      c('voice', 'Voice Intelligence', 'ভয়েস ইন্টেলিজেন্স', 'demo', 'Speak and listen in the chat', 'চ্যাটে বলা ও শোনা'),
      c('image', 'Image Intelligence', 'ছবি ইন্টেলিজেন্স', 'demo', 'Report and prescription upload', 'রিপোর্ট ও প্রেসক্রিপশন আপলোড'),
      c('multilingual', 'Multilingual Intelligence', 'বহুভাষিক ইন্টেলিজেন্স', 'working', 'Bangla and English replies', 'বাংলা ও ইংরেজি উত্তর'),
      c('contextMemory', 'Context Memory Engine', 'প্রসঙ্গ স্মৃতি ইঞ্জিন', 'working', 'Your health profile, with your consent', 'আপনার সম্মতিতে স্বাস্থ্য প্রোফাইল'),
      c('personalization', 'AI Personalization', 'এআই ব্যক্তিগতকরণ', 'working', 'Answers that consider your profile', 'প্রোফাইল বিবেচনা করে উত্তর'),
      c('safety', 'Medical Safety Engine', 'চিকিৎসা নিরাপত্তা ইঞ্জিন', 'working', 'Checks every reply before you see it', 'প্রতিটি উত্তর দেখানোর আগে যাচাই'),
      c('sourceVerification', 'Source Verification', 'উৎস যাচাই', 'roadmap', 'Checking answers against official sources', 'সরকারি উৎসের সঙ্গে উত্তর মেলানো'),
      c('visualization3d', '3D Visualization Engine', 'থ্রিডি ভিজ্যুয়ালাইজেশন ইঞ্জিন', 'demo', 'The 3D body', 'থ্রিডি শরীর'),
      c('summarization', 'AI Summarization', 'এআই সারাংশ', 'demo', 'Consultation Prep summary', 'কনসালটেশন প্রস্তুতির সারাংশ'),
      c('translation', 'AI Translation', 'এআই অনুবাদ', 'roadmap', 'Translating reports and documents', 'রিপোর্ট ও নথি অনুবাদ'),
    ],
  },
  {
    id: 'specialized',
    name: { en: 'Specialized intelligence', bn: 'বিশেষায়িত ইন্টেলিজেন্স' },
    items: [
      c('personality', 'Personality Engine', 'ব্যক্তিত্ব ইঞ্জিন', 'working', 'Compassionate, clear, non-judgmental', 'সহানুভূতিশীল, স্পষ্ট, বিচারহীন'),
      c('emotional', 'Emotional Intelligence', 'আবেগীয় ইন্টেলিজেন্স', 'working', 'Notices worry and answers it first', 'দুশ্চিন্তা বুঝে আগে সাড়া দেয়'),
      c('accessibility', 'Accessibility Intelligence', 'সহজলভ্যতা ইন্টেলিজেন্স', 'roadmap', 'Adapting to visual or reading needs', 'দৃষ্টি বা পড়ার প্রয়োজনে মানিয়ে নেওয়া'),
      c('emergency', 'Emergency Intelligence', 'জরুরি ইন্টেলিজেন্স', 'demo', 'Emergency card for danger words', 'বিপদের শব্দে জরুরি কার্ড'),
      c('feedback', 'Feedback & Improvement Engine', 'মতামত ও উন্নয়ন ইঞ্জিন', 'working', '👍 / 👎 on replies, never training data', 'উত্তরে 👍 / 👎, কখনো ট্রেনিং ডেটা নয়'),
      c('knowledgeUpdates', 'Continuous Knowledge Updates', 'নিয়মিত জ্ঞান হালনাগাদ', 'roadmap', 'Reviewed updates to medical knowledge', 'যাচাই করা চিকিৎসা জ্ঞান হালনাগাদ'),
    ],
  },
  {
    id: 'coordination',
    name: { en: 'Central coordination', bn: 'কেন্দ্রীয় সমন্বয়' },
    items: [
      c('coordinator', 'Central AI Coordinator', 'কেন্দ্রীয় এআই সমন্বয়ক', 'roadmap', 'Routing a request to the right modules', 'অনুরোধ সঠিক মডিউলে পাঠানো'),
      c('crossModule', 'Cross-Module Communication', 'মডিউল-মধ্যবর্তী যোগাযোগ', 'roadmap', 'Modules working together', 'মডিউলগুলোর একসঙ্গে কাজ'),
      c('contextSharing', 'Context Sharing', 'প্রসঙ্গ শেয়ারিং', 'demo', 'Share a summary with your doctor, logged', 'ডাক্তারের সঙ্গে সারাংশ শেয়ার, রেকর্ডসহ'),
      c('orchestration', 'Task Orchestration', 'কাজের সমন্বয়', 'roadmap', 'Multi-step tasks across modules', 'একাধিক ধাপের কাজ'),
      c('unifiedResponse', 'Unified Response Engine', 'সমন্বিত উত্তর ইঞ্জিন', 'roadmap', 'One answer from several modules', 'কয়েকটি মডিউল থেকে একটি উত্তর'),
      c('permissions', 'Permission Controller', 'অনুমতি নিয়ন্ত্রক', 'working', 'Database rules: who can see what', 'ডেটাবেস নিয়ম: কে কী দেখতে পারে'),
      c('conflicts', 'Conflict Detection', 'বিরোধ শনাক্তকরণ', 'roadmap', 'Spotting answers that disagree', 'পরস্পরবিরোধী উত্তর ধরা'),
    ],
  },
  {
    id: 'privacy',
    name: { en: 'Privacy, safety and reliability', bn: 'গোপনীয়তা, নিরাপত্তা ও নির্ভরযোগ্যতা' },
    items: [
      c('dataProtection', 'Data Protection', 'ডেটা সুরক্ষা', 'working', 'Only you can read your chats and profile', 'শুধু আপনিই আপনার চ্যাট ও প্রোফাইল দেখেন'),
      c('consent', 'Consent Management', 'সম্মতি ব্যবস্থাপনা', 'working', 'The "use my profile" switch', '"আমার প্রোফাইল ব্যবহার" সুইচ'),
      c('memoryManagement', 'Memory Management', 'স্মৃতি ব্যবস্থাপনা', 'working', 'Review, correct or delete your profile', 'প্রোফাইল দেখা, ঠিক করা বা মুছে ফেলা'),
      c('clinicalValidation', 'Clinical Safety Validation', 'ক্লিনিক্যাল নিরাপত্তা যাচাই', 'working', 'No diagnosis, no dose changes', 'রোগ নির্ণয় নয়, ডোজ পরিবর্তন নয়'),
      c('escalation', 'Emergency Escalation', 'জরুরি এসকেলেশন', 'demo', 'Call 999 card', '৯৯৯-এ কল করার কার্ড'),
      c('oversight', 'Human Oversight', 'মানব তত্ত্বাবধান', 'demo', 'Doctor reviews a shared summary', 'ডাক্তার শেয়ার করা সারাংশ দেখেন'),
      c('audit', 'Audit & Monitoring', 'অডিট ও পর্যবেক্ষণ', 'working', 'The activity log below', 'নিচের কার্যক্রম লগ'),
    ],
  },
  {
    id: 'additions',
    name: { en: 'Approved additions', bn: 'অনুমোদিত সংযোজন' },
    items: [
      c('confidence', 'AI Confidence & Uncertainty', 'এআই আত্মবিশ্বাস ও অনিশ্চয়তা', 'working', 'The "How sure I am" line', '"আমি কতটা নিশ্চিত" লাইন'),
      c('handoff', 'Human Handoff System', 'মানুষের কাছে হস্তান্তর', 'demo', 'Consultation Prep and doctor review', 'কনসালটেশন প্রস্তুতি ও ডাক্তারের পর্যালোচনা'),
      c('offline', 'Offline Intelligence', 'অফলাইন ইন্টেলিজেন্স', 'demo', 'Saved summary and contacts without internet', 'ইন্টারনেট ছাড়া সংরক্ষিত তথ্য'),
    ],
  },
]

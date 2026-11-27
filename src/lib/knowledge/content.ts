import type { CardId } from './catalog'

/**
 * The text of each guideline card, for the AI to read before it answers, plus the words that bring the card up.
 * Written in plain words from the sources in catalog.ts. No card gives a medicine amount: a doctor or pharmacist
 * decides doses. Keywords: English words match at the start of a word ("vomit" finds "vomiting"); Bangla and
 * Banglish match anywhere in the message.
 */
export type CardContent = { keywords: string[]; facts: string }

export const CONTENT: Record<CardId, CardContent> = {
  fever: {
    keywords: ['fever', 'temperature', 'feverish', 'shivering', 'জ্বর', 'গা গরম', 'শরীর গরম', 'কাঁপুনি', 'jor', 'jhor', 'jwor'],
    facts: `- A fever (38°C or more) is usually the body fighting an infection, such as a cold or flu, and often gets better on its own.
- At home: rest, drink plenty of water so the urine is light yellow, wear light clothes, and wipe the body with a cool damp cloth.
- A pharmacist can suggest a fever medicine such as paracetamol; the amount must follow the packet or the pharmacist.
- In Bangladesh, a fever lasting more than 2 to 3 days, or with body aches, rash or pain behind the eyes, should be checked by a doctor and tested, because dengue and typhoid are common.
- Get help urgently for fever with a stiff neck, a rash that does not fade when pressed, confusion or extreme sleepiness, trouble breathing, a seizure, or a fever that keeps rising.`,
  },
  dengue: {
    keywords: ['dengue', 'platelet', 'pain behind the eyes', 'ডেঙ্গু', 'ডেঙ্গি', 'প্লাটিলেট', 'প্লেটলেট', 'চোখের পেছনে ব্যথা', 'dengu'],
    facts: `- Dengue is a virus spread by mosquito bites. It causes a high fever with headache, pain behind the eyes, muscle and joint pain, nausea, vomiting or a rash.
- There is no specific medicine for dengue. Early care at a doctor and a blood test greatly lower the risk of serious illness.
- At home: rest and drink plenty of fluids (water, ORS, soup, fruit juice).
- For fever and pain, paracetamol is the usual choice. Do not take aspirin or ibuprofen-type painkillers for dengue: they raise the risk of bleeding.
- Danger time: around 3 to 7 days after the illness starts, often just as the fever goes down. Go to a hospital at once for severe belly pain, vomiting that keeps coming, fast breathing, bleeding gums or nose, blood in vomit or stool, great tiredness or restlessness, very strong thirst, or pale and cold skin.
- Prevention: stop mosquitoes breeding by emptying standing water (pots, tyres, flower tubs), and use nets and covering clothes, also in the daytime.`,
  },
  diarrhoea: {
    keywords: ['diarrhoea', 'diarrhea', 'loose motion', 'loose stool', 'watery stool', 'ors', 'cholera', 'dysentery', 'ডায়রিয়া', 'ডাইরিয়া', 'পাতলা পায়খানা', 'পাতলা পায়খানা', 'স্যালাইন', 'খাবার স্যালাইন', 'আমাশয়', 'কলেরা', 'patla paykhana', 'saline', 'dairia'],
    facts: `- The biggest danger in diarrhoea is losing too much water and salts (dehydration), especially for children.
- ORS (oral rehydration salts, খাবার স্যালাইন) replaces what is lost: mix one packet with the amount of clean water written on the packet, and sip it often, after every loose stool. Throw away mixed ORS the packet says not to keep.
- Keep eating normal food, and keep breastfeeding babies. Health workers usually give children with diarrhoea zinc too; ask them.
- Wash hands with soap and drink safe water.
- See a doctor soon for blood in the stool, diarrhoea lasting 14 days or more, high fever, or if it is not getting better.
- Go to a hospital at once if the person cannot drink, is very sleepy or hard to wake, has sunken eyes, passes very little or no urine, or vomits everything.`,
  },
  cold: {
    keywords: ['cold', 'runny nose', 'blocked nose', 'sneez', 'sore throat', 'cough', 'flu', 'সর্দি', 'ঠান্ডা লেগেছে', 'ঠান্ডা লাগা', 'হাঁচি', 'নাক বন্ধ', 'গলা ব্যথা', 'কাশি', 'kashi', 'sordi', 'thanda'],
    facts: `- A cold is a mild virus infection of the nose and throat: runny or blocked nose, sneezing, sore throat, cough, tiredness. It usually gets better in 1 to 2 weeks.
- At home: rest, drink plenty of water, warm drinks with lemon and honey (no honey for babies under 1 year), and gargle with warm salt water (adults).
- Antibiotics do not help a cold.
- A pharmacist can suggest medicines that ease the symptoms; some are not suitable for children or in pregnancy.
- See a doctor if a high temperature lasts more than 3 days, symptoms get worse, a cough lasts more than 3 weeks, or the person has a long-term illness such as diabetes, heart, lung or kidney disease.
- Get help urgently for shortness of breath, chest pain, or coughing up blood.`,
  },
  pneumonia: {
    keywords: ['pneumonia', 'fast breathing', 'chest indrawing', 'chest pulling in', 'breathing fast', 'নিউমোনিয়া', 'নিউমোনিয়া', 'দ্রুত শ্বাস', 'শ্বাস দ্রুত', 'বুক দেবে যায়', 'বুকের খাঁচা', 'নিমোনিয়া', 'numonia'],
    facts: `- Pneumonia is an infection of the lungs. It is the biggest infectious cause of death in young children, and is common in South Asia.
- Signs: cough, fast or difficult breathing, fever, chest pain, tiredness. In a child, the lower chest may pull in when they breathe in, and some babies have fast breathing without a cough.
- Pneumonia needs to be seen by a doctor or health worker soon; when it is caused by bacteria it is treated with antibiotics that a doctor prescribes.
- Go to a hospital at once if the person struggles to breathe, has blue or grey lips, cannot drink or breastfeed, is very sleepy, or has a seizure.
- Protection: breastfeeding, good food, vaccines, clean air indoors (smoke-free cooking), and handwashing.`,
  },
  gastric: {
    keywords: ['gastric', 'acidity', 'acid reflux', 'heartburn', 'indigestion', 'bloat', 'burning chest', 'sour burp', 'গ্যাস্ট্রিক', 'গ্যাস', 'অ্যাসিডিটি', 'এসিডিটি', 'বুক জ্বালা', 'বুকজ্বালা', 'টক ঢেকুর', 'পেট ফাঁপা', 'বদহজম', 'অম্বল', 'gas', 'buk jala'],
    facts: `- Acidity or heartburn is a burning feeling in the chest or upper belly, often after eating, sometimes with bloating, burping or a sour taste. It is common and usually mild.
- At home: eat smaller meals, do not lie down soon after eating, eat the evening meal earlier, cut down on oily or spicy food, tea, coffee and fizzy drinks, and stop smoking. Stress can make it worse.
- Do not take painkillers such as ibuprofen or aspirin unless a doctor prescribed them: they can make it worse.
- A pharmacist can suggest a medicine for acidity.
- See a doctor if it happens most days, pharmacy medicine does not help, food gets stuck when swallowing, there is weight loss without trying, or vomiting keeps coming.
- Get help urgently for vomiting blood, black stool, or chest pain that spreads to the arm, jaw or back with sweating or breathlessness, which can be the heart, not the stomach.`,
  },
  headache: {
    keywords: ['headache', 'migraine', 'head pain', 'head ache', 'মাথাব্যথা', 'মাথা ব্যথা', 'মাথা ধরা', 'মাথা ধরেছে', 'মাইগ্রেন', 'matha betha', 'matha bytha'],
    facts: `- Headaches are very common; most are tension-type headaches or migraine and are not dangerous. Migraine often comes with nausea and dislike of light and sound.
- At home: rest in a quiet dark room, drink water, eat regular meals, sleep enough, and take breaks from screens.
- A pharmacist can suggest a painkiller. Taking painkillers for headache on too many days can itself cause headaches.
- See a doctor if headaches keep coming back, change pattern, or wake you from sleep.
- Get help urgently for a sudden, very severe headache (the worst ever), headache with fever and a stiff neck, after a head injury, with weakness, confusion, trouble speaking or loss of vision, or in pregnancy with swelling or blurred vision.`,
  },
  bloodPressure: {
    keywords: ['blood pressure', 'hypertension', 'high bp', 'bp high', 'bp is', 'pressure is high', 'উচ্চ রক্তচাপ', 'রক্তচাপ', 'প্রেসার', 'প্রেশার', 'হাই প্রেসার', 'বিপি', 'presar'],
    facts: `- High blood pressure (hypertension) means blood presses too hard on the blood vessels. It is very common, and many people do not know they have it because it usually causes no symptoms.
- Over time it can cause stroke, heart attack, heart failure and kidney damage, so checking blood pressure regularly matters, even when feeling well.
- Helpful habits: less salt (also less salty snacks and extra salt at the table), more vegetables and fruit, regular walking or other activity, no tobacco, a healthy weight.
- Blood pressure medicines work well when taken every day. Never stop or change them without the doctor, even when you feel fine.
- Get help urgently for a severe headache, chest pain, trouble breathing, confusion, blurred vision, or signs of a stroke: face drooping, arm weakness, slurred speech. Call 999.`,
  },
  diabetes: {
    keywords: ['diabetes', 'blood sugar', 'sugar level', 'glucose', 'insulin', 'ডায়াবেটিস', 'ডায়াবেটিস', 'সুগার', 'রক্তে চিনি', 'বহুমূত্র', 'ইনসুলিন', 'sugar'],
    facts: `- Diabetes means the blood sugar is too high. Type 2 diabetes is the most common kind; its signs can be mild and take years to notice.
- Common signs: being very thirsty, passing urine often, great tiredness, blurred vision, losing weight without trying, wounds that heal slowly.
- A blood sugar test at a health centre tells if it is diabetes; regular check-ups find it early.
- Helpful habits: regular meals with less sugar, sweets and white rice portions, more vegetables, daily walking, no tobacco, a healthy weight.
- People with diabetes should take their medicines as the doctor prescribed, check their feet every day for cuts or sores, and have their eyes and kidneys checked.
- Get help urgently for confusion, fainting, extreme sleepiness, fast breathing with vomiting, or sweating with shaking and weakness (sugar may be too low).`,
  },
  pregnancy: {
    keywords: ['pregnant', 'pregnancy', 'expecting a baby', 'baby moving', 'গর্ভবতী', 'গর্ভাবস্থা', 'গর্ভাবস্থায়', 'প্রেগন্যান্ট', 'প্রেগনেন্ট', 'পেটে বাচ্চা', 'সন্তানসম্ভবা', 'pregnant', 'gorbhoboti'],
    facts: `- Most pregnancies go well, but every pregnant woman and her family should know the danger signs and plan how to reach a hospital quickly.
- Go to a hospital at once for: bleeding from the vagina; a severe headache that will not go away, blurred vision, or sudden swelling of the face or hands; fits (seizures) or fainting; a high fever; severe belly pain; the baby moving less than usual; water leaking from the vagina; trouble breathing or chest pain.
- After birth, the same applies to heavy bleeding, fever, foul-smelling discharge, and severe headache.
- Regular pregnancy check-ups help find problems early. Take the iron and folic acid tablets the health worker gives.
- Do not take any medicine in pregnancy without asking a doctor or pharmacist first.`,
  },
  childDanger: {
    keywords: ['my child', 'my baby', 'my son', 'my daughter', 'infant', 'newborn', 'toddler', 'শিশু', 'বাচ্চা', 'বাচ্চার', 'ছেলের', 'মেয়ের', 'নবজাতক', 'বাবু', 'bacca', 'baccha'],
    facts: `- Any of these "danger signs" in a sick child means go to a hospital at once: cannot drink or breastfeed; vomits everything; has had a fit (convulsion); is very sleepy, floppy or hard to wake.
- Also urgent: fast breathing or the lower chest pulling in when breathing, blue lips, sunken eyes with very little urine, a rash with high fever, or a fever in a baby under 2 months.
- Newborn babies need a doctor quickly if they feed poorly, are too hot or too cold, or have yellow palms and soles.
- Meanwhile keep the child warm, keep breastfeeding or giving fluids if they can drink, and do not give any medicine without a health worker.
- Children get worse faster than adults, so it is better to see a health worker early.`,
  },
  typhoid: {
    keywords: ['typhoid', 'enteric fever', 'widal', 'টাইফয়েড', 'টাইফয়েড', 'টাইফেড', 'টাইফাইড', 'টাইফয়েড', 'taifoyed', 'typhoid'],
    facts: `- Typhoid is an infection spread through food or water dirtied with stool. It is common in Bangladesh.
- Signs: a fever that lasts and rises over days, tiredness, headache, nausea, belly pain, constipation or diarrhoea, sometimes a rash.
- It needs a doctor and a blood test. It is treated with antibiotics prescribed by the doctor; take the full course. Buying antibiotics without a prescription makes typhoid germs resistant and harder to treat.
- Rest, drink safe fluids, and eat soft food.
- Prevention: safe (boiled or treated) water, well-cooked hot food, handwashing with soap. A typhoid vaccine exists; ask a health worker.
- Get help urgently for severe belly pain, vomiting that keeps coming, blood in stool, confusion or extreme weakness.`,
  },
  jaundice: {
    keywords: ['jaundice', 'yellow eyes', 'yellow skin', 'hepatitis', 'জন্ডিস', 'জণ্ডিস', 'চোখ হলুদ', 'হলুদ চোখ', 'প্রস্রাব হলুদ', 'হেপাটাইটিস', 'jondis', 'jaundis'],
    facts: `- Jaundice is yellow eyes and skin, often with dark urine and pale stool. In Bangladesh it is most often caused by hepatitis E or A, liver infections that spread through dirty water.
- Most people get better with rest over a few weeks, but a doctor should check it with a blood test.
- At home: rest, drink safe water and eat light food. Avoid alcohol, and do not take medicines or herbal remedies a doctor did not prescribe: they can harm the liver.
- A pregnant woman with jaundice must see a doctor at once: hepatitis E can be very dangerous in pregnancy.
- Get help urgently for confusion or extreme sleepiness, bleeding, vomiting that stops eating and drinking, or a swollen belly.
- Prevention: safe drinking water and handwashing.`,
  },
  skin: {
    keywords: ['itch', 'itchy', 'itching', 'scabies', 'rash', 'skin infection', 'ringworm', 'fungal', 'চুলকানি', 'চুলকায়', 'চুলকাচ্ছে', 'খোসপাঁচড়া', 'খোস পাঁচড়া', 'পাঁচড়া', 'ছত্রাক', 'ফুসকুড়ি', 'চর্মরোগ', 'chulkani'],
    facts: `- Scabies is a very common, very itchy skin condition caused by tiny mites. The itch is worse at night, with small bumps between the fingers, on wrists, elbows, waist and private parts. It spreads by close touch and shared clothes or bedding.
- It needs a treatment cream or lotion that a doctor or pharmacist gives. Everyone in the household should be treated at the same time, even those without itch.
- Wash clothes, towels and bedding in hot water or dry them in strong sun; things that cannot be washed can be sealed in a bag for a few days.
- Fungal infections (ringworm, দাদ) look like round itchy patches; keep skin dry and do not share towels. A pharmacist can suggest a cream.
- See a doctor if the skin becomes red, hot, swollen, painful or has pus, or if there is fever: a germ infection may need antibiotics.`,
  },
  asthma: {
    keywords: ['asthma', 'wheez', 'inhaler', 'tight chest', 'chest tightness', 'হাঁপানি', 'হাপানি', 'শ্বাসকষ্ট', 'শ্বাস নিতে কষ্ট', 'বুকে শোঁ শোঁ', 'ইনহেলার', 'হাঁপ', 'hapani', 'shash koshto'],
    facts: `- Asthma is a long-term condition of the airways. Signs: wheezing, cough (often at night), tight chest and shortness of breath. It cannot be cured, but with the right treatment people live normal, active lives.
- Inhaled medicines prescribed by a doctor control asthma; using the inhaler the right way matters, so ask the doctor or pharmacist to show you.
- Avoid triggers: tobacco and cooking smoke, dust, cold air, strong smells, and other things that set off symptoms.
- See a doctor if symptoms happen often, wake you at night, or the inhaler is needed more than usual.
- Call 999 or go to a hospital if breathing is very hard, the person cannot speak in full sentences, lips turn blue or grey, or the reliever inhaler does not help.`,
  },
  anaemia: {
    keywords: ['anaemia', 'anemia', 'low hemoglobin', 'low haemoglobin', 'hb low', 'রক্তস্বল্পতা', 'রক্তশূন্যতা', 'রক্ত কম', 'হিমোগ্লোবিন', 'ফ্যাকাশে', 'roktoshunnota', 'rokto kom'],
    facts: `- Anaemia means too little haemoglobin in the blood to carry oxygen. It is very common in women, pregnant women and young children, and is often caused by too little iron.
- Signs: tiredness, weakness, pale skin and inner eyelids, shortness of breath, dizziness.
- A blood test (haemoglobin) tells if it is anaemia; a doctor finds the reason, which can also be infections, worms, heavy periods or other illnesses.
- Iron-rich foods help: red spinach (লাল শাক), other green leaves, lentils, beans, eggs, small fish, liver and meat. Fruit with vitamin C (such as guava, lemon, amla) helps the body take in iron. Tea right after meals reduces iron uptake.
- Take iron tablets only as a doctor or health worker advises.
- Get help urgently for shortness of breath at rest, chest pain, fainting, or heavy bleeding.`,
  },
  uti: {
    keywords: ['urine infection', 'urinary', 'uti', 'burning urine', 'burning when peeing', 'pain when peeing', 'pee often', 'প্রস্রাবে জ্বালা', 'প্রস্রাব জ্বালা', 'প্রস্রাবের সময় জ্বালা', 'প্রস্রাবে ব্যথা', 'ঘন ঘন প্রস্রাব', 'বারবার প্রস্রাব', 'প্রস্রাবে ইনফেকশন', 'ইউরিন ইনফেকশন', 'প্রস্রাবের ইনফেকশন', 'proshrab jala', 'urine jala'],
    facts: `- A urine infection (UTI) is a germ infection of the bladder or urine tubes. Signs: burning or pain when passing urine, needing to go often or suddenly, lower belly pain, cloudy or bad-smelling urine, sometimes blood in the urine.
- At home: drink enough water so the urine is pale, do not hold urine in, and wipe front to back.
- A doctor decides if antibiotics are needed; do not buy antibiotics without a prescription.
- See a doctor for a first UTI, if you are a man, pregnant, a child, have diabetes, or if symptoms do not improve in 2 days or come back.
- Get help urgently for high fever with shivering, pain in the back or side under the ribs, vomiting, confusion or extreme sleepiness, or passing no urine all day.`,
  },
  allergy: {
    keywords: ['allerg', 'hives', 'itchy eyes', 'swollen lips', 'anaphylaxis', 'অ্যালার্জি', 'এলার্জি', 'এলার্জী', 'চাকা চাকা', 'আমবাত', 'ঠোঁট ফুলে', 'allergy', 'elarji'],
    facts: `- An allergy is the body reacting to something usually harmless, such as dust, pollen, some foods, insect stings or medicines.
- Mild signs: sneezing, runny nose, itchy or watery eyes, itchy raised rash (hives), mild stomach upset.
- The best treatment is avoiding the trigger. A pharmacist can suggest an allergy medicine for mild symptoms.
- Always tell doctors and pharmacists about any medicine you are allergic to, by its exact name.
- Call 999 at once for a severe reaction (anaphylaxis): sudden swelling of the lips, tongue or throat, trouble breathing or wheezing, feeling faint, confusion or collapse. It happens fast and needs a hospital immediately, even if the person seems to get better.`,
  },
  backPain: {
    keywords: ['back pain', 'backache', 'lower back', 'waist pain', 'sciatica', 'কোমর ব্যথা', 'কোমরে ব্যথা', 'পিঠে ব্যথা', 'পিঠ ব্যথা', 'মেরুদণ্ড', 'komor betha', 'pith betha'],
    facts: `- Low back pain is very common and most people have it at some point. It can be a dull ache or sharp pain, sometimes spreading down a leg. Most back pain gets better within a few weeks.
- At home: stay gently active and keep doing daily tasks as much as possible; long bed rest makes it worse. Warmth, gentle stretching and walking help. Lift by bending the knees.
- A pharmacist can suggest a painkiller for a short time.
- See a doctor if the pain lasts more than a few weeks, keeps getting worse, or comes with weight loss or fever.
- Get help urgently for numbness around the private parts or buttocks, losing control of urine or stool, new weakness in the legs, or back pain after a fall or injury.`,
  },
  stress: {
    keywords: ['stress', 'anxious', 'anxiety', 'worried', 'tension', 'overwhelmed', "can't sleep", 'cannot sleep', 'panic', 'depress', 'sad', 'lonely', 'টেনশন', 'দুশ্চিন্তা', 'মানসিক চাপ', 'ঘুম হয় না', 'ঘুম আসে না', 'অস্থির', 'মন খারাপ', 'একা লাগে', 'ভয় লাগে', 'হতাশ', 'tension', 'mon kharap'],
    facts: `- Stress is the worry or tension we feel in hard situations. A little is normal; too much for too long can cause headaches, body pains, an upset stomach, poor sleep, changes in appetite, irritability and trouble concentrating.
- Things that help: keep a daily routine, sleep and wake at regular times, move the body every day (even a walk), eat regular meals, spend time with people you trust and talk about what is worrying you, and take a few slow, deep breaths when feeling tense.
- Avoid coping with tobacco, alcohol or other drugs: they make stress worse.
- See a doctor or counsellor if the stress, sadness or worry lasts for weeks or makes it hard to work, study or look after yourself and family.
- If someone has thoughts of hurting themselves, they need help right now: call 999 or go to the nearest hospital, and stay with someone they trust.`,
  },
}

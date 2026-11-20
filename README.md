# BiLuna

**Your Personal Healthcare AI Companion** — a Bangladesh-first healthcare AI prototype built for an AI congress competition.

This is a demo. Every patient, doctor, hospital and number in it is fictional, and nothing in it is medical advice.

**Live demo:** https://biluna.vercel.app

## For judges: a quick tour

1. Open https://biluna.vercel.app to see the opening animation and the welcome page. Switch between English and বাংলা at the top.
2. Open the **3D body** at https://biluna.vercel.app/lab/body (no sign-in needed). Drag to turn it, pinch or scroll to zoom, and tap any bone or organ to see its name. The Bones and Organs switches hide a layer, and the light-up buttons make an organ glow as "may be involved".
3. Sign in as the patient (the password is shared separately) and open **BiLuna Health** to chat in Bangla or English.
4. Open **BiLuna Intelligence** to see how BiLuna thinks, the safety numbers, the consent-based profile and the activity log.
5. Sign in as the doctor and the hospital to see the other two portals.

## What works today

- Welcome page in English and Bangla
- Sign-in with three demo accounts
- Three portals, each locked to its own role
  - Patient Portal (`/patient`)
  - Healthcare Professional Portal (`/doctor`)
  - Hospitals & Organizations Portal (`/org`)
- The eight-module menu and a roadmap page
- Opening animation with the BiLuna logo
- **BiLuna Health chat** in Bangla and English: possible explanations and next steps, never a diagnosis, and every health answer ends with "How sure I am:". Each reply passes a safety filter before the patient sees it, and each patient may send 40 messages a day (enforced by the database).
  - Compassionate personality, and short follow-up questions when a message is too vague to answer safely
  - 👍 / 👎 on each reply, used only for reviewed improvements, never as training data
- **BiLuna Intelligence** page: how BiLuna thinks, today's numbers (replies, safety checks, follow-up questions, languages), a health profile the patient controls and can switch on or off for chats, an activity log, and the 35-part Intelligence map
- **3D body** (`/lab/body`): a real-anatomy model with 329 bones and 142 organ parts, each one separate and tappable, with names and Bangla group names. Bones load first so the body appears fast (about 1.3 MB in total).

The dashboards show sample data, marked as such on screen.

## Coming next

- The 3D body inside the chat: the patient taps where it hurts, and BiLuna's answer lights up the organ that may be involved (built, being tested)
- Muscles, nerves and blood vessels as extra 3D layers
- BiLuna Medicine, Navigator, Academy and Economics as working modules; Wellness and Careers stay on the roadmap

## Demo accounts

| Email | Portal |
| --- | --- |
| `patient@biluna.demo` | Patient Portal |
| `doctor@biluna.demo` | Healthcare Professional Portal |
| `hospital@biluna.demo` | Hospitals & Organizations Portal |

Passwords are chosen by the project owner and are never stored in this repository.
Only these three accounts can exist: the database refuses any other sign-up (migration 0004).

To reset the demo password, see the comment at the top of `supabase/migrations/0003_lock_demo_setup.sql`.

## How it is built

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Supabase for sign-in and the database
- three.js for the 3D body
- Google Gemini (free tier, `gemini-3.5-flash-lite`) through the Vercel AI SDK; the key lives only on the server as `GOOGLE_GENERATIVE_AI_API_KEY`
- Hosted on Vercel

Roles live in the `profiles` table. Row Level Security lets an account read only its own profile and never change its role. `src/lib/access/route-guard.ts` is the one place that decides who may open which path; the request proxy and every portal page both call it.

## Running it

```bash
cp .env.example .env.local   # then fill in the two Supabase values
npm install
npm run dev
```

## Tests

```bash
npm test          # unit tests
npm run build     # type check and production build
```

Database access tests are in `supabase/tests/`. Run each file in the Supabase SQL editor after all migrations are applied; it rolls itself back and ends with a "passed" row.

## Credits

3D body derived from [Z-Anatomy](https://www.z-anatomy.com) (CC BY-SA 4.0) and BodyParts3D, The Database Center for Life Science (CC BY-SA 2.1 Japan), shared under CC BY-SA 4.0. Kidneys: "Kidney" by Lissie Cowley (CC BY-NC 4.0), used non-commercially. Details in `public/models/ATTRIBUTION.md`.

## Project documents

- Build plans: `docs/superpowers/plans/`

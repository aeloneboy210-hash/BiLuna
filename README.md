# BiLuna

**Your Personal Healthcare AI Companion** — a Bangladesh-first healthcare AI prototype built for an AI congress competition.

This is a demo. Every patient, doctor, hospital and number in it is fictional, and nothing in it is medical advice.

## What works today

- Welcome page in English and Bangla
- Sign-in with three demo accounts
- Three portals, each locked to its own role
  - Patient Portal (`/patient`)
  - Healthcare Professional Portal (`/doctor`)
  - Hospitals & Organizations Portal (`/org`)
- The eight-module menu and a roadmap page
- **BiLuna Health chat** in Bangla and English: possible explanations and next steps, never a diagnosis, and every health answer ends with "How sure I am:". Each reply passes a safety filter before the patient sees it, and each patient may send 40 messages a day (enforced by the database).

The dashboards show sample data, marked as such on screen. The other modules are not built yet.

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

## Project documents

- Build plans: `docs/superpowers/plans/`

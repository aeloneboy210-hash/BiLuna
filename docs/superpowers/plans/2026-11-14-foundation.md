# BiLuna Foundation (Feature 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed BiLuna web app with a welcome screen, sign-in, three role-locked portals, the eight-module menu and a roadmap page, with roles enforced by the database.

**Architecture:** One Next.js app (App Router) hosted on Vercel. Supabase provides sign-in and a Postgres database; a `profiles` table holds each account's role and Row Level Security stops any role change from the browser. A pure `resolveRedirect` function decides who may open which path, and the request interceptor and the portal layouts both call it.

**Tech Stack:** Next.js (latest stable from `create-next-app`), React, TypeScript, Tailwind CSS, `@supabase/supabase-js`, `@supabase/ssr`, Vitest. Hosting: Vercel Hobby. Data: Supabase Free.

**Spec:** "BiLuna Competition Demo — Design v1", https://claude.ai/artifact/QbD1VHMrnCjEopGMqM1EdU. This plan covers only item 1 of that doc's Build order. Features 2 to 16 each get their own plan after the owner accepts the one before.

## Before starting (owner actions)

These block execution and only the owner can do them.

- [ ] Reconnect GitHub in Claude so pushes to `aeloneboy210-hash/BiLuna` are allowed. Today the repo holds only `README.md` and pushes from Claude are refused.
- [ ] Allow package installs in Claude's network settings, then continue in a new chat. Without it `npm` cannot run, so nothing can be built or tested before deploy.
- [ ] Finish Vercel sign-up (the connected account shows no workspace).

## Global Constraints

- Cost is zero. Use only Vercel Hobby and Supabase Free. Never add a payment card or a paid add-on.
- Fictional data only. No real person's name, health detail or contact is ever stored.
- Every page shows the demo banner. English: `Demo — fictional data — not medical advice`. Bangla: `ডেমো — কাল্পনিক তথ্য — চিকিৎসা পরামর্শ নয়`.
- Every user-facing string exists in English and Bangla. English is the default.
- Roles are exactly `patient`, `doctor`, `org_admin`. A role is fixed to the account and cannot be changed from the browser.
- No public sign-up. Only the three demo accounts exist.
- The Supabase service-role key and any future AI key never appear in browser code, in the repo or in chat.
- Portal names are exactly `Patient Portal`, `Healthcare Professional Portal`, `Hospitals & Organizations Portal`.
- Module names are exactly `BiLuna Health`, `BiLuna Intelligence`, `BiLuna Medicine`, `BiLuna Navigator`, `BiLuna Wellness`, `BiLuna Academy`, `BiLuna Careers`, `BiLuna Economics`.
- Layout works at 360 px wide and on a laptop.
- Commit after every task. Commit messages end with the session's attribution lines.

## Review Focus

1. A signed-in doctor types `/patient` or `/org` into the address bar: they land on `/doctor`, never on another role's page. (Task 4)
2. A signed-in patient sends a direct database request to set their own `role` to `org_admin`: the request changes nothing. (Task 3)
3. A session expires or cookies are cleared while a portal is open: the next click goes to `/sign-in`, with no error page. (Task 4)
4. A wrong email or password: one plain message in the chosen language that does not say which of the two was wrong. (Task 4)
5. The language cookie is missing or holds an unknown value: the app shows English and does not crash. (Task 2)

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/lib/modules.ts` | The eight modules: id, name, status |
| `src/lib/portals.ts` | The three roles, their portal names and home paths |
| `src/lib/i18n/dictionaries.ts` | English and Bangla strings |
| `src/lib/i18n/lang.ts` | Read and validate the language cookie |
| `src/lib/access/route-guard.ts` | `resolveRedirect`, the only place access by path is decided |
| `src/lib/supabase/server.ts`, `client.ts` | Supabase clients for server and browser |
| `src/lib/auth/session.ts` | `getSessionRole` |
| Request interceptor at the project root (`middleware.ts` or `proxy.ts`, whichever the installed Next.js version uses) | Calls `resolveRedirect` on every request |
| `src/components/DemoBanner.tsx`, `LanguageSwitch.tsx`, `ModuleMenu.tsx`, `PortalShell.tsx` | Shared UI |
| `src/app/page.tsx` | Welcome screen |
| `src/app/sign-in/page.tsx`, `actions.ts` | Sign-in form, sign-in and sign-out actions |
| `src/app/patient/page.tsx`, `doctor/page.tsx`, `org/page.tsx` | Portal home pages |
| `src/app/roadmap/page.tsx` | Roadmap page |
| `supabase/migrations/0001_foundation.sql` | Roles, profiles, trigger, RLS |
| `supabase/tests/0001_foundation.sql` | Database access tests |
| `tests/**` | Vitest unit tests, mirroring `src/lib` |

---

### Task 1: App scaffold and the module and portal lists

**Files:**
- Create: the Next.js app at the repo root, `vitest.config.ts`, `src/lib/modules.ts`, `src/lib/portals.ts`
- Test: `tests/lib/modules.test.ts`, `tests/lib/portals.test.ts`

**Interfaces:**
- Produces:
  - `type ModuleStatus = 'working' | 'planned'`
  - `type ModuleId = 'health' | 'intelligence' | 'medicine' | 'navigator' | 'wellness' | 'academy' | 'careers' | 'economics'`
  - `MODULES: readonly { id: ModuleId; name: string; status: ModuleStatus }[]`, in the order above
  - `type Role = 'patient' | 'doctor' | 'org_admin'`
  - `PORTALS: Record<Role, { name: string; home: '/patient' | '/doctor' | '/org' }>`

- [ ] **Step 1: Scaffold.** Run `npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --use-npm` in the repo root, keeping `README.md`. Add Vitest with `npm i -D vitest` and a `"test": "vitest run"` script.

- [ ] **Step 2: Write the failing tests**

```ts
// tests/lib/modules.test.ts
import { MODULES } from '@/lib/modules'
test('eight modules with the blueprint names, in order', () => {
  expect(MODULES.map(m => m.name)).toEqual([
    'BiLuna Health', 'BiLuna Intelligence', 'BiLuna Medicine', 'BiLuna Navigator',
    'BiLuna Wellness', 'BiLuna Academy', 'BiLuna Careers', 'BiLuna Economics',
  ])
})
test('every module starts as planned', () => {
  expect(MODULES.every(m => m.status === 'planned')).toBe(true)
})

// tests/lib/portals.test.ts
import { PORTALS } from '@/lib/portals'
test('three portals with exact names and homes', () => {
  expect(PORTALS).toEqual({
    patient: { name: 'Patient Portal', home: '/patient' },
    doctor: { name: 'Healthcare Professional Portal', home: '/doctor' },
    org_admin: { name: 'Hospitals & Organizations Portal', home: '/org' },
  })
})
```

- [ ] **Step 3: Run `npm test`.** Expected: FAIL, modules not found.
- [ ] **Step 4: Implement `src/lib/modules.ts` and `src/lib/portals.ts`** with the exports above. Each later feature flips its module's status to `working`.
- [ ] **Step 5: Run `npm test` and `npm run build`.** Expected: both pass.
- [ ] **Step 6: Commit** `feat: scaffold app with module and portal lists`.

### Task 2: Languages, demo banner and welcome screen

**Files:**
- Create: `src/lib/i18n/dictionaries.ts`, `src/lib/i18n/lang.ts`, `src/components/DemoBanner.tsx`, `src/components/LanguageSwitch.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `tests/lib/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'en' | 'bn'`
  - `LANG_COOKIE = 'biluna_lang'`
  - `parseLang(value: string | undefined): Lang` returns `'en'` for anything other than `'bn'`
  - `getLang(): Promise<Lang>` reads the cookie on the server
  - `getDictionary(lang: Lang): Dictionary`, where `Dictionary` is the type of the English object
  - `setLang(lang: Lang)` server action that writes the cookie

- [ ] **Step 1: Write the failing tests**

```ts
import { dictionaries } from '@/lib/i18n/dictionaries'
import { parseLang } from '@/lib/i18n/lang'
const keys = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`])
test('Bangla has exactly the English keys', () => {
  expect(keys(dictionaries.bn).sort()).toEqual(keys(dictionaries.en).sort())
})
test('no empty strings', () => {
  for (const d of [dictionaries.en, dictionaries.bn])
    expect(Object.values(d).flat().every(v => typeof v !== 'string' || v.trim() !== '')).toBe(true)
})
test('banner copy is exact', () => {
  expect(dictionaries.en.banner).toBe('Demo — fictional data — not medical advice')
  expect(dictionaries.bn.banner).toBe('ডেমো — কাল্পনিক তথ্য — চিকিৎসা পরামর্শ নয়')
})
test.each([undefined, '', 'fr', 'EN', '<script>'])('parseLang(%p) is en', v => {
  expect(parseLang(v)).toBe('en')
})
test('parseLang keeps bn', () => expect(parseLang('bn')).toBe('bn'))
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement the i18n files.** `dictionaries.en.description` is this exact text:

> BiLuna — your personal healthcare AI companion. Feeling sick? Just tell me how you feel. I'll help you understand what might be going on, explain it in simple words, and show it to you in 3D. I'll tell you how to stay safe and when to see a doctor. Give me a medicine name and I'll explain what it's for. Worried about finding a good hospital or doctor? I'll find ones near you that fit your need and help you request an appointment. I'll help you choose the most affordable option too. And that's not all: you can learn about health and medicine with me, and get help with your research.

  Translate it and every other string into plain, everyday Bangla. The owner reviews the Bangla in Task 6.

- [ ] **Step 4: Build the UI.** `layout.tsx` renders `DemoBanner` and `LanguageSwitch` on every page and sets `<html lang>`. `page.tsx` shows the name `BiLuna`, the tagline `Your Personal Healthcare AI Companion`, the description, and one button to `/sign-in`.
- [ ] **Step 5: Run `npm test` and `npm run build`.** Expected: both pass.
- [ ] **Step 6: Commit** `feat: add languages, demo banner and welcome screen`.

### Task 3: Database roles and access rules

**Files:**
- Create: `supabase/migrations/0001_foundation.sql`, `supabase/tests/0001_foundation.sql`

**Interfaces:**
- Produces:
  - Supabase project `biluna-demo`, region `ap-south-1`, Free plan, public sign-up disabled
  - `public.app_role` enum: `patient`, `doctor`, `org_admin`
  - `public.profiles (id uuid primary key references auth.users on delete cascade, role app_role not null, display_name text not null, created_at timestamptz not null default now())`
  - `public.demo_accounts (email text primary key, role app_role not null, display_name text not null)` holding three rows:
    `patient@biluna.demo` / `patient` / `Rahima (demo patient)`,
    `doctor@biluna.demo` / `doctor` / `Dr. Karim (demo doctor)`,
    `hospital@biluna.demo` / `org_admin` / `Demo Hospital Admin`
  - Trigger on `auth.users` insert: creates the profile from the matching `demo_accounts` row; an email with no match gets no profile
  - `public.my_role() returns app_role`, `stable`, `security definer`, returning the caller's role or `null`
  - RLS on both tables. `profiles`: a signed-in user may select only their own row; no insert, update or delete policy. `demo_accounts`: no policies.

- [ ] **Step 1: Create the Supabase project** through the Supabase connector and disable public sign-up in its auth settings.
- [ ] **Step 2: Write the failing test file** `supabase/tests/0001_foundation.sql`. It runs in one transaction that is rolled back, inserts two users into `auth.users` (`patient@biluna.demo` and `doctor@biluna.demo`), and raises an exception unless all of these hold:
  - each user has a profile with the role from `demo_accounts`
  - an inserted `stranger@example.com` has no profile
  - acting as the patient (`set local role authenticated` plus that user's `request.jwt.claims`), `select count(*) from profiles` is 1 and is their own row
  - acting as the patient, `update profiles set role = 'org_admin'` changes 0 rows
  - acting as the patient, `insert into profiles` fails
  - acting as the patient, `select count(*) from demo_accounts` is 0
  - acting as `anon`, `select count(*) from profiles` is 0
  - `my_role()` returns `patient` for the patient and `null` for `anon`
- [ ] **Step 3: Run it** with the connector's SQL tool. Expected: FAIL, relation `profiles` does not exist.
- [ ] **Step 4: Write and apply `0001_foundation.sql`** as a migration.
- [ ] **Step 5: Run the test file again.** Expected: completes with no exception.
- [ ] **Step 6: Run the Supabase security advisors.** Expected: no errors for the `public` schema.
- [ ] **Step 7: Commit** `feat: add roles, profiles and access rules`.

### Task 4: Sign-in, sign-out and the route guard

**Files:**
- Create: `src/lib/access/route-guard.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/auth/session.ts`, `src/app/sign-in/page.tsx`, `src/app/sign-in/actions.ts`, the request interceptor file, `.env.example`
- Test: `tests/lib/route-guard.test.ts`

**Interfaces:**
- Consumes: `Role`, `PORTALS` (Task 1); `getDictionary`, `getLang` (Task 2); `profiles` (Task 3)
- Produces:
  - `resolveRedirect(pathname: string, role: Role | null): string | null` returns the path to redirect to, or `null` to allow
  - `getSessionRole(): Promise<Role | null>` returns `null` when signed out or when the account has no profile
  - `signIn(prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }>` and `signOut(): Promise<void>` server actions
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

- [ ] **Step 1: Write the failing tests**

```ts
import { resolveRedirect as r } from '@/lib/access/route-guard'
test.each(['/', '/roadmap', '/sign-in'])('signed out may open %s', p => expect(r(p, null)).toBeNull())
test.each(['/patient', '/patient/x', '/doctor', '/org', '/org/a/b'])(
  'signed out is sent to sign-in from %s', p => expect(r(p, null)).toBe('/sign-in'))
test.each([
  ['patient', '/patient'], ['doctor', '/doctor'], ['org_admin', '/org'],
] as const)('%s may open own portal', (role, p) => {
  expect(r(p, role)).toBeNull(); expect(r(`${p}/any/depth`, role)).toBeNull()
})
test.each([
  ['patient', '/doctor', '/patient'], ['patient', '/org', '/patient'],
  ['doctor', '/patient', '/doctor'], ['doctor', '/org/x', '/doctor'],
  ['org_admin', '/patient/x', '/org'], ['org_admin', '/doctor', '/org'],
] as const)('%s opening %s goes to %s', (role, p, to) => expect(r(p, role)).toBe(to))
test('signed in is sent home from sign-in', () => expect(r('/sign-in', 'doctor')).toBe('/doctor'))
test('prefix look-alikes are not portals', () => {
  expect(r('/patients', null)).toBeNull(); expect(r('/organization', null)).toBeNull()
})
test('signed in may open welcome and roadmap', () => {
  expect(r('/', 'patient')).toBeNull(); expect(r('/roadmap', 'org_admin')).toBeNull()
})
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement `resolveRedirect`.** A path belongs to a portal when it equals the portal's home or starts with the home plus `/`.
- [ ] **Step 4: Implement the Supabase clients, `getSessionRole`, the actions and the interceptor.** The interceptor refreshes the session, calls `resolveRedirect(pathname, await getSessionRole())` and redirects when it returns a path. It skips static assets. `signIn` returns `dictionary.signIn.error` for any failure, with the same message whether the email or the password was wrong, and for an account with no profile it signs out and returns that same message.
- [ ] **Step 5: Build the sign-in page:** email, password, a submit button, the error line, and labels from the dictionary. No sign-up link and no demo passwords on screen.
- [ ] **Step 6: Run `npm test` and `npm run build`.** Expected: both pass.
- [ ] **Step 7: Commit** `feat: add sign-in and role-based route guard`.

### Task 5: Portal shells, module menu and roadmap

**Files:**
- Create: `src/components/PortalShell.tsx`, `src/components/ModuleMenu.tsx`, `src/app/patient/page.tsx`, `src/app/doctor/page.tsx`, `src/app/org/page.tsx`, `src/app/roadmap/page.tsx`
- Test: `tests/lib/module-links.test.ts`

**Interfaces:**
- Consumes: `MODULES`, `PORTALS`, `getSessionRole`, `signOut`, `getDictionary`
- Produces: `moduleHref(m: { id: ModuleId; status: ModuleStatus }): string` in `src/lib/modules.ts`, returning `/patient/<id>` when `working` and `/roadmap#<id>` when `planned`

- [ ] **Step 1: Write the failing test**

```ts
import { moduleHref } from '@/lib/modules'
test('planned modules link to the roadmap', () =>
  expect(moduleHref({ id: 'wellness', status: 'planned' })).toBe('/roadmap#wellness'))
test('working modules link into the patient portal', () =>
  expect(moduleHref({ id: 'health', status: 'working' })).toBe('/patient/health'))
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement `moduleHref` and the UI.** `PortalShell` shows the portal name, the signed-in display name, a sign-out button and its children. Each portal page calls `getSessionRole` itself and redirects through `resolveRedirect` as a second check. The Patient Portal home shows `ModuleMenu` with all eight modules, each with a `Coming next` label while planned. The doctor and org homes show their portal name and one line saying what will appear there. `/roadmap` lists all eight modules with an element id equal to the module id, the module's one-line purpose from Blueprint v1.0 section 1, and its status.
- [ ] **Step 4: Run `npm test` and `npm run build`.** Expected: both pass.
- [ ] **Step 5: Commit** `feat: add portal shells, module menu and roadmap`.

### Task 6: Deploy, demo accounts and acceptance

**Files:**
- Modify: `README.md` (what the app is, the three demo emails, how to run tests; no passwords)

- [ ] **Step 1: Push to GitHub** and create the Vercel project `biluna` from the repo on the Hobby plan. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for production and preview.
- [ ] **Step 2: Add the deployed URL** to the Supabase auth site URL and redirect list.
- [ ] **Step 3: Owner creates the three demo users** in the Supabase dashboard (Authentication, Add user) with the three emails from Task 3 and passwords the owner chooses. Passwords are never sent in chat. Then confirm with SQL that `profiles` holds exactly three rows with the right roles.
- [ ] **Step 4: Check the build and runtime logs** on Vercel. Expected: build succeeded, no runtime errors.
- [ ] **Step 5: Walk the acceptance list on the live link**, in a laptop browser and at 360 px wide:
  - welcome screen shows the description and the banner; switching to Bangla changes every string and survives a reload
  - each demo account lands on its own portal and shows its display name
  - while signed in as the doctor, opening `/patient` and `/org` lands on `/doctor`
  - a wrong password shows one plain message in the chosen language
  - after sign-out, the browser Back button does not reveal a portal
  - the patient menu shows eight modules, each opening its roadmap entry
  - with cookies cleared while a portal is open, the next click goes to `/sign-in`
- [ ] **Step 6: Owner reviews the Bangla wording** and the look on their own phone, then accepts or lists changes.
- [ ] **Step 7: Commit** `docs: describe the demo and its accounts`.

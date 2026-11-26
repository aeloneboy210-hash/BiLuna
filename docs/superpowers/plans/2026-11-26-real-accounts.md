# Step 2 — Real accounts (plan, 26 Nov 2026)

Goal: every real person gets their own private BiLuna account. The shared "Try as …" demo stays for
judges, with made-up data only, and can never see or receive a real person's data.

Owner's choices: sign up with **Google** and with **email + password**. Zero cost.

## What people will see

1. **Sign-in page** (`/sign-in`)
   - "Continue with Google"
   - "Create an account" (name, email, password of 8+ characters) and "Sign in" with email
   - "Forgot password?" (reset link by email)
   - A separate "Try the demo" box with the three demo buttons and a warning: shared demo account,
     never type real health information.
2. **Confirm your email**: after email sign-up, a "check your inbox" screen; the link signs them in.
3. **Welcome and consent** (first sign-in only, cannot be skipped). Plain words, English and Bangla:
   - BiLuna is an AI, not a doctor; it does not diagnose or give doses.
   - In an emergency call 999.
   - What is stored (chats, profile if they choose, summaries), who can see it (only them; a doctor
     only what they choose to share, until they stop), and that they can download or delete it.
   - Age: 18 or older, or a parent or guardian using it for their child.
   - Checkboxes for the Terms and the Privacy Policy, then "Start using BiLuna".
4. **Privacy Policy** and **Terms** pages (`/privacy`, `/terms`), English and Bangla, linked in the
   footer and on the consent screen. Marked: written by the BiLuna team, not yet reviewed by a lawyer.
5. **Account page** (from the ⚙️ menu, signed in): name, language, "Download my data" (one file with
   all their chats, profile and summaries), "Delete my account" (asks to type DELETE; removes
   everything for good).
6. **Banner**: demo accounts keep "Demo — fictional data — not medical advice"; real accounts see
   "BiLuna is not a doctor. In an emergency call 999."
7. **Doctor sharing**: there are no verified doctors yet, so a real patient can make the summary
   (to show or print for their own doctor) but the Share button says "No verified doctors on BiLuna
   yet". The demo doctor can never receive a real patient's summary.

## How it is kept safe (enforced by the database, tested)

- New accounts are always **patients**. Doctor and hospital roles are given only by hand.
- Each profile is marked demo or real. A real patient cannot share with the demo doctor; the demo
  accounts cannot see real data. All existing per-person rules (RLS) keep working per account.
- Using BiLuna requires the consent to be recorded (version and time) — checked on the server.
- Delete my account: a database function deletes only the signed-in person's own data and login.
- Daily limit (150 messages/summaries) applies to each account.
- No admin key in the app. Secrets (Google client secret, Gmail app password) go only into the
  Supabase dashboard, typed by the owner.

## What the owner sets up (step-by-step instructions given at that time)

1. Google Cloud: a free project with an OAuth client for BiLuna; paste its ID and secret into
   Supabase (Authentication → Providers → Google).
2. A new Gmail just for BiLuna (for example biluna.help@gmail.com), with 2-Step Verification and an
   App Password; paste into Supabase (Authentication → SMTP). Free: up to 500 emails a day.
3. Supabase → Authentication → URL Configuration: site address and allowed return addresses.

## Honest limits

- The free AI allowance is about 200 BiLuna replies a day **for everyone together**. When it runs
  out, people see "BiLuna is busy, try later" until the next day. Fine for a first small group of
  real users; more users later will need a paid plan or another free model.
- Privacy Policy and Terms are not a lawyer's work.
- Bangladesh's data-protection rules should be checked before a public launch.

## Build order (each tested, then previewed, then shown to the owner)

1. Database: demo/real flag, new-user trigger (patients only), consent record, sharing rule,
   delete-my-account and download functions, with database tests.
2. Sign-in page with email sign-up/sign-in/reset (works with the test email limit first).
3. Google sign-in (after the owner's Google setup).
4. Consent screen, Privacy and Terms pages.
5. Account page: language, download, delete.
6. Banner and sharing changes; full check; live.

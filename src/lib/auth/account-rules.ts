/** Checks for the sign-up and new-password forms. Shared by the server actions and their tests. */

export const PASSWORD_MIN = 8
/** The most the password store reads (bcrypt): a longer password would be cut without telling anyone. */
export const PASSWORD_MAX = 72
export const NAME_MAX = 80

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function cleanEmail(value: unknown): string | null {
  const email = String(value ?? '').trim().toLowerCase()
  return email.length <= 254 && EMAIL.test(email) ? email : null
}

export function cleanName(value: unknown): string | null {
  const name = String(value ?? '')
    .replace(/[\u0000-\u001F\u007F​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return name && [...name].length <= NAME_MAX ? name : null
}

/** Counted in bytes, as the password store counts them: Bangla letters take 3 bytes each. */
export function passwordOk(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const bytes = new TextEncoder().encode(value).length
  return value.length >= PASSWORD_MIN && bytes <= PASSWORD_MAX
}

/** The three shared demo accounts may not be signed up for, reset or signed into with a typed password by visitors. */
export const DEMO_DOMAIN = '@biluna.demo'
export const isDemoEmail = (email: string) => email.endsWith(DEMO_DOMAIN)

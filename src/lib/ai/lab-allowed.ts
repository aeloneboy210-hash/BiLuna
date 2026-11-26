/**
 * The model test pages spend the free AI allowance, so they fail closed: they exist only on Vercel preview
 * links and in local development, never in production or anywhere VERCEL_ENV is missing or unexpected.
 */
export function labAllowed(): boolean {
  return process.env.VERCEL_ENV === 'preview' || (!process.env.VERCEL && process.env.NODE_ENV === 'development')
}

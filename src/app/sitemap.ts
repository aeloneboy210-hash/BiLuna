import type { MetadataRoute } from 'next'

const BASE = 'https://biluna.vercel.app'

/** The public pages Google may list. Everything behind sign-in stays out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/sign-up`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/sign-in`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/roadmap`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}

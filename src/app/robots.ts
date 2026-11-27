import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/patient', '/doctor', '/org', '/account', '/welcome', '/auth', '/lab', '/setup', '/reset-password'],
    },
    sitemap: 'https://biluna.vercel.app/sitemap.xml',
  }
}

const PRODUCTION_APP_URL = 'https://www.fero-elibrary.shop'

/**
 * Returns the canonical URL used in server-generated links.
 * Production auth links must never inherit Vercel's deployment URL.
 */
export function getCanonicalAppUrl(): string {
  if (process.env.NODE_ENV === 'production') return PRODUCTION_APP_URL
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export { PRODUCTION_APP_URL }

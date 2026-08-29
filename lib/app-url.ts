const PRODUCTION_APP_URL = 'https://www.fero-elibrary.shop'

/**
 * Returns the canonical URL used in server-generated links.
 * Production auth links must never inherit Vercel's deployment URL.
 */
export function getCanonicalAppUrl(): string {
  if (process.env.NODE_ENV === 'production') return PRODUCTION_APP_URL
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function toBrandedActionLink(firebaseLink: string): string {
  const generated = new URL(firebaseLink)
  const nestedLink = generated.searchParams.get('link')
  const source = nestedLink ? new URL(nestedLink) : generated
  const branded = new URL(`${getCanonicalAppUrl()}/auth/action`)

  for (const key of ['mode', 'oobCode', 'apiKey', 'continueUrl', 'lang']) {
    const value = source.searchParams.get(key)
    if (value) branded.searchParams.set(key, value)
  }

  if (!branded.searchParams.has('mode') || !branded.searchParams.has('oobCode')) {
    throw new Error('Firebase generated an action link without the required action parameters')
  }

  return branded.toString()
}

export { PRODUCTION_APP_URL }

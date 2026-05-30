/**
 * Sentry client-side initialisation.
 *
 * Active only when @sentry/nextjs is installed AND NEXT_PUBLIC_SENTRY_DSN is set.
 * Designed to no-op silently if the SDK isn't present, so the app keeps building
 * even before you `npm i @sentry/nextjs`.
 *
 * To activate:
 *   1. npm i @sentry/nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN in Vercel env vars
 *   3. Redeploy
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  // Dynamic import so the absence of the package doesn't break the build.
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
        // Lower in production once you have data volume baselined.
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.0,
        replaysOnErrorSampleRate: 1.0,
        // Don't leak Firebase ID tokens, Paystack secrets, etc.
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['Authorization']
            delete event.request.headers['cookie']
            delete event.request.headers['Cookie']
          }
          return event
        },
        ignoreErrors: [
          // Browser noise we don't care about
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'NetworkError when attempting to fetch resource',
        ],
      })
    })
    .catch(() => {
      // SDK not installed yet — silently skip.
    })
}

export {}

/**
 * Sentry server-side initialisation (Node runtime — API routes, server components).
 *
 * Active only when @sentry/nextjs is installed AND SENTRY_DSN is set.
 */
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event) {
          // Scrub auth headers and Paystack/Coinbase secrets from server errors
          if (event.request?.headers) {
            const sensitive = ['authorization', 'cookie', 'x-paystack-signature', 'x-cc-webhook-signature']
            sensitive.forEach((h) => {
              if (event.request?.headers) {
                delete event.request.headers[h]
                delete event.request.headers[h.toLowerCase()]
              }
            })
          }
          // Scrub any field that smells like a secret
          if (event.extra) {
            for (const key of Object.keys(event.extra)) {
              if (/secret|password|token|key|bvn/i.test(key)) {
                event.extra[key] = '[REDACTED]'
              }
            }
          }
          return event
        },
      })
    })
    .catch(() => {})
}

export {}

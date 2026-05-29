/**
 * Distributed rate-limit store with in-memory fallback.
 *
 * Uses the Upstash Redis REST API (`REDIS_URL` + `REDIS_TOKEN`) when configured
 * so counters survive across serverless instances. Falls back to an in-process
 * Map for local development.
 *
 * Edge runtime safe: only uses `fetch`, no Node imports.
 */

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
  limit: number
  resetAt: number
}

interface InMemoryRecord {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, InMemoryRecord>()

const REDIS_URL = process.env.REDIS_URL
const REDIS_TOKEN = process.env.REDIS_TOKEN
const REDIS_ENABLED = Boolean(REDIS_URL && REDIS_TOKEN)

/**
 * Atomic INCR + EXPIRE (only sets TTL when key is first created) on Upstash.
 * Returns the post-increment count and the seconds-until-reset.
 */
async function incrUpstash(
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttl: number } | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null

  try {
    // Pipeline: INCR key, EXPIRE key windowSeconds NX, TTL key
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds), 'NX'],
        ['TTL', key],
      ]),
      // Don't let a slow Redis stall API requests forever
      signal: AbortSignal.timeout(1500),
    })

    if (!res.ok) return null
    const data = (await res.json()) as Array<{ result?: number; error?: string }>
    const count = data[0]?.result
    const ttl = data[2]?.result

    if (typeof count !== 'number' || typeof ttl !== 'number') return null
    return { count, ttl: ttl > 0 ? ttl : windowSeconds }
  } catch (err) {
    // Network/timeout — fall back to in-memory so we still rate-limit *somewhat*
    return null
  }
}

function incrMemory(key: string, windowSeconds: number): { count: number; ttl: number } {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = memoryStore.get(key)

  if (!record || now >= record.resetAt) {
    const fresh = { count: 1, resetAt: now + windowMs }
    memoryStore.set(key, fresh)
    return { count: 1, ttl: windowSeconds }
  }

  record.count += 1
  return { count: record.count, ttl: Math.max(1, Math.ceil((record.resetAt - now) / 1000)) }
}

export async function checkRateLimit(
  identifier: string,
  config: { windowMs: number; maxRequests: number }
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000))
  const key = `rl:${identifier}`

  const result = REDIS_ENABLED
    ? (await incrUpstash(key, windowSeconds)) ?? incrMemory(key, windowSeconds)
    : incrMemory(key, windowSeconds)

  const allowed = result.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - result.count)
  const resetAt = Math.floor(Date.now() / 1000) + result.ttl

  return {
    allowed,
    remaining,
    limit: config.maxRequests,
    resetAt,
    retryAfter: allowed ? undefined : result.ttl,
  }
}

export function isRedisRateLimitEnabled() {
  return REDIS_ENABLED
}

/**
 * Periodically drop expired in-memory records to prevent unbounded growth
 * on long-running dev servers. Safe to call on every request — cheap when small.
 */
let lastSweep = 0
export function sweepMemoryStore() {
  const now = Date.now()
  if (now - lastSweep < 30_000) return
  lastSweep = now
  for (const [key, record] of memoryStore.entries()) {
    if (now >= record.resetAt) memoryStore.delete(key)
  }
}

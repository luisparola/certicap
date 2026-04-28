interface RateRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateRecord>()
let lastCleanup = 0

function cleanup(now: number) {
  if (now - lastCleanup < 5 * 60_000) return
  lastCleanup = now

  for (const [key, val] of Array.from(store.entries())) {
    if (now > val.resetAt) store.delete(key)
  }
}

export function rateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  cleanup(now)

  const record = store.get(identifier)
  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) return { allowed: false, remaining: 0 }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

// Rate limit por instancia serverless. Para produccion robusta usar Upstash KV o Redis.

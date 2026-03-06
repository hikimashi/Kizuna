export default defineEventHandler(async (event) => {
  type GraphqlBody = {
    query?: string
    variables?: Record<string, any>
    token?: string
    cacheTtlMs?: number
    skipCache?: boolean
  }

  type CacheEntry = {
    expiresAt: number
    payload: any
    statusCode: number
  }

  type RateLimitEntry = {
    count: number
    resetAt: number
  }

  type RedisClientLike = {
    isOpen?: boolean
    connect: () => Promise<void>
    get: (key: string) => Promise<string | null>
    setEx: (key: string, ttlSeconds: number, value: string) => Promise<unknown>
  }

  const body = await readBody<GraphqlBody>(event)

  if (!body?.query) {
    setResponseStatus(event, 400)
    return {
      errors: [{ message: 'Missing AniList GraphQL query.' }]
    }
  }

  const query = String(body.query)
  const variables = body.variables ?? {}
  const token = body.token ? String(body.token) : ''
  const isMutation = /^\s*mutation\b/i.test(query)
  const skipCache = Boolean(body.skipCache) || isMutation

  const globalState = globalThis as typeof globalThis & {
    __anilistCache?: Map<string, CacheEntry>
    __anilistInFlight?: Map<string, Promise<{ statusCode: number; payload: any }>>
    __anilistRateLimit?: Map<string, RateLimitEntry>
    __anilistRedisClientPromise?: Promise<RedisClientLike | null>
    __anilistRedisDisabled?: boolean
  }

  const cache = globalState.__anilistCache ?? new Map<string, CacheEntry>()
  const inFlight = globalState.__anilistInFlight ?? new Map<string, Promise<{ statusCode: number; payload: any }>>()
  const rateLimit = globalState.__anilistRateLimit ?? new Map<string, RateLimitEntry>()
  globalState.__anilistCache = cache
  globalState.__anilistInFlight = inFlight
  globalState.__anilistRateLimit = rateLimit

  const now = Date.now()
  if (cache.size > 2000) {
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key)
    }
  }

  const getClientIp = () => {
    const forwarded = getRequestHeader(event, 'x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
    return event.node.req.socket.remoteAddress || 'unknown'
  }

  const rateKey = getClientIp()
  const windowMs = 10_000
  const maxRequestsPerWindow = 25
  const rateEntry = rateLimit.get(rateKey)

  if (!rateEntry || rateEntry.resetAt <= now) {
    rateLimit.set(rateKey, { count: 1, resetAt: now + windowMs })
  } else if (rateEntry.count >= maxRequestsPerWindow) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateEntry.resetAt - now) / 1000))
    setResponseStatus(event, 429)
    setHeader(event, 'Retry-After', String(retryAfterSeconds))
    return {
      errors: [{ message: `Server AniList rate limit reached. Retry in ${retryAfterSeconds}s.` }]
    }
  } else {
    rateEntry.count += 1
  }

  const tokenHash = (() => {
    if (!token) return 'anon'
    let h = 0
    for (let i = 0; i < token.length; i += 1) h = ((h << 5) - h) + token.charCodeAt(i)
    return String(Math.abs(h))
  })()

  const cacheKey = JSON.stringify({ query, variables, tokenHash })
  const redisCacheKey = `kizuna:anilist:gql:${cacheKey}`

  const defaultTtlMs = token ? 15_000 : 120_000
  const requestedTtl = Number(body.cacheTtlMs)
  const ttlMs = Number.isFinite(requestedTtl)
    ? Math.max(0, Math.min(600_000, requestedTtl))
    : defaultTtlMs
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))

  const config = useRuntimeConfig(event)
  const redisUrl = String((config as any).redisUrl ?? '').trim()

  const getRedisClient = async (): Promise<RedisClientLike | null> => {
    if (!redisUrl || globalState.__anilistRedisDisabled) return null

    if (!globalState.__anilistRedisClientPromise) {
      globalState.__anilistRedisClientPromise = (async () => {
        try {
          const importer = new Function('moduleName', 'return import(moduleName)') as (moduleName: string) => Promise<any>
          const redisModule = await importer('redis')
          const createClient = redisModule?.createClient
          if (typeof createClient !== 'function') return null

          const client = createClient({ url: redisUrl }) as RedisClientLike
          if (!client.isOpen) {
            await client.connect()
          }
          return client
        } catch (error) {
          console.error('Redis cache unavailable, fallback to memory cache:', error)
          globalState.__anilistRedisDisabled = true
          return null
        }
      })()
    }

    return await globalState.__anilistRedisClientPromise
  }

  if (!skipCache && ttlMs > 0) {
    const redisClient = await getRedisClient()
    if (redisClient) {
      try {
        const redisRaw = await redisClient.get(redisCacheKey)
        if (redisRaw) {
          const redisParsed = JSON.parse(redisRaw) as { statusCode: number; payload: any }
          if (redisParsed && typeof redisParsed.statusCode === 'number') {
            setHeader(event, 'X-Cache', 'HIT-REDIS')
            setResponseStatus(event, redisParsed.statusCode)
            return redisParsed.payload
          }
        }
      } catch (error) {
        console.error('Redis read failed, fallback to memory cache:', error)
      }
    }

    const existing = cache.get(cacheKey)
    if (existing && existing.expiresAt > now) {
      setHeader(event, 'X-Cache', 'HIT-MEMORY')
      setResponseStatus(event, existing.statusCode)
      return existing.payload
    }
  }

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const requestKey = cacheKey
  const pending = inFlight.get(requestKey)
  if (pending) {
    const deduped = await pending
    setHeader(event, 'X-Request-Dedup', 'HIT')
    setResponseStatus(event, deduped.statusCode)
    return deduped.payload
  }

  const performRequest = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const maxAttempts = 4
    let lastStatus = 500
    let lastPayload: any = null

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, variables })
        })

        const remaining = response.headers.get('x-ratelimit-remaining')
        const reset = response.headers.get('x-ratelimit-reset')
        const retryAfter = response.headers.get('retry-after')
        if (remaining) setHeader(event, 'X-AniList-RateLimit-Remaining', remaining)
        if (reset) setHeader(event, 'X-AniList-RateLimit-Reset', reset)
        if (retryAfter) setHeader(event, 'Retry-After', retryAfter)

        let payload: any = null
        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        if (!payload || typeof payload !== 'object') {
          payload = { errors: [{ message: `AniList HTTP ${response.status}` }] }
        }

        if (!response.ok && !payload.errors) {
          payload.errors = [{ message: `AniList HTTP ${response.status}` }]
        }

        lastStatus = response.status
        lastPayload = payload

        const shouldRetry = response.status === 429
        if (!shouldRetry || attempt === maxAttempts - 1) {
          return { statusCode: response.status, payload }
        }

        const retryAfterSeconds = Number(response.headers.get('retry-after') || '0')
        const baseDelay = retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : Math.min(1000 * (2 ** attempt), 8000)
        const jitter = Math.floor(Math.random() * 400)
        await wait(baseDelay + jitter)
      } catch (error: any) {
        lastStatus = 502
        lastPayload = { errors: [{ message: error?.message || 'AniList request failed.' }] }
        if (attempt === maxAttempts - 1) {
          return { statusCode: lastStatus, payload: lastPayload }
        }
        const backoff = Math.min(500 * (2 ** attempt), 4000)
        const jitter = Math.floor(Math.random() * 300)
        await wait(backoff + jitter)
      }
    }

    return { statusCode: lastStatus, payload: lastPayload }
  }

  const requestPromise = performRequest()
  inFlight.set(requestKey, requestPromise)

  try {
    const result = await requestPromise

    if (!skipCache && ttlMs > 0 && result.statusCode >= 200 && result.statusCode < 300) {
      const redisClient = await getRedisClient()
      if (redisClient) {
        try {
          await redisClient.setEx(redisCacheKey, ttlSeconds, JSON.stringify({
            statusCode: result.statusCode,
            payload: result.payload
          }))
          setHeader(event, 'X-Cache', 'MISS-REDIS')
        } catch (error) {
          console.error('Redis write failed, fallback to memory cache:', error)
          cache.set(cacheKey, {
            expiresAt: Date.now() + ttlMs,
            payload: result.payload,
            statusCode: result.statusCode
          })
          setHeader(event, 'X-Cache', 'MISS-MEMORY')
        }
      } else {
        cache.set(cacheKey, {
          expiresAt: Date.now() + ttlMs,
          payload: result.payload,
          statusCode: result.statusCode
        })
        setHeader(event, 'X-Cache', 'MISS-MEMORY')
      }
    }

    setResponseStatus(event, result.statusCode)
    return result.payload
  } finally {
    inFlight.delete(requestKey)
  }
})

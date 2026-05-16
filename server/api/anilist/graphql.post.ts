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

  type ValkeyClientLike = {
    status?: 'wait' | 'reconnecting' | 'connecting' | 'connect' | 'ready' | 'close' | 'end'
    connect: () => Promise<void>
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string, mode: 'EX', ttlSeconds: number) => Promise<unknown>
    on?: (event: string, listener: (...args: any[]) => void) => unknown
    disconnect?: () => void
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
  // Les mutations doivent toujours traverser AniList pour ne pas servir un etat obsolete.
  const isMutation = /^\s*mutation\b/i.test(query)
  const skipCache = Boolean(body.skipCache) || isMutation

  const globalState = globalThis as typeof globalThis & {
    __anilistCache?: Map<string, CacheEntry>
    __anilistInFlight?: Map<string, Promise<{ statusCode: number; payload: any }>>
    __anilistRateLimit?: Map<string, RateLimitEntry>
    __anilistValkeyClientPromise?: Promise<ValkeyClientLike | null>
    __anilistValkeyDisabled?: boolean
    __anilistValkeyErrorLogged?: boolean
  }

  const cache = globalState.__anilistCache ?? new Map<string, CacheEntry>()
  const inFlight = globalState.__anilistInFlight ?? new Map<string, Promise<{ statusCode: number; payload: any }>>()
  const rateLimit = globalState.__anilistRateLimit ?? new Map<string, RateLimitEntry>()
  // Les maps sont accrochees a globalThis pour survivre entre deux handlers Nitro dans le meme process.
  globalState.__anilistCache = cache
  globalState.__anilistInFlight = inFlight
  globalState.__anilistRateLimit = rateLimit

  const now = Date.now()
  if (cache.size > 2000) {
    // Nettoyage opportuniste: on evite un timer global Nitro juste pour purger les entrees expirees.
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key)
    }
  }

  const getClientIp = () => {
    const forwarded = getRequestHeader(event, 'x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
    return event.node.req.socket.remoteAddress || 'unknown'
  }

  const isRateLimitedIpExempt = (ip: string) => (
    ip === 'unknown'
    || ip === '::1'
    || ip === '127.0.0.1'
    || ip === '::ffff:127.0.0.1'
  )

  const consumeRateLimitSlot = () => {
    const rateKey = getClientIp()
    if (isRateLimitedIpExempt(rateKey)) return 0

    // Limite cote serveur pour proteger AniList en plus de ses propres limites upstream.
    const windowMs = 10_000
    const maxRequestsPerWindow = 120
    const requestNow = Date.now()
    const rateEntry = rateLimit.get(rateKey)

    if (!rateEntry || rateEntry.resetAt <= requestNow) {
      rateLimit.set(rateKey, { count: 1, resetAt: requestNow + windowMs })
      return 0
    }

    if (rateEntry.count >= maxRequestsPerWindow) {
      return Math.max(1, Math.ceil((rateEntry.resetAt - requestNow) / 1000))
    }

    rateEntry.count += 1
    return 0
  }

  const tokenHash = (() => {
    if (!token) return 'anon'
    let h = 0
    // Hash non cryptographique: il separe les caches prives sans exposer le bearer token.
    for (let i = 0; i < token.length; i += 1) h = ((h << 5) - h) + token.charCodeAt(i)
    return String(Math.abs(h))
  })()

  // Le token complet ne va jamais dans les cles de cache; seul un hash local separe les reponses privees.
  const cacheKey = JSON.stringify({ query, variables, tokenHash })
  const valkeyCacheKey = `kizuna:anilist:gql:${cacheKey}`

  const defaultTtlMs = token ? 15_000 : 120_000
  const requestedTtl = Number(body.cacheTtlMs)
  // Le client peut reduire/augmenter le TTL, mais jamais au-dela de 10 minutes.
  const ttlMs = Number.isFinite(requestedTtl)
    ? Math.max(0, Math.min(600_000, requestedTtl))
    : defaultTtlMs
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))

  const config = useRuntimeConfig(event)
  const valkeyUrl = String((config as any).valkeyUrl ?? '').trim()
  const disableValkey = (reason: unknown) => {
    if (!globalState.__anilistValkeyErrorLogged) {
      console.error('Valkey cache unavailable, fallback to memory cache:', reason)
      globalState.__anilistValkeyErrorLogged = true
    }
    globalState.__anilistValkeyDisabled = true
  }

  const getValkeyClient = async (): Promise<ValkeyClientLike | null> => {
    if (!valkeyUrl || globalState.__anilistValkeyDisabled) return null

    if (!globalState.__anilistValkeyClientPromise) {
      // Une seule promesse de connexion evite plusieurs clients Valkey concurrents au demarrage.
      globalState.__anilistValkeyClientPromise = (async () => {
        try {
          // Import dynamique pour que le projet fonctionne aussi sans dependance Valkey configuree.
          const importer = new Function('moduleName', 'return import(moduleName)') as (moduleName: string) => Promise<any>
          const valkeyModule = await importer('iovalkey')
          const Valkey = valkeyModule?.default ?? valkeyModule?.Redis
          if (typeof Valkey !== 'function') return null

          const client = new Valkey(valkeyUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 0,
            enableOfflineQueue: false,
            retryStrategy: () => null
          }) as ValkeyClientLike

          client.on?.('error', (error: unknown) => {
            disableValkey(error)
            client.disconnect?.()
          })

          if (client.status === 'wait') {
            await client.connect()
          }
          return client
        } catch (error) {
          disableValkey(error)
          return null
        }
      })()
    }

    return await globalState.__anilistValkeyClientPromise
  }

  if (!skipCache && ttlMs > 0) {
    const valkeyClient = await getValkeyClient()
    if (valkeyClient) {
      try {
        // Valkey est lu avant la memoire pour partager le cache entre instances.
        const valkeyRaw = await valkeyClient.get(valkeyCacheKey)
        if (valkeyRaw) {
          const valkeyParsed = JSON.parse(valkeyRaw) as { statusCode: number; payload: any }
          if (valkeyParsed && typeof valkeyParsed.statusCode === 'number') {
            setHeader(event, 'X-Cache', 'HIT-VALKEY')
            setResponseStatus(event, valkeyParsed.statusCode)
            return valkeyParsed.payload
          }
        }
      } catch (error) {
        disableValkey(error)
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
    // Deduplication des appels identiques: plusieurs composants peuvent demander la meme query au meme rendu.
    const deduped = await pending
    setHeader(event, 'X-Request-Dedup', 'HIT')
    setResponseStatus(event, deduped.statusCode)
    return deduped.payload
  }

  const retryAfterSeconds = consumeRateLimitSlot()
  if (retryAfterSeconds > 0) {
    setResponseStatus(event, 429)
    setHeader(event, 'Retry-After', retryAfterSeconds)
    return {
      errors: [{ message: `Server AniList rate limit reached. Retry in ${retryAfterSeconds}s.` }]
    }
  }

  const performRequest = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
    if (token) {
      // Le proxy accepte aussi les requetes authentifiees pour les donnees liees au viewer.
      headers.Authorization = `Bearer ${token}`
    }

    const maxAttempts = 4
    let lastStatus = 500
    let lastPayload: any = null

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        // AniList renvoie parfois 429; on conserve les headers utiles pour le client et on retente avec jitter.
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, variables })
        })

        const remaining = response.headers.get('x-ratelimit-remaining')
        const reset = response.headers.get('x-ratelimit-reset')
        const retryAfter = Number(response.headers.get('retry-after') || '0')
        if (remaining) setHeader(event, 'X-AniList-RateLimit-Remaining', remaining)
        if (reset) setHeader(event, 'X-AniList-RateLimit-Reset', reset)
        if (retryAfter > 0) setHeader(event, 'Retry-After', retryAfter)

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

        const retryAfterSeconds = retryAfter
        // Respecte Retry-After quand AniList le fournit, sinon backoff exponentiel borne.
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
        // Erreurs reseau: backoff plus court que le 429, car aucun Retry-After n'est disponible.
        const backoff = Math.min(500 * (2 ** attempt), 4000)
        const jitter = Math.floor(Math.random() * 300)
        await wait(backoff + jitter)
      }
    }

    return { statusCode: lastStatus, payload: lastPayload }
  }

  const requestPromise = performRequest()
  // L'appel est enregistre avant await pour que les requetes identiques suivantes attendent celle-ci.
  inFlight.set(requestKey, requestPromise)

  try {
    const result = await requestPromise

    if (!skipCache && ttlMs > 0 && result.statusCode >= 200 && result.statusCode < 300) {
      const valkeyClient = await getValkeyClient()
      if (valkeyClient) {
        try {
          // Valkey est prioritaire en production, la Map memoire reste le fallback local/dev.
          await valkeyClient.set(valkeyCacheKey, JSON.stringify({
            statusCode: result.statusCode,
            payload: result.payload
          }), 'EX', ttlSeconds)
          setHeader(event, 'X-Cache', 'MISS-VALKEY')
        } catch (error) {
          disableValkey(error)
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

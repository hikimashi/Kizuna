// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────

/**
 *  ENDPOINT GRAPHQL ANILIST
 * 
 * Ce endpoint reçoit les requêtes GraphQL du client Vue et les transmet à AniList.
 * Il gère aussi le cache (Redis/Valkey) et le rate limiting.
 * 
 * FLUX:
 * 1. Client Vue appelle: POST /api/anilist/graphql { query, token }
 * 2. Cet endpoint reçoit la requête
 * 3. Vérifie le cache (Redis, puis mémoire)
 * 4. Si pas en cache → envoie la requête à https://graphql.anilist.co
 * 5. Reçoit le JSON brut d'AniList ⬅ C'EST ICI LE JSON BRUT
 * 6. Stocke en cache
 * 7. Retourne au client
 */
export default defineEventHandler(async (event) => {
  // Type de données reçues du client
  type GraphqlBody = {
    query?: string // La requête GraphQL (ex: "query { Viewer { id } }")
    variables?: Record<string, any> // Variables GraphQL
    token?: string // Token AniList du user (optionnel pour requêtes anonymes)
    cacheTtlMs?: number // TTL du cache demandé par le client
    skipCache?: boolean // Forcer à ignorer le cache
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

  // ─────────────────────────────────────────
  // SECTION : Validation et identité de requête
  // ─────────────────────────────────────────

  //  Validation: la requête est obligatoire
  if (!body?.query) {
    setResponseStatus(event, 400)
    return {
      errors: [{ message: 'Missing AniList GraphQL query.' }]
    }
  }

  //  Extraction des paramètres de la requête
  const query = String(body.query)
  const variables = body.variables ?? {}
  const token = body.token ? String(body.token) : '' // Token du user si authentifié
  //  Détecte si c'est une mutation (INSERT/UPDATE/DELETE)
  // Les mutations doivent toujours traverser AniList pour ne pas servir un état obsolète.
  const isMutation = /^\s*mutation\b/i.test(query)
  const skipCache = Boolean(body.skipCache) || isMutation

  //  SYSTÈME DE CACHE - Stocké en mémoire pour survivre entre les requêtes
  const globalState = globalThis as typeof globalThis & {
    __anilistCache?: Map<string, CacheEntry> // Cache en mémoire
    __anilistInFlight?: Map<string, Promise<{ statusCode: number; payload: any }>> // Déduplication
    __anilistRateLimit?: Map<string, RateLimitEntry> // Rate limit par IP
    __anilistValkeyClientPromise?: Promise<ValkeyClientLike | null>
    __anilistValkeyDisabled?: boolean
    __anilistValkeyErrorLogged?: boolean
  }

  const cache = globalState.__anilistCache ?? new Map<string, CacheEntry>()
  const inFlight = globalState.__anilistInFlight ?? new Map<string, Promise<{ statusCode: number; payload: any }>>()
  const rateLimit = globalState.__anilistRateLimit ?? new Map<string, RateLimitEntry>()
  // Les maps sont accrochées à globalThis pour survivre entre deux handlers Nitro dans le même process.
  globalState.__anilistCache = cache
  globalState.__anilistInFlight = inFlight
  globalState.__anilistRateLimit = rateLimit

  const now = Date.now()
  if (cache.size > 2000) {
    // Nettoyage opportuniste: on évite un timer global Nitro juste pour purger les entrées expirées.
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key)
    }
  }

  /**
   * Retourne client ip.
   *
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const getClientIp = () => {
    const forwarded = getRequestHeader(event, 'x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
    return event.node.req.socket.remoteAddress || 'unknown'
  }

  /**
   * Indique si rate limited ip exempt.
   *
   * @param ip - Valeur utilisée par le traitement « is rate limited ip exempt ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const isRateLimitedIpExempt = (ip: string) => (
    ip === 'unknown'
    || ip === '::1'
    || ip === '127.0.0.1'
    || ip === '::ffff:127.0.0.1'
  )

  /**
   * Calcule la valeur « consume rate limit slot ».
   *
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const consumeRateLimitSlot = () => {
    const rateKey = getClientIp()
    if (isRateLimitedIpExempt(rateKey)) return 0

    // Limite côté serveur pour protéger AniList en plus de ses propres limites upstream.
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
    // Hash non cryptographique: il sépare les caches privés sans exposer le bearer token.
    for (let i = 0; i < token.length; i += 1) h = ((h << 5) - h) + token.charCodeAt(i)
    return String(Math.abs(h))
  })()

  // Le token complet ne va jamais dans les clés de cache; seul un hash local sépare les réponses privées.
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
  /**
   * Calcule la valeur « disable valkey ».
   *
   * @param reason - Valeur utilisée par le traitement « disable valkey ».
   * @returns Aucune valeur.
   * @sideEffects peut écrire dans les journaux.
   */
  const disableValkey = (reason: unknown) => {
    if (!globalState.__anilistValkeyErrorLogged) {
      console.error('Valkey cache unavailable, fallback to memory cache:', reason)
      globalState.__anilistValkeyErrorLogged = true
    }
    globalState.__anilistValkeyDisabled = true
  }

  /**
   * Retourne valkey client.
   *
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const getValkeyClient = async (): Promise<ValkeyClientLike | null> => {
    if (!valkeyUrl || globalState.__anilistValkeyDisabled) return null

    if (!globalState.__anilistValkeyClientPromise) {
      // Une seule promesse de connexion évite plusieurs clients Valkey concurrents au démarrage.
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

  // ─────────────────────────────────────────
  // SECTION : Lecture des caches
  // ─────────────────────────────────────────

  if (!skipCache && ttlMs > 0) {
    const valkeyClient = await getValkeyClient()
    if (valkeyClient) {
      try {
        // Valkey est lu avant la mémoire pour partager le cache entre instances.
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

  /**
   * Attend wait.
   *
   * @param ms - Valeur utilisée par le traitement « wait ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects gère une temporisation.
   */
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const requestKey = cacheKey
  const pending = inFlight.get(requestKey)
  if (pending) {
    // Déduplication des appels identiques: plusieurs composants peuvent demander la même query au même rendu.
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

  /**
   * Calcule la valeur « perform request ».
   *
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const performRequest = async () => {
    // [IMPORTANT] : toutes les requêtes AniList sortantes passent par cette fonction et son retry borné.
    //  HEADERS POUR ANILIST
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
    if (token) {
      // Si l'utilisateur est authentifié, on envoie son token à AniList
      // AniList utilisera ce token pour identifier le "Viewer" (l'utilisateur actuel)
      headers.Authorization = `Bearer ${token}`
    }

    const maxAttempts = 4
    let lastStatus = 500
    let lastPayload: any = null

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        //  POINT CLEF: C'EST ICI QU'ON ENVOIE LA REQUÊTE À ANILIST
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, variables })
        })

        // Lecture des headers de rate limit d'AniList
        const remaining = response.headers.get('x-ratelimit-remaining')
        const reset = response.headers.get('x-ratelimit-reset')
        const retryAfter = Number(response.headers.get('retry-after') || '0')
        if (remaining) setHeader(event, 'X-AniList-RateLimit-Remaining', remaining)
        if (reset) setHeader(event, 'X-AniList-RateLimit-Reset', reset)
        if (retryAfter > 0) setHeader(event, 'Retry-After', retryAfter)

        //  C'EST ICI QU'ON REÇOIT LE JSON BRUT D'ANILIST
        // Exemple de réponse:
        // {
        //   "data": {
        //     "Viewer": {
        //       "id": 123456,
        //       "name": "Username"
        //     }
        //   }
        // }
        // ou
        // {
        //   "errors": [{ "message": "Unauthorized" }]
        // }
        let payload: any = null
        try {
          payload = await response.json() // Parse le JSON brut reçu
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

        const shouldRetry = response.status === 429 // Rate limited? Retry
        if (!shouldRetry || attempt === maxAttempts - 1) {
          return { statusCode: response.status, payload }
        }

        // Si rate limited, on attend avant de réessayer
        const retryAfterSeconds = retryAfter
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
        // Erreurs réseau: backoff plus court que le 429
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
    // ─────────────────────────────────────────
    // SECTION : Écriture des caches et réponse
    // ─────────────────────────────────────────
    const result = await requestPromise

    //  STOCKAGE EN CACHE - Si c'est une requête réussie (200-299)
    if (!skipCache && ttlMs > 0 && result.statusCode >= 200 && result.statusCode < 300) {
      const valkeyClient = await getValkeyClient()
      if (valkeyClient) {
        try {
          // On stocke la réponse JSON complète en Redis/Valkey
          // Format: { statusCode: 200, payload: { "data": { "Viewer": {...} } } }
          await valkeyClient.set(valkeyCacheKey, JSON.stringify({
            statusCode: result.statusCode,
            payload: result.payload
          }), 'EX', ttlSeconds)
          setHeader(event, 'X-Cache', 'MISS-VALKEY') // Header pour debug
        } catch (error) {
          disableValkey(error)
          // Fallback: cache en mémoire si Redis échoue
          cache.set(cacheKey, {
            expiresAt: Date.now() + ttlMs,
            payload: result.payload,
            statusCode: result.statusCode
          })
          setHeader(event, 'X-Cache', 'MISS-MEMORY')
        }
      } else {
        // Aucun Redis disponible: utilise la cache en mémoire
        cache.set(cacheKey, {
          expiresAt: Date.now() + ttlMs,
          payload: result.payload,
          statusCode: result.statusCode
        })
        setHeader(event, 'X-Cache', 'MISS-MEMORY')
      }
    }

    //  RETOUR AU CLIENT
    // On retourne le JSON brut d'AniList (ou les erreurs si erreur)
    setResponseStatus(event, result.statusCode)
    return result.payload
  } finally {
    inFlight.delete(requestKey)
  }
})

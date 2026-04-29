import { createHash } from 'node:crypto'

type TranslateBody = {
  mediaId?: number
  description?: string
  targetLang?: string
}

type TranslateResponse = {
  description: string
  translated: boolean
  provider: string
}

type CacheEntry = {
  expiresAt: number
  payload: TranslateResponse
}

type ValkeyClientLike = {
  status?: 'wait' | 'reconnecting' | 'connecting' | 'connect' | 'ready' | 'close' | 'end'
  connect: () => Promise<void>
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, mode: 'EX', ttlSeconds: number) => Promise<unknown>
  on?: (event: string, listener: (...args: any[]) => void) => unknown
  disconnect?: () => void
}

const MAX_CHUNK_LENGTH = 1600
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 14
const TRANSLATION_TIMEOUT_MS = 2500

const normalizeDescription = (value: string) => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/?[^>]+>/g, '')
  .replace(/\r\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const splitIntoChunks = (text: string, maxLength = MAX_CHUNK_LENGTH) => {
  if (text.length <= maxLength) return [text]

  const chunks: string[] = []
  let buffer = ''
  const segments = text.split(/(\n\n+)/)

  for (const segment of segments) {
    if (!segment) continue

    if ((buffer + segment).length <= maxLength) {
      buffer += segment
      continue
    }

    if (buffer) {
      chunks.push(buffer)
      buffer = ''
    }

    if (segment.length <= maxLength) {
      buffer = segment
      continue
    }

    for (let index = 0; index < segment.length; index += maxLength) {
      chunks.push(segment.slice(index, index + maxLength))
    }
  }

  if (buffer) chunks.push(buffer)
  return chunks.filter(Boolean)
}

const translateWithGoogleGtx = async (text: string, targetLang: string) => {
  const chunks = splitIntoChunks(text)
  const translatedChunks: string[] = []

  for (const chunk of chunks) {
    const query = new URLSearchParams({
      client: 'gtx',
      sl: 'auto',
      tl: targetLang,
      dt: 't',
      q: chunk
    })

    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query.toString()}`, {
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(TRANSLATION_TIMEOUT_MS)
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Translation provider returned HTTP ${response.status}`
      })
    }

    const payload = await response.json()
    const translated = Array.isArray(payload?.[0])
      ? payload[0]
          .map((part: any) => typeof part?.[0] === 'string' ? part[0] : '')
          .join('')
      : ''

    translatedChunks.push(translated || chunk)
  }

  return translatedChunks.join('')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TranslateBody>(event)
  const rawDescription = typeof body?.description === 'string' ? body.description : ''
  const description = normalizeDescription(rawDescription)
  const mediaId = Number(body?.mediaId || 0)
  const targetLang = String(body?.targetLang || 'fr').trim().toLowerCase() || 'fr'

  if (!description) {
    return {
      description: '',
      translated: false,
      provider: 'none'
    } satisfies TranslateResponse
  }

  const config = useRuntimeConfig(event)
  const provider = String((config as any).translationProvider || 'google-gtx').trim().toLowerCase() || 'google-gtx'
  if (provider === 'none') {
    return {
      description,
      translated: false,
      provider
    } satisfies TranslateResponse
  }

  const cacheKey = createHash('sha1')
    .update(JSON.stringify({ mediaId, description, targetLang, provider }))
    .digest('hex')

  const globalState = globalThis as typeof globalThis & {
    __translationCache?: Map<string, CacheEntry>
    __translationInFlight?: Map<string, Promise<TranslateResponse>>
    __translationValkeyClientPromise?: Promise<ValkeyClientLike | null>
    __translationValkeyDisabled?: boolean
    __translationValkeyErrorLogged?: boolean
  }

  const cache = globalState.__translationCache ?? new Map<string, CacheEntry>()
  const inFlight = globalState.__translationInFlight ?? new Map<string, Promise<TranslateResponse>>()
  globalState.__translationCache = cache
  globalState.__translationInFlight = inFlight

  const now = Date.now()
  if (cache.size > 500) {
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key)
    }
  }

  const existing = cache.get(cacheKey)
  if (existing && existing.expiresAt > now) {
    return existing.payload
  }

  const valkeyUrl = String((config as any).valkeyUrl ?? '').trim()
  const disableValkey = (reason: unknown) => {
    if (!globalState.__translationValkeyErrorLogged) {
      console.error('Translation Valkey cache unavailable, fallback to memory cache:', reason)
      globalState.__translationValkeyErrorLogged = true
    }
    globalState.__translationValkeyDisabled = true
  }

  const getValkeyClient = async (): Promise<ValkeyClientLike | null> => {
    if (!valkeyUrl || globalState.__translationValkeyDisabled) return null

    if (!globalState.__translationValkeyClientPromise) {
      globalState.__translationValkeyClientPromise = (async () => {
        try {
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

    return await globalState.__translationValkeyClientPromise
  }

  const valkeyCacheKey = `kizuna:translation:anime-description:${cacheKey}`
  const valkeyClient = await getValkeyClient()
  if (valkeyClient) {
    try {
      const valkeyRaw = await valkeyClient.get(valkeyCacheKey)
      if (valkeyRaw) {
        const payload = JSON.parse(valkeyRaw) as TranslateResponse
        cache.set(cacheKey, { expiresAt: now + DEFAULT_TTL_MS, payload })
        return payload
      }
    } catch (error) {
      disableValkey(error)
    }
  }

  const pending = inFlight.get(cacheKey)
  if (pending) {
    return await pending
  }

  const request = (async (): Promise<TranslateResponse> => {
    try {
      const translatedDescription = provider === 'google-gtx'
        ? await translateWithGoogleGtx(description, targetLang)
        : description

      const payload = {
        description: translatedDescription || description,
        translated: Boolean(translatedDescription) && translatedDescription !== description,
        provider
      } satisfies TranslateResponse

      cache.set(cacheKey, { expiresAt: Date.now() + DEFAULT_TTL_MS, payload })

      if (valkeyClient) {
        try {
          await valkeyClient.set(valkeyCacheKey, JSON.stringify(payload), 'EX', Math.ceil(DEFAULT_TTL_MS / 1000))
        } catch (error) {
          disableValkey(error)
        }
      }

      return payload
    } catch (error) {
      console.error('Anime description translation failed:', error)
      return {
        description,
        translated: false,
        provider
      } satisfies TranslateResponse
    } finally {
      inFlight.delete(cacheKey)
    }
  })()

  inFlight.set(cacheKey, request)
  return await request
})

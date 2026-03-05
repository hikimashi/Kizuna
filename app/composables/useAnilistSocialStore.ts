import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'

type AniListUserNode = {
  id: number
  name: string
  createdAt?: number
  avatar?: { medium?: string | null; large?: string | null } | null
  bannerImage?: string | null
  statistics?: { anime?: { count?: number | null; meanScore?: number | null } | null } | null
}

export type SocialUser = {
  id: number
  username: string
  joined: string
  animeCount: number
  score: number
  following: boolean
  isFollower: boolean
  isFriend: boolean
  avatar?: string
  banner?: string
  avatarColor: string
}

const followingQuery = `
query ($userId: Int!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    following(userId: $userId) {
      id
      name
      createdAt
      avatar { medium large }
      bannerImage
      statistics {
        anime {
          count
          meanScore
        }
      }
    }
  }
}
`

const followersQuery = `
query ($userId: Int!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    followers(userId: $userId) {
      id
      name
      createdAt
      avatar { medium large }
      bannerImage
      statistics {
        anime {
          count
          meanScore
        }
      }
    }
  }
}
`

const palette = ['#4F378A', '#9256F3', '#F77F00', '#06D6A0', '#D62828', '#4361EE', '#FF6B9D', '#FFBE0B', '#6A0572', '#1DD3B0']

const formatJoined = (timestamp?: number) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
}

const hashColor = (id: number) => palette[Math.abs(id) % palette.length]

const mapUser = (user: AniListUserNode): SocialUser => ({
  id: Number(user.id),
  username: user.name || 'Unknown',
  joined: formatJoined(user.createdAt),
  animeCount: Number(user.statistics?.anime?.count ?? 0),
  score: Number(user.statistics?.anime?.meanScore ?? 0),
  following: false,
  isFollower: false,
  isFriend: false,
  avatar: user.avatar?.large || user.avatar?.medium || undefined,
  banner: user.bannerImage || undefined,
  avatarColor: hashColor(Number(user.id))
})

export const useAnilistSocialStore = defineStore('anilistSocial', () => {
  const pocketbaseStore = usePocketbaseStore()

  const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
  const token = computed(() => String(authRecord.value.anilist_token ?? ''))
  const anilistUserId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
  const userKey = computed(() => `${anilistUserId.value || 0}:${token.value ? 'linked' : 'anon'}`)

  const isLoading = ref(false)
  const loadError = ref('')
  const followingUsers = ref<SocialUser[]>([])
  const followerUsers = ref<SocialUser[]>([])
  const friendUsers = ref<SocialUser[]>([])
  const loadedForKey = ref('')

  const reset = (keepError = false) => {
    followingUsers.value = []
    followerUsers.value = []
    friendUsers.value = []
    if (!keepError) loadError.value = ''
    loadedForKey.value = ''
  }

  const requestGraphql = async (
    query: string,
    variables: Record<string, any>,
    includeToken: boolean
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (includeToken && token.value) headers.Authorization = `Bearer ${token.value}`

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    })

    let payload: any = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    const errors = payload?.errors as Array<{ message?: string }> | undefined
    const errorMessage = errors?.map(error => error?.message).filter(Boolean).join(' | ')

    if (!response.ok) {
      throw new Error(errorMessage || `AniList HTTP ${response.status}`)
    }

    return payload
  }

  const graphqlFetch = async (query: string, variables: Record<string, any>) => {
    const parseErrors = (response: any) => {
      if (!response?.errors?.length) return ''
      return response.errors.map((error: any) => error?.message).filter(Boolean).join(' | ')
    }

    let response = await requestGraphql(query, variables, true)
    let errorMessage = parseErrors(response)

    if (!errorMessage) return response

    const lowered = errorMessage.toLowerCase()
    const shouldRetryWithoutToken =
      lowered.includes('token')
      || lowered.includes('unauthorized')
      || lowered.includes('invalid')
      || lowered.includes('private')

    if (shouldRetryWithoutToken) {
      response = await requestGraphql(query, variables, false)
      errorMessage = parseErrors(response)
      if (!errorMessage) return response
    }

    throw new Error(errorMessage || 'AniList GraphQL error')
  }

  const fetchPagedUsers = async (query: string, field: 'following' | 'followers') => {
    const all: AniListUserNode[] = []
    let page = 1
    const perPage = 50
    let hasNextPage = true

    while (hasNextPage && page <= 100) {
      const response = await graphqlFetch(query, { userId: anilistUserId.value, page, perPage })

      const pageNode = response?.data?.Page
      const chunk = (pageNode?.[field] ?? []) as AniListUserNode[]
      all.push(...chunk)
      hasNextPage = Boolean(pageNode?.pageInfo?.hasNextPage)
      page += 1
    }

    return all
  }

  const loadSocial = async (force = false) => {
    if (!force && loadedForKey.value === userKey.value) return
    if (isLoading.value) return

    if (!anilistUserId.value) {
      reset()
      return
    }

    isLoading.value = true
    loadError.value = ''

    try {
      const [followingResult, followersResult] = await Promise.allSettled([
        fetchPagedUsers(followingQuery, 'following'),
        fetchPagedUsers(followersQuery, 'followers')
      ])

      const followingRaw = followingResult.status === 'fulfilled' ? followingResult.value : []
      const followersRaw = followersResult.status === 'fulfilled' ? followersResult.value : []

      if (followingResult.status === 'rejected' && followersResult.status === 'rejected') {
        const details = [followingResult.reason?.message, followersResult.reason?.message].filter(Boolean).join(' | ')
        throw new Error(details || 'AniList social data unavailable.')
      }

      const followersIds = new Set(followersRaw.map(user => Number(user.id)))
      const followingIds = new Set(followingRaw.map(user => Number(user.id)))

      followingUsers.value = followingRaw.map((user) => {
        const mapped = mapUser(user)
        mapped.following = true
        mapped.isFollower = followersIds.has(mapped.id)
        mapped.isFriend = mapped.isFollower && mapped.following
        return mapped
      })

      followerUsers.value = followersRaw.map((user) => {
        const mapped = mapUser(user)
        mapped.isFollower = true
        mapped.following = followingIds.has(mapped.id)
        mapped.isFriend = mapped.isFollower && mapped.following
        return mapped
      })

      const friendMap = new Map<number, SocialUser>()
      for (const user of [...followingUsers.value, ...followerUsers.value]) {
        if (user.isFriend) friendMap.set(user.id, user)
      }
      friendUsers.value = Array.from(friendMap.values())
      loadedForKey.value = userKey.value
    } catch (error: any) {
      console.error('Failed to load AniList social data:', error)
      const message = error?.data?.errors?.[0]?.message || error?.message
      loadError.value = message || 'Failed to load AniList social data.'
      reset(true)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    loadError,
    followingUsers,
    followerUsers,
    friendUsers,
    loadSocial,
    reset
  }
})

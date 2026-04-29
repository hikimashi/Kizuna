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

type PocketbaseUserRecord = {
  id: string
  anilist_user_id?: number | string
}

type UserFriendRecord = {
  id: string
  fk_user_id?: string | string[]
  fk_friend_user_id?: string | string[]
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

const toggleFollowMutation = `
mutation ($userId: Int) {
  ToggleFollow(userId: $userId) {
    id
  }
}
`

const palette = ['#4F378A', '#9256F3', '#F77F00', '#06D6A0', '#D62828', '#4361EE', '#FF6B9D', '#FFBE0B', '#6A0572', '#1DD3B0']

const formatJoined = (timestamp?: number) => {
  if (!timestamp) return 'Inconnu'
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date)
}

const hashColor = (id: number) => palette[Math.abs(id) % palette.length] ?? palette[0] ?? '#4F378A'
const normalizeRelationValue = (value?: string | string[]) => Array.isArray(value) ? String(value[0] || '') : String(value || '')
const escapeFilterValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const mapUser = (user: AniListUserNode): SocialUser => ({
  id: Number(user.id),
  username: user.name || 'Inconnu',
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
  const anilistGraphql = useAnilistGraphql()

  const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
  const token = computed(() => String(authRecord.value.anilist_token ?? ''))
  const anilistUserId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
  const userKey = computed(() => `${anilistUserId.value || 0}:${token.value ? 'linked' : 'anon'}`)

  const isLoading = ref(false)
  const loadError = ref('')
  const followingUsers = ref<SocialUser[]>([])
  const followerUsers = ref<SocialUser[]>([])
  const friendUsers = ref<SocialUser[]>([])
  const followPendingIds = ref<number[]>([])
  const loadedForKey = ref('')

  const syncUserFriends = async (mutuals: SocialUser[]) => {
    const currentPocketbaseUserId = String(authRecord.value.id || '')
    if (!currentPocketbaseUserId) return

    const mutualAniListIds = Array.from(new Set(
      mutuals
        .map(user => Number(user.id || 0))
        .filter(id => Number.isFinite(id) && id > 0)
    ))

    const desiredPocketbaseFriendIds = new Set<string>()
    const chunkSize = 40

    for (let start = 0; start < mutualAniListIds.length; start += chunkSize) {
      const chunk = mutualAniListIds.slice(start, start + chunkSize)
      if (!chunk.length) continue

      const filter = chunk.map(id => `anilist_user_id=${id}`).join(' || ')
      const users = await pocketbaseStore.pb.collection('user').getFullList<PocketbaseUserRecord>({
        filter,
        requestKey: null
      })

      for (const user of users) {
        const userId = String(user.id || '')
        if (userId && userId !== currentPocketbaseUserId) {
          desiredPocketbaseFriendIds.add(userId)
        }
      }
    }

    const existingRelations = await pocketbaseStore.pb.collection('user_friend').getFullList<UserFriendRecord>({
      filter: `fk_user_id="${escapeFilterValue(currentPocketbaseUserId)}"`,
      requestKey: null
    })

    const existingByFriendId = new Map<string, UserFriendRecord>()
    for (const relation of existingRelations) {
      const friendId = normalizeRelationValue(relation.fk_friend_user_id)
      if (friendId) existingByFriendId.set(friendId, relation)
    }

    const deleteTasks = existingRelations
      .filter((relation) => {
        const friendId = normalizeRelationValue(relation.fk_friend_user_id)
        return Boolean(friendId) && !desiredPocketbaseFriendIds.has(friendId)
      })
      .map(relation => pocketbaseStore.pb.collection('user_friend').delete(relation.id, { requestKey: null }))

    const createTasks = Array.from(desiredPocketbaseFriendIds)
      .filter(friendId => !existingByFriendId.has(friendId))
      .map(friendId => pocketbaseStore.pb.collection('user_friend').create({
        fk_user_id: currentPocketbaseUserId,
        fk_friend_user_id: friendId
      }, { requestKey: null }))

    if (deleteTasks.length || createTasks.length) {
      await Promise.all([...deleteTasks, ...createTasks])
    }
  }

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
    includeToken: boolean,
    options: {
      cacheTtlMs?: number
      skipCache?: boolean
    } = {}
  ) => {
    const payload = await anilistGraphql.request<any>(
      query,
      variables,
      {
        token: includeToken ? token.value : '',
        cacheTtlMs: options.cacheTtlMs ?? 60_000,
        skipCache: options.skipCache ?? false
      }
    )

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

    throw new Error(errorMessage || 'Erreur GraphQL AniList')
  }

  const isFollowPending = (userId: number) => followPendingIds.value.includes(Number(userId))

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
        throw new Error(details || 'Les donnees sociales AniList sont indisponibles.')
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

      try {
        await syncUserFriends(friendUsers.value)
      } catch (error) {
        console.warn('[anilistSocial] user_friend sync failed', error)
      }

      loadedForKey.value = userKey.value
    } catch (error: any) {
      console.error('Echec du chargement des donnees sociales AniList :', error)
      const message = error?.data?.errors?.[0]?.message || error?.message
      loadError.value = message || 'Impossible de charger les données sociales AniList.'
      reset(true)
    } finally {
      isLoading.value = false
    }
  }

  const toggleFollowUser = async (targetUserId: number) => {
    const userId = Number(targetUserId || 0)
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error('Utilisateur AniList invalide.')
    }
    if (!anilistUserId.value || !token.value) {
      throw new Error('Le compte AniList n\'est pas lié.')
    }
    if (userId === anilistUserId.value) {
      throw new Error('Vous ne pouvez pas suivre votre propre compte AniList.')
    }
    if (isFollowPending(userId)) return

    followPendingIds.value = [...followPendingIds.value, userId]

    try {
      const response = await requestGraphql(
        toggleFollowMutation,
        { userId },
        true,
        {
          skipCache: true,
          cacheTtlMs: 0
        }
      )
      const errorMessage = Array.isArray(response?.errors)
        ? response.errors.map((error: any) => String(error?.message || '')).filter(Boolean).join(' | ')
        : ''
      if (errorMessage) {
        throw new Error(errorMessage)
      }

      await loadSocial(true)
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message || error?.message || 'Impossible de mettre à jour le suivi AniList.'
      loadError.value = message
      throw new Error(message)
    } finally {
      followPendingIds.value = followPendingIds.value.filter(id => id !== userId)
    }
  }

  return {
    isLoading,
    loadError,
    followingUsers,
    followerUsers,
    friendUsers,
    followPendingIds,
    isFollowPending,
    toggleFollowUser,
    loadSocial,
    reset
  }
})

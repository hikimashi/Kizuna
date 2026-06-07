import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


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

/**
 * Formate joined.
 *
 * @param timestamp - Valeur utilisée par le traitement « format joined ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const formatJoined = (timestamp?: number) => {
  if (!timestamp) return 'Inconnu'
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date)
}

/**
 * Indique si h color.
 *
 * @param id - Valeur utilisée par le traitement « hash color ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const hashColor = (id: number) => palette[Math.abs(id) % palette.length] ?? palette[0] ?? '#4F378A'
/**
 * Normalise relation value.
 *
 * @param value - Valeur utilisée par le traitement « normalize relation value ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeRelationValue = (value?: string | string[]) => Array.isArray(value) ? String(value[0] || '') : String(value || '')
// Les valeurs injectées dans les filtres PocketBase doivent échapper guillemets et antislashs.
/**
 * Calcule la valeur « escape filter value ».
 *
 * @param value - Valeur utilisée par le traitement « escape filter value ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const escapeFilterValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/**
 * Convertit user.
 *
 * @param user - Valeur utilisée par le traitement « map user ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const mapUser = (user: AniListUserNode): SocialUser => ({
  // Forme commune consommee par les pages dashboard, social et profil public.
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

  // Synchronise la table locale user_friend avec les relations mutuelles AniList.
  /**
   * Synchronise user friends.
   *
   * @param mutuals - Valeur utilisée par le traitement « sync user friends ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const syncUserFriends = async (mutuals: SocialUser[]) => {
    const currentPocketbaseUserId = String(authRecord.value.id || '')
    if (!currentPocketbaseUserId) return

    // On de-duplique les ids AniList avant de chercher les utilisateurs PocketBase correspondants.
    const mutualAniListIds = Array.from(new Set(
      mutuals
        .map(user => Number(user.id || 0))
        .filter(id => Number.isFinite(id) && id > 0)
    ))

    const desiredPocketbaseFriendIds = new Set<string>()
    const chunkSize = 40

    // Les filtres PocketBase tres longs deviennent fragiles, donc les ids sont resolus par paquets.
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

    // On compare l'état désiré avec l'état existant pour éviter les créations/suppressions inutiles.
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

  /**
   * Réinitialise reset.
   *
   * @param keepError - Valeur utilisée par le traitement « reset ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const reset = (keepError = false) => {
    // Nettoie les tableaux dérivés quand le compte change ou que le chargement échoue.
    followingUsers.value = []
    followerUsers.value = []
    friendUsers.value = []
    if (!keepError) loadError.value = ''
    loadedForKey.value = ''
  }

  /**
   * Exécute graphql.
   *
   * @param query - Valeur utilisée par le traitement « request graphql ».
   * @param variables - Valeur utilisée par le traitement « request graphql ».
   * @param includeToken - Valeur utilisée par le traitement « request graphql ».
   * @param options - Valeur utilisée par le traitement « request graphql ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const requestGraphql = async (
    query: string,
    variables: Record<string, any>,
    includeToken: boolean,
    options: {
      cacheTtlMs?: number
      skipCache?: boolean
    } = {}
  ) => {
    // Tous les appels passent par le proxy Nitro pour beneficier du cache et des retries serveur.
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

  /**
   * Calcule la valeur « graphql fetch ».
   *
   * @param query - Valeur utilisée par le traitement « graphql fetch ».
   * @param variables - Valeur utilisée par le traitement « graphql fetch ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const graphqlFetch = async (query: string, variables: Record<string, any>) => {
    // AniList peut refuser certaines données privées avec le token; on retente en public si possible.
    /**
     * Analyse errors.
     *
     * @param response - Valeur utilisée par le traitement « parse errors ».
     * @returns Le résultat calculé par la fonction.
     * @sideEffects Aucun effet de bord direct identifié.
     */
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

  /**
   * Indique si follow pending.
   *
   * @param userId - Valeur utilisée par le traitement « is follow pending ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const isFollowPending = (userId: number) => followPendingIds.value.includes(Number(userId))

  /**
   * Récupère paged users.
   *
   * @param query - Valeur utilisée par le traitement « fetch paged users ».
   * @param field - Valeur utilisée par le traitement « fetch paged users ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif.
   */
  const fetchPagedUsers = async (query: string, field: 'following' | 'followers') => {
    const all: AniListUserNode[] = []
    let page = 1
    const perPage = 50
    let hasNextPage = true

    // Garde-fou à 100 pages pour éviter une boucle infinie si AniList renvoie une pagination incohérente.
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

  /**
   * Charge social.
   *
   * @param force - Valeur utilisée par le traitement « load social ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif, peut écrire dans les journaux.
   */
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
      // Les deux listes sont indépendantes; Promise.allSettled permet d'afficher les données partielles.
      const [followingResult, followersResult] = await Promise.allSettled([
        fetchPagedUsers(followingQuery, 'following'),
        fetchPagedUsers(followersQuery, 'followers')
      ])

      const followingRaw = followingResult.status === 'fulfilled' ? followingResult.value : []
      const followersRaw = followersResult.status === 'fulfilled' ? followersResult.value : []

      if (followingResult.status === 'rejected' && followersResult.status === 'rejected') {
        const details = [followingResult.reason?.message, followersResult.reason?.message].filter(Boolean).join(' | ')
        throw new Error(details || 'Les données sociales AniList sont indisponibles.')
      }

      const followersIds = new Set(followersRaw.map(user => Number(user.id)))
      const followingIds = new Set(followingRaw.map(user => Number(user.id)))

      // Le premier mapping annote chaque following avec son statut follower/ami.
      followingUsers.value = followingRaw.map((user) => {
        const mapped = mapUser(user)
        mapped.following = true
        mapped.isFollower = followersIds.has(mapped.id)
        mapped.isFriend = mapped.isFollower && mapped.following
        return mapped
      })

      // Le second mapping fait l'inverse pour afficher aussi les abonnes non suivis.
      followerUsers.value = followersRaw.map((user) => {
        const mapped = mapUser(user)
        mapped.isFollower = true
        mapped.following = followingIds.has(mapped.id)
        mapped.isFriend = mapped.isFollower && mapped.following
        return mapped
      })

      const friendMap = new Map<number, SocialUser>()
      // Map par id AniList pour fusionner les doublons venant des deux listes.
      for (const user of [...followingUsers.value, ...followerUsers.value]) {
        if (user.isFriend) friendMap.set(user.id, user)
      }
      friendUsers.value = Array.from(friendMap.values())

      try {
        // La synchro PocketBase ne doit pas empecher l'affichage des relations AniList.
        await syncUserFriends(friendUsers.value)
      } catch (error) {
        console.warn('[anilistSocial] user_friend sync failed', error)
      }

      loadedForKey.value = userKey.value
    } catch (error: any) {
      console.error('Echec du chargement des données sociales AniList :', error)
      const message = error?.data?.errors?.[0]?.message || error?.message
      loadError.value = message || 'Impossible de charger les données sociales AniList.'
      reset(true)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Bascule follow user.
   *
   * @param targetUserId - Valeur utilisée par le traitement « toggle follow user ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif.
   */
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

    // Évite les doubles clics qui enverraient plusieurs ToggleFollow pour le même utilisateur.
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

      // Recharge l'état complet après ToggleFollow, car AniList décide si l'action a suivi ou unfollow.
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

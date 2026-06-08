import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


const statsQuery = `
query ($userId: Int, $userName: String) {
  User(id: $userId, name: $userName) {
    statistics {
      anime {
        count
        minutesWatched
        meanScore
        genres { genre count }
      }
    }
  }
}
`

const activityQuery = `
query ($userId: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    activities(userId: $userId, sort: ID_DESC, type: ANIME_LIST) {
      ... on ListActivity {
        id
        status
        progress
        createdAt
        media {
          id
          title { romaji english }
          coverImage { medium large }
          siteUrl
        }
      }
    }
  }
}
`

const favoriteAnimePageQuery = `
query ($userId: Int, $userName: String, $page: Int, $perPage: Int) {
  User(id: $userId, name: $userName) {
    favourites {
      anime(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        nodes {
          id
          title { romaji english }
          coverImage { medium large extraLarge }
          siteUrl
        }
      }
    }
  }
}
`

const favoriteCharacterPageQuery = `
query ($userId: Int, $userName: String, $page: Int, $perPage: Int) {
  User(id: $userId, name: $userName) {
    favourites {
      characters(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        nodes {
          id
          name { full userPreferred }
          image { medium large }
          siteUrl
        }
      }
    }
  }
}
`

/**
 * Récupère all favorite anime.
 *
 * @param graphqlRequest - Valeur utilisée par le traitement « fetch all favorite anime ».
 * @param anilistUserId - Valeur utilisée par le traitement « fetch all favorite anime ».
 * @param anilistUsername - Valeur utilisée par le traitement « fetch all favorite anime ».
 * @param token - Valeur utilisée par le traitement « fetch all favorite anime ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
async function fetchAllFavoriteAnime(
  graphqlRequest: <T = any>(query: string, variables?: Record<string, any>, options?: { token?: string; cacheTtlMs?: number; skipCache?: boolean }) => Promise<T>,
  anilistUserId: number,
  anilistUsername: string,
  token?: string
) {
  const all: any[] = []
  let page = 1
  const perPage = 50
  let hasNextPage = true

  // AniList pagine les favoris; le garde-fou à 100 pages évite une boucle si pageInfo est incohérent.
  while (hasNextPage && page <= 100) {
    const response = await graphqlRequest<any>(
      favoriteAnimePageQuery,
      { userId: anilistUserId || null, userName: anilistUsername || null, page, perPage },
      { token, cacheTtlMs: 120_000 }
    )

    const chunk = response?.data?.User?.favourites?.anime?.nodes ?? []
    const pageInfo = response?.data?.User?.favourites?.anime?.pageInfo
    all.push(...chunk)
    hasNextPage = Boolean(pageInfo?.hasNextPage)
    page += 1
  }

  return all
}

/**
 * Récupère all favorite characters.
 *
 * @param graphqlRequest - Valeur utilisée par le traitement « fetch all favorite characters ».
 * @param anilistUserId - Valeur utilisée par le traitement « fetch all favorite characters ».
 * @param anilistUsername - Valeur utilisée par le traitement « fetch all favorite characters ».
 * @param token - Valeur utilisée par le traitement « fetch all favorite characters ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
async function fetchAllFavoriteCharacters(
  graphqlRequest: <T = any>(query: string, variables?: Record<string, any>, options?: { token?: string; cacheTtlMs?: number; skipCache?: boolean }) => Promise<T>,
  anilistUserId: number,
  anilistUsername: string,
  token?: string
) {
  const all: any[] = []
  let page = 1
  const perPage = 50
  let hasNextPage = true

  // Même stratégie que les animes favoris pour garder les deux listes synchrones dans le store.
  while (hasNextPage && page <= 100) {
    const response = await graphqlRequest<any>(
      favoriteCharacterPageQuery,
      { userId: anilistUserId || null, userName: anilistUsername || null, page, perPage },
      { token, cacheTtlMs: 120_000 }
    )

    const chunk = response?.data?.User?.favourites?.characters?.nodes ?? []
    const pageInfo = response?.data?.User?.favourites?.characters?.pageInfo
    all.push(...chunk)
    hasNextPage = Boolean(pageInfo?.hasNextPage)
    page += 1
  }

  return all
}

export const useAnilistProfileStore = defineStore('anilistProfile', () => {
  const pocketbaseStore = usePocketbaseStore()
  const anilistGraphql = useAnilistGraphql()

  const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
  const token = computed(() => authRecord.value.anilist_token ?? '')
  const userId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
  const username = computed(() => String(authRecord.value.anilist_username ?? ''))
  const userKey = computed(() => `${userId.value || 0}:${username.value || ''}`)

  const isLoading = ref(false)
  const totalAnimes = ref(0)
  const daysWatched = ref('0.0')
  const meanScore = ref('0.0')
  const genres = ref<{ genre: string; count: number }[]>([])
  const activities = ref<any[]>([])
  const favoriteAnime = ref<any[]>([])
  const favoriteCharacters = ref<any[]>([])
  const loadedForKey = ref('')

  /**
   * Réinitialise reset.
   *
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const reset = () => {
    totalAnimes.value = 0
    daysWatched.value = '0.0'
    meanScore.value = '0.0'
    genres.value = []
    activities.value = []
    favoriteAnime.value = []
    favoriteCharacters.value = []
    loadedForKey.value = ''
  }

  /**
   * Charge profile.
   *
   * @param force - Valeur utilisée par le traitement « load profile ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif, effectue des appels réseau ou persistants, peut écrire dans les journaux.
   */
  const loadProfile = async (force = false) => {
    if (!force && loadedForKey.value === userKey.value) return
    if (isLoading.value) return

    if (!userId.value && !username.value) {
      reset()
      return
    }

    isLoading.value = true
    try {
      // Stats et favoris sont independants; allSettled permet de garder les favoris si les stats echouent.
      const statsPromise = anilistGraphql.request<any>(
        statsQuery,
        { userId: userId.value || null, userName: username.value || null },
        { token: token.value, cacheTtlMs: 120_000 }
      )

      const [statsResult, favoriteAnimeResult, favoriteCharactersResult] = await Promise.allSettled([
        statsPromise,
        fetchAllFavoriteAnime(anilistGraphql.request, userId.value, username.value, token.value),
        fetchAllFavoriteCharacters(anilistGraphql.request, userId.value, username.value, token.value)
      ])

      const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : null
      const allFavoriteAnime = favoriteAnimeResult.status === 'fulfilled' ? favoriteAnimeResult.value : []
      const allFavoriteCharacters = favoriteCharactersResult.status === 'fulfilled' ? favoriteCharactersResult.value : []

      const animeStats = statsRes?.data?.User?.statistics?.anime
      if (animeStats) {
        // minutesWatched est converti en jours pour l'affichage profil.
        totalAnimes.value = animeStats.count ?? 0
        daysWatched.value = ((animeStats.minutesWatched ?? 0) / 1440).toFixed(1)
        meanScore.value = Number(animeStats.meanScore ?? 0).toFixed(1)
        genres.value = [...(animeStats.genres ?? [])].sort((a, b) => b.count - a.count)
      } else {
        totalAnimes.value = 0
        daysWatched.value = '0.0'
        meanScore.value = '0.0'
        genres.value = []
      }

      activities.value = []
      favoriteAnime.value = allFavoriteAnime
      favoriteCharacters.value = allFavoriteCharacters
      loadedForKey.value = userKey.value
    } catch (error) {
      console.error('Echec du chargement des données du profil :', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère activity page.
   *
   * @param page - Valeur utilisée par le traitement « fetch activity page ».
   * @param perPage - Valeur utilisée par le traitement « fetch activity page ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const fetchActivityPage = async (page: number, perPage: number) => {
    if (!userId.value) return []

    // Activités chargées à part pour permettre l'infinite scroll de la page profil.
    const response = await anilistGraphql.request<any>(
      activityQuery,
      { userId: userId.value, page, perPage },
      { token: token.value, cacheTtlMs: 15_000 }
    )

    return response?.data?.Page?.activities ?? []
  }

  return {
    isLoading,
    totalAnimes,
    daysWatched,
    meanScore,
    genres,
    activities,
    favoriteAnime,
    favoriteCharacters,
    loadProfile,
    fetchActivityPage,
    reset
  }
})

import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'

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
          title { romaji english }
          coverImage { medium }
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
          coverImage { medium large }
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

async function fetchAllFavoriteAnime(
  headers: Record<string, string>,
  anilistUserId: number,
  anilistUsername: string
) {
  const all: any[] = []
  let page = 1
  const perPage = 50
  let hasNextPage = true

  while (hasNextPage && page <= 100) {
    const response = await $fetch<any>('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: {
        query: favoriteAnimePageQuery,
        variables: { userId: anilistUserId || null, userName: anilistUsername || null, page, perPage }
      }
    })

    const chunk = response?.data?.User?.favourites?.anime?.nodes ?? []
    const pageInfo = response?.data?.User?.favourites?.anime?.pageInfo
    all.push(...chunk)
    hasNextPage = Boolean(pageInfo?.hasNextPage)
    page += 1
  }

  return all
}

async function fetchAllFavoriteCharacters(
  headers: Record<string, string>,
  anilistUserId: number,
  anilistUsername: string
) {
  const all: any[] = []
  let page = 1
  const perPage = 50
  let hasNextPage = true

  while (hasNextPage && page <= 100) {
    const response = await $fetch<any>('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: {
        query: favoriteCharacterPageQuery,
        variables: { userId: anilistUserId || null, userName: anilistUsername || null, page, perPage }
      }
    })

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

  const loadProfile = async (force = false) => {
    if (!force && loadedForKey.value === userKey.value) return
    if (isLoading.value) return

    if (!userId.value && !username.value) {
      reset()
      return
    }

    isLoading.value = true
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token.value) headers.Authorization = `Bearer ${token.value}`

      const statsPromise = $fetch<any>('https://graphql.anilist.co', {
        method: 'POST',
        headers,
        body: { query: statsQuery, variables: { userId: userId.value || null, userName: username.value || null } }
      })

      const [statsResult, favoriteAnimeResult, favoriteCharactersResult] = await Promise.allSettled([
        statsPromise,
        fetchAllFavoriteAnime(headers, userId.value, username.value),
        fetchAllFavoriteCharacters(headers, userId.value, username.value)
      ])

      const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : null
      const allFavoriteAnime = favoriteAnimeResult.status === 'fulfilled' ? favoriteAnimeResult.value : []
      const allFavoriteCharacters = favoriteCharactersResult.status === 'fulfilled' ? favoriteCharactersResult.value : []

      const animeStats = statsRes?.data?.User?.statistics?.anime
      if (animeStats) {
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
      console.error('Failed to load profile data:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchActivityPage = async (page: number, perPage: number) => {
    if (!userId.value) return []

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token.value) headers.Authorization = `Bearer ${token.value}`

    const response = await $fetch<any>('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: {
        query: activityQuery,
        variables: { userId: userId.value, page, perPage }
      }
    })

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

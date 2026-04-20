import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'

// Ce store prepare les donnees affichees sur le profil AniList :
// statistiques, favoris et activites.
// L'interface ne parle donc pas directement a l'API : elle lit simplement ce store.

// Requete des statistiques globales du profil AniList.
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

// Requete paginee de l'activite recente de la liste anime.
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

// Requete paginee des animes favoris.
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

// Requete paginee des personnages favoris.
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
  graphqlRequest: <T = any>(query: string, variables?: Record<string, any>, options?: { token?: string; cacheTtlMs?: number; skipCache?: boolean }) => Promise<T>,
  anilistUserId: number,
  anilistUsername: string,
  token?: string
) {
  const all: any[] = []
  let page = 1
  const perPage = 50
  let hasNextPage = true

  // Parcourt toutes les pages pour produire une liste complete cote client.
  while (hasNextPage && page <= 100) {
    // A chaque tour de boucle, on demande une page supplementaire de favoris.
    const response = await graphqlRequest<any>(
      favoriteAnimePageQuery,
      { userId: anilistUserId || null, userName: anilistUsername || null, page, perPage },
      { token, cacheTtlMs: 120_000 }
    )

    // "chunk" represente seulement le morceau recu pour cette page.
    const chunk = response?.data?.User?.favourites?.anime?.nodes ?? []
    const pageInfo = response?.data?.User?.favourites?.anime?.pageInfo
    // On ajoute ce morceau a la liste globale.
    all.push(...chunk)
    hasNextPage = Boolean(pageInfo?.hasNextPage)
    page += 1
  }

  return all
}

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

  // Meme strategie de pagination que pour les animes favoris.
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

  // Informations AniList derivees du compte local connecte.
  // computed permet de recalculer automatiquement ces valeurs quand authRecord change.
  const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
  const token = computed(() => authRecord.value.anilist_token ?? '')
  const userId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
  const username = computed(() => String(authRecord.value.anilist_username ?? ''))
  // Cette cle permet de savoir pour quel utilisateur les donnees ont deja ete chargees.
  const userKey = computed(() => `${userId.value || 0}:${username.value || ''}`)

  // Etat reactif expose a l'interface profil.
  const isLoading = ref(false)
  const totalAnimes = ref(0)
  const daysWatched = ref('0.0')
  const meanScore = ref('0.0')
  const genres = ref<{ genre: string; count: number }[]>([])
  const activities = ref<any[]>([])
  const favoriteAnime = ref<any[]>([])
  const favoriteCharacters = ref<any[]>([])
  const loadedForKey = ref('')

  // Remet le store a zero quand aucun profil AniList n'est disponible.
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

  // Charge les donnees du profil et evite les rechargements inutiles.
  const loadProfile = async (force = false) => {
    // Si on a deja charge les donnees pour le meme utilisateur, on evite un nouvel appel reseau.
    if (!force && loadedForKey.value === userKey.value) return
    // Si un chargement est deja en cours, on ne lance pas un second chargement en parallele.
    if (isLoading.value) return

    // Si aucun compte AniList n'est lie, on vide les anciennes donnees par securite.
    if (!userId.value && !username.value) {
      reset()
      return
    }

    isLoading.value = true
    try {
      // On prepare la promesse des statistiques.
      const statsPromise = anilistGraphql.request<any>(
        statsQuery,
        { userId: userId.value || null, userName: username.value || null },
        { token: token.value, cacheTtlMs: 120_000 }
      )

      // On lance plusieurs recuperations en parallele pour gagner du temps.
      const [statsResult, favoriteAnimeResult, favoriteCharactersResult] = await Promise.allSettled([
        statsPromise,
        fetchAllFavoriteAnime(anilistGraphql.request, userId.value, username.value, token.value),
        fetchAllFavoriteCharacters(anilistGraphql.request, userId.value, username.value, token.value)
      ])

      // Les favoris peuvent echouer sans bloquer totalement l'affichage des statistiques.
      const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : null
      const allFavoriteAnime = favoriteAnimeResult.status === 'fulfilled' ? favoriteAnimeResult.value : []
      const allFavoriteCharacters = favoriteCharactersResult.status === 'fulfilled' ? favoriteCharactersResult.value : []

      const animeStats = statsRes?.data?.User?.statistics?.anime
      if (animeStats) {
        // AniList renvoie le temps en minutes.
        // On le transforme ici en jours avec une decimale pour l'affichage.
        totalAnimes.value = animeStats.count ?? 0
        daysWatched.value = ((animeStats.minutesWatched ?? 0) / 1440).toFixed(1)
        meanScore.value = Number(animeStats.meanScore ?? 0).toFixed(1)
        // On trie les genres du plus present au moins present.
        genres.value = [...(animeStats.genres ?? [])].sort((a, b) => b.count - a.count)
      } else {
        totalAnimes.value = 0
        daysWatched.value = '0.0'
        meanScore.value = '0.0'
        genres.value = []
      }

      // Les activites ne sont pas chargees ici completement.
      // Elles seront chargees page par page avec fetchActivityPage().
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

  // Charge une page d'activites a la demande pour un affichage incremental.
  const fetchActivityPage = async (page: number, perPage: number) => {
    // Sans identifiant AniList, il est impossible de demander des activites.
    if (!userId.value) return []

    const response = await anilistGraphql.request<any>(
      activityQuery,
      { userId: userId.value, page, perPage },
      { token: token.value, cacheTtlMs: 15_000 }
    )

    // On renvoie toujours un tableau, meme si la reponse est incomplete.
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

/*
Definition des termes techniques :
- store : module d'etat partage accessible depuis plusieurs composants.
- computed : valeur derivee recalculee automatiquement quand ses dependances changent.
- pagination : decoupage d'un grand jeu de donnees en pages successives.
- Promise.allSettled : methode qui attend plusieurs promesses sans echouer des la premiere erreur.
- cache : memoire temporaire des reponses pour limiter les appels reseau.
- GraphQL : langage de requete d'API base sur les champs demandes.
- payload : donnees transportees par une requete ou une reponse.
*/

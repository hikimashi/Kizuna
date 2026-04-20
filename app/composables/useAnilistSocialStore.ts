import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'

// Ce store s'occupe de tout ce qui concerne le reseau social AniList :
// les comptes suivis, les abonnes et les amis.
// Un ami, ici, est simplement quelqu'un qui est a la fois "following" et "follower".

// Structure minimale attendue depuis AniList pour les listes sociales.
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

// Requete des comptes suivis.
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

// Requete des abonnes du compte.
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

// Palette deterministe pour donner une couleur d'avatar de secours.
const palette = ['#4F378A', '#9256F3', '#F77F00', '#06D6A0', '#D62828', '#4361EE', '#FF6B9D', '#FFBE0B', '#6A0572', '#1DD3B0']

const formatJoined = (timestamp?: number) => {
  // Si AniList n'envoie rien, on renvoie une valeur lisible plutot qu'une erreur.
  if (!timestamp) return 'Unknown'
  // AniList renvoie un timestamp en secondes ; JavaScript attend des millisecondes.
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
}

// Associe toujours le meme identifiant a la meme couleur.
const hashColor = (id: number) => palette[Math.abs(id) % palette.length] ?? palette[0] ?? '#4F378A'

// Normalise la forme AniList brute vers le format consomme par l'interface.
const mapUser = (user: AniListUserNode): SocialUser => ({
  // Number(...) force un nombre meme si l'API renvoie une valeur d'un autre type.
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
  const anilistGraphql = useAnilistGraphql()

  // Cle de cache simple pour savoir si les donnees chargees correspondent deja a l'utilisateur courant.
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

  // Vide l'etat social courant, avec option pour conserver le message d'erreur precedent.
  const reset = (keepError = false) => {
    followingUsers.value = []
    followerUsers.value = []
    friendUsers.value = []
    if (!keepError) loadError.value = ''
    loadedForKey.value = ''
  }

  // Passe par un helper unique pour injecter ou non le token AniList.
  const requestGraphql = async (
    query: string,
    variables: Record<string, any>,
    includeToken: boolean
  ) => {
    // Certaines requetes sociales fonctionnent mieux avec le token,
    // mais on veut parfois pouvoir retenter sans ce token si AniList le refuse.
    const payload = await anilistGraphql.request<any>(
      query,
      variables,
      {
        token: includeToken ? token.value : '',
        cacheTtlMs: 60_000
      }
    )

    return payload
  }

  // Rejoue sans token quand AniList refuse une requete privee ou un token invalide.
  const graphqlFetch = async (query: string, variables: Record<string, any>) => {
    const parseErrors = (response: any) => {
      if (!response?.errors?.length) return ''
      // On rassemble plusieurs messages d'erreur dans une seule chaine.
      return response.errors.map((error: any) => error?.message).filter(Boolean).join(' | ')
    }

    // Premier essai : on envoie le token.
    let response = await requestGraphql(query, variables, true)
    let errorMessage = parseErrors(response)

    if (!errorMessage) return response

    // On convertit en minuscules pour faire des tests de texte plus simples.
    const lowered = errorMessage.toLowerCase()
    const shouldRetryWithoutToken =
      lowered.includes('token')
      || lowered.includes('unauthorized')
      || lowered.includes('invalid')
      || lowered.includes('private')

    if (shouldRetryWithoutToken) {
      // Deuxieme essai : on retire le token, utile si AniList considere qu'il bloque l'acces.
      response = await requestGraphql(query, variables, false)
      errorMessage = parseErrors(response)
      if (!errorMessage) return response
    }

    throw new Error(errorMessage || 'AniList GraphQL error')
  }

  // Rassemble toutes les pages d'une relation sociale.
  const fetchPagedUsers = async (query: string, field: 'following' | 'followers') => {
    const all: AniListUserNode[] = []
    let page = 1
    const perPage = 50
    let hasNextPage = true

    while (hasNextPage && page <= 100) {
      // On demande une page a la fois pour reconstruire la liste complete.
      const response = await graphqlFetch(query, { userId: anilistUserId.value, page, perPage })

      const pageNode = response?.data?.Page
      const chunk = (pageNode?.[field] ?? []) as AniListUserNode[]
      // On fusionne cette page avec ce qu'on a deja recupere.
      all.push(...chunk)
      hasNextPage = Boolean(pageNode?.pageInfo?.hasNextPage)
      page += 1
    }

    return all
  }

  // Construit les listes "suivis", "abonnes" et "amis" a partir des donnees AniList.
  const loadSocial = async (force = false) => {
    if (!force && loadedForKey.value === userKey.value) return
    if (isLoading.value) return

    // Sans identifiant AniList, on ne peut pas recuperer les relations sociales.
    if (!anilistUserId.value) {
      reset()
      return
    }

    isLoading.value = true
    loadError.value = ''

    try {
      // On charge "following" et "followers" en parallele pour reduire l'attente.
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

      // On marque chaque utilisateur suivi avec ses drapeaux logiques.
      followingUsers.value = followingRaw.map((user) => {
        const mapped = mapUser(user)
        mapped.following = true
        mapped.isFollower = followersIds.has(mapped.id)
        mapped.isFriend = mapped.isFollower && mapped.following
        return mapped
      })

      // Meme travail pour les abonnes, mais avec l'indicateur inverse.
      followerUsers.value = followersRaw.map((user) => {
        const mapped = mapUser(user)
        mapped.isFollower = true
        mapped.following = followingIds.has(mapped.id)
        mapped.isFriend = mapped.isFollower && mapped.following
        return mapped
      })

      // On dedoublonne les amis via une Map indexee par id.
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

/*
Definition des termes techniques :
- normaliser : transformer des donnees pour leur donner un format unique et previsible.
- cache key : identifiant servant a savoir si une donnee deja chargee peut etre reutilisee.
- pagination : chargement des resultats par blocs successifs.
- fallback : solution de repli utilisee quand le chemin principal echoue.
- GraphQL : protocole de requete d'API ou le client choisit les champs retournes.
- token : jeton d'autorisation transmis avec une requete protegee.
*/

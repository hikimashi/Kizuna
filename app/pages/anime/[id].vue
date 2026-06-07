<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSync, type EditableAniListStatus } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useSharedLists, type SharedListSummary } from '~/composables/useSharedLists'
import BrowseAnimeCard from '~/components/BrowseAnimeCard.vue'
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


type FuzzyDate = { year?: number | null; month?: number | null; day?: number | null }
type MediaTitle = { romaji?: string | null; english?: string | null; native?: string | null }
type CoverImage = { medium?: string | null; large?: string | null; color?: string | null }
type Ranking = { rank?: number | null; type?: string | null; allTime?: boolean | null }
type MediaTag = { name?: string | null; rank?: number | null; isMediaSpoiler?: boolean | null }
type StreamingEpisode = { title?: string | null; thumbnail?: string | null; url?: string | null }
type RelationEdge = {
  relationType?: string | null
  node?: { id: number; type?: string | null; title?: MediaTitle | null; coverImage?: CoverImage | null } | null
}
type CharacterEdge = {
  role?: string | null
  node?: { id: number; name?: { full?: string | null } | null; image?: { large?: string | null } | null } | null
  voiceActors?: Array<{
    id: number
    languageV2?: string | null
    name?: { full?: string | null } | null
    image?: { large?: string | null } | null
  }>
}
type Recommendation = {
  rating?: number | null
  mediaRecommendation?: {
    id: number
    title?: MediaTitle | null
    coverImage?: CoverImage | null
    averageScore?: number | null
    episodes?: number | null
    format?: string | null
    seasonYear?: number | null
    genres?: string[] | null
  } | null
}
type Review = {
  id: number
  rating?: number | null
  score?: number | null
  summary?: string | null
  body?: string | null
  user?: { name?: string | null; avatar?: { large?: string | null } | null } | null
}
type ExternalLink = {
  site?: string | null
  url?: string | null
  color?: string | null
  icon?: string | null
}
type StatsBucket = { score?: number | null; amount?: number | null }
type StatusBucket = { status?: string | null; amount?: number | null }
type MediaData = {
  id: number
  title?: MediaTitle | null
  description?: string | null
  bannerImage?: string | null
  coverImage?: CoverImage | null
  averageScore?: number | null
  meanScore?: number | null
  popularity?: number | null
  favourites?: number | null
  isFavourite?: boolean | null
  episodes?: number | null
  duration?: number | null
  format?: string | null
  status?: string | null
  season?: string | null
  seasonYear?: number | null
  source?: string | null
  hashtag?: string | null
  genres?: string[] | null
  rankings?: Ranking[] | null
  tags?: MediaTag[] | null
  streamingEpisodes?: StreamingEpisode[] | null
  externalLinks?: ExternalLink[] | null
  startDate?: FuzzyDate | null
  endDate?: FuzzyDate | null
  trailer?: { site?: string | null; id?: string | null; thumbnail?: string | null } | null
  studios?: { nodes?: Array<{ name?: string | null; isAnimationStudio?: boolean | null }> | null } | null
  relations?: { edges?: RelationEdge[] | null } | null
  recommendations?: { nodes?: Recommendation[] | null } | null
  characters?: { edges?: CharacterEdge[] | null } | null
  reviews?: { nodes?: Review[] | null } | null
  stats?: { scoreDistribution?: StatsBucket[] | null; statusDistribution?: StatusBucket[] | null } | null
  mediaListEntry?: { id?: number | null; status?: string | null } | null
}
type Activity = {
  id: number
  status?: string | null
  progress?: string | null
  createdAt?: number | null
  replyCount?: number | null
  likeCount?: number | null
  isLiked?: boolean | null
  isSubscribed?: boolean | null
  user?: { name?: string | null; avatar?: { medium?: string | null } | null } | null
  media?: {
    id?: number | null
    title?: MediaTitle | null
    coverImage?: { medium?: string | null; large?: string | null } | null
  } | null
}
type ThreadCategory = { id?: number | null; name?: string | null }
type SocialThread = {
  id: number
  title?: string | null
  replyCount?: number | null
  viewCount?: number | null
  repliedAt?: number | null
  user?: { name?: string | null; avatar?: { medium?: string | null } | null } | null
  categories?: ThreadCategory[] | null
}
type SocialBundle = {
  global: Activity[]
  following: Activity[]
  self: Activity[]
  threads: SocialThread[]
}
type AniListGraphqlResponse<T> = { data?: T; errors?: Array<{ message?: string | null }> | null }
type AnimeDescriptionTranslationResponse = {
  description: string
  translated: boolean
  provider: string
}

const route = useRoute()
const animeId = computed(() => Number(route.params.id))
const selectedTab = ref<'overview' | 'watch' | 'characters' | 'reviews' | 'stats' | 'social'>('overview')
const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const anilistSync = useAnilistSync()
const sharedListsStore = useSharedLists()
const actionBusy = ref<'favorite' | 'list' | null>(null)
const listMenuOpen = ref(false)
const listActionRef = ref<HTMLElement | null>(null)
const sharedListActionRef = ref<HTMLElement | null>(null)
const anilistToken = computed(() => String(((pocketbaseStore.authRecord as any) || {})?.anilist_token ?? ''))
const anilistUserId = computed(() => Number(((pocketbaseStore.authRecord as any) || {})?.anilist_user_id ?? 0))
const isSharedListsLoading = ref(false)
const isAddingToSharedList = ref(false)
const sharedListError = ref('')
const showSharedListPicker = ref(false)
const sharedLists = ref<SharedListSummary[]>([])
const socialFeedType = ref<'SELF' | 'FOLLOWING' | 'GLOBAL'>('GLOBAL')
const socialPageSize = ref(8)
const reviewPage = ref(1)
const reviewPageSize = 10
const expandedReviews = ref<Record<number, boolean>>({})
const recommendationViewportWidth = ref(0)
const showAllRecommendations = ref(false)

const mediaQuery = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      description(asHtml: false)
      bannerImage
      coverImage { medium large color }
      averageScore
      meanScore
      popularity
      favourites
      isFavourite
      episodes
      duration
      format
      status
      season
      seasonYear
      source
      hashtag
      genres
      externalLinks {
        site
        url
        color
        icon
      }
      startDate { year month day }
      endDate { year month day }
      trailer { site id thumbnail }
      rankings { rank type allTime }
      tags { name rank isMediaSpoiler }
      streamingEpisodes { title thumbnail url }
      studios { nodes { name isAnimationStudio } }
      mediaListEntry { id status }
      relations {
        edges {
          relationType
          node {
            id
            type
            title { romaji english native }
            coverImage { medium large color }
          }
        }
      }
        recommendations(sort: [RATING_DESC]) {
          nodes {
            rating
            mediaRecommendation {
              id
              title { romaji english native }
              coverImage { medium large color }
              averageScore
              episodes
              format
              seasonYear
              genres
            }
          }
        }
      characters(sort: [ROLE, RELEVANCE, ID]) {
        edges {
          role
          node {
            id
            name { full }
            image { large }
          }
          voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
            id
            languageV2
            name { full }
            image { large }
          }
        }
      }
      stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
      }
    }
  }
`

const reviewsQuery = `
  query ($id: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
      }
      reviews(mediaId: $id, sort: [RATING_DESC, SCORE_DESC]) {
        id
        rating
        score
        summary
        body(asHtml: false)
        user {
          name
          avatar { large }
        }
      }
    }
  }
`

const socialActivitiesQuery = `
  query ($id: Int, $page: Int, $perPage: Int, $userId: Int, $isFollowing: Boolean) {
    Page(page: $page, perPage: $perPage) {
      activities(mediaId: $id, sort: ID_DESC, type: MEDIA_LIST, userId: $userId, isFollowing: $isFollowing) {
        ... on ListActivity {
          id
          status
          progress
          createdAt
          replyCount
          likeCount
          isLiked
          isSubscribed
          user {
            name
            avatar { medium }
          }
          media {
            id
            title { romaji english native }
            coverImage { medium large }
          }
        }
      }
    }
  }
`

const socialThreadsQuery = `
  query ($id: Int) {
    Page(page: 1, perPage: 6) {
      threads(mediaCategoryId: $id, sort: [REPLIED_AT_DESC]) {
        id
        title
        replyCount
        viewCount
        repliedAt
        user {
          name
          avatar { medium }
        }
        categories {
          id
          name
        }
      }
    }
  }
`

const toggleFavouriteMutation = `
  mutation ($animeId: Int) {
    ToggleFavourite(animeId: $animeId) {
      anime {
        nodes { id }
      }
    }
  }
`

/**
 * Normalise description.
 *
 * @param value - Valeur utilisée par le traitement « normalize description ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeDescription = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const mediaState = await useAsyncData(
  () => `anime-detail-${animeId.value}-${anilistToken.value ? 'auth' : 'public'}`,
  async () => {
    const response = await anilistGraphql.request<AniListGraphqlResponse<{ Media?: MediaData | null }>>(
      mediaQuery,
      { id: animeId.value },
      { token: anilistToken.value, cacheTtlMs: anilistToken.value ? 15_000 : 120_000 }
    )
    return response.data?.Media ?? null
  },
  { watch: [animeId, anilistToken] }
)

const socialState = await useAsyncData(
  () => `anime-social-${animeId.value}-${socialPageSize.value}-${anilistToken.value ? 'auth' : 'public'}`,
  async () => {
    const activityOptions = {
      token: anilistToken.value,
      cacheTtlMs: anilistToken.value ? 20_000 : 45_000
    }

    const baseVariables = {
      id: animeId.value,
      page: 1,
      perPage: socialPageSize.value
    }

    // Charge les flux publics, suivis, personnels et forums en parallele pour composer l'onglet social.
    const [globalResponse, followingResponse, selfResponse, threadsResponse] = await Promise.all([
      anilistGraphql.request<AniListGraphqlResponse<{ Page?: { activities?: Activity[] | null } }>>(
        socialActivitiesQuery,
        baseVariables,
        activityOptions
      ),
      anilistToken.value
        ? anilistGraphql.request<AniListGraphqlResponse<{ Page?: { activities?: Activity[] | null } }>>(
            socialActivitiesQuery,
            { ...baseVariables, isFollowing: true },
            activityOptions
          )
        : Promise.resolve(null),
      anilistToken.value && anilistUserId.value
        ? anilistGraphql.request<AniListGraphqlResponse<{ Page?: { activities?: Activity[] | null } }>>(
            socialActivitiesQuery,
            { ...baseVariables, userId: anilistUserId.value },
            activityOptions
          )
        : Promise.resolve(null),
      anilistGraphql.request<AniListGraphqlResponse<{ Page?: { threads?: SocialThread[] | null } }>>(
        socialThreadsQuery,
        { id: animeId.value },
        { cacheTtlMs: 120_000 }
      )
    ])

    return {
      global: globalResponse.data?.Page?.activities ?? [],
      following: followingResponse?.data?.Page?.activities ?? [],
      self: selfResponse?.data?.Page?.activities ?? [],
      threads: threadsResponse.data?.Page?.threads ?? []
    } satisfies SocialBundle
  },
  {
    default: () => ({ global: [], following: [], self: [], threads: [] }),
    watch: [animeId, socialPageSize, anilistToken, anilistUserId]
  }
)

const reviewsState = await useAsyncData(
  () => `anime-reviews-${animeId.value}-${reviewPage.value}`,
  async () => {
    const aggregated: Review[] = []
    let hasNextPage = false

    // reviewPage représente "combien de pages afficher"; on agrège depuis la première pour garder l'ordre.
    for (let page = 1; page <= reviewPage.value; page += 1) {
      const response = await anilistGraphql.request<AniListGraphqlResponse<{
        Page?: {
          pageInfo?: { hasNextPage?: boolean | null } | null
          reviews?: Review[] | null
        } | null
      }>>(
        reviewsQuery,
        { id: animeId.value, page, perPage: reviewPageSize },
        { cacheTtlMs: 120_000 }
      )

      aggregated.push(...(response.data?.Page?.reviews || []))
      hasNextPage = Boolean(response.data?.Page?.pageInfo?.hasNextPage)
    }

    return { reviews: aggregated, hasNextPage }
  },
  {
    default: () => ({ reviews: [], hasNextPage: false }),
    watch: [animeId, reviewPage]
  }
)

const sourceDescription = computed(() => normalizeDescription(String(mediaState.data.value?.description || '')))

const translatedDescriptionState = await useAsyncData(
  () => `anime-description-translation-${animeId.value}-${sourceDescription.value ? 'ready' : 'empty'}`,
  async () => {
    if (!sourceDescription.value) {
      return null
    }

    try {
      // La traduction passe par Nitro pour beneficier du cache et masquer les details du provider.
      return await $fetch<AnimeDescriptionTranslationResponse>('/api/translate/animeDescription', {
        method: 'POST',
        body: {
          mediaId: animeId.value,
          description: sourceDescription.value,
          targetLang: 'fr'
        }
      })
    } catch {
      return null
    }
  },
  {
    default: () => null,
    watch: [animeId, sourceDescription]
  }
)

const media = computed(() => mediaState.data.value)
const socialBundle = computed<SocialBundle>(() => socialState.data.value ?? { global: [], following: [], self: [], threads: [] })
const reviewsBundle = computed(() => reviewsState.data.value ?? { reviews: [], hasNextPage: false })
const globalActivities = computed(() => socialBundle.value.global ?? [])
const followingActivities = computed(() => socialBundle.value.following ?? [])
const selfActivities = computed(() => socialBundle.value.self ?? [])
const socialThreads = computed(() => socialBundle.value.threads ?? [])
const loading = computed(() => mediaState.pending.value && !mediaState.data.value)
const hasError = computed(() => !mediaState.pending.value && Boolean(mediaState.error.value))
const socialPending = computed(() => socialState.pending.value)
const socialLoading = computed(() => socialState.pending.value && !socialBundle.value.global.length && !socialBundle.value.threads.length)
const pageTitle = computed(() => media.value?.title?.english || media.value?.title?.romaji || 'Anime')
const bannerImage = computed(() => media.value?.bannerImage || media.value?.coverImage?.large || media.value?.coverImage?.medium || '')
const coverImage = computed(() => media.value?.coverImage?.large || media.value?.coverImage?.medium || '')
const description = computed(() => {
  const translated = translatedDescriptionState.data.value?.description
  return normalizeDescription(String(translated || sourceDescription.value || ''))
})
const rankings = computed(() => (media.value?.rankings || []).filter((item) => item.rank && item.allTime).slice(0, 2))
const studios = computed(() => (media.value?.studios?.nodes || []).filter(Boolean))
const animationStudio = computed(() => studios.value.find((item) => item?.isAnimationStudio)?.name || studios.value[0]?.name || 'Inconnu')
const producers = computed(() =>
  studios.value
    .filter((item) => !item?.isAnimationStudio)
    .map((item) => item?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 5)
)
const genres = computed(() => ((media.value?.genres || []).filter(Boolean) as string[]).slice(0, 6))
const tags = computed(() =>
  (media.value?.tags || [])
    .filter((tag): tag is MediaTag & { name: string } => Boolean(tag?.name) && !tag.isMediaSpoiler)
    .slice(0, 10)
)
const relations = computed(() => (media.value?.relations?.edges || []).filter((edge) => edge?.node).slice(0, 4))
const allCharacters = computed(() => (media.value?.characters?.edges || []).filter((edge) => edge?.node))
const overviewCharacters = computed(() => allCharacters.value.slice(0, 8))
const characters = computed(() => allCharacters.value)
const watchEpisodes = computed(() =>
  (media.value?.streamingEpisodes || [])
    .filter((item) => item?.url && item?.thumbnail)
    .slice(0, 8)
)
const streamingLinks = computed(() => {
  const priority = [
    'Crunchyroll',
    'Netflix',
    'HIDIVE',
    'Disney Plus',
    'Hulu',
    'Prime Video',
    'ADN',
    'Anime Digital Network',
    'Funimation'
  ]

  const links = (media.value?.externalLinks || []).filter((item) => item?.url && item?.site)
  return [...links]
    .sort((a, b) => {
      const aIndex = priority.findIndex((label) => a.site?.toLowerCase().includes(label.toLowerCase()))
      const bIndex = priority.findIndex((label) => b.site?.toLowerCase().includes(label.toLowerCase()))
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })
    .slice(0, 8)
})
const allRecommendations = computed(() => (media.value?.recommendations?.nodes || []).filter((item) => item?.mediaRecommendation))
const recommendationBaseLimit = computed(() => {
  const width = recommendationViewportWidth.value
  // La limite suit les colonnes visibles pour éviter une rangée incomplète trop longue.
  if (width >= 1600) return 10
  if (width >= 1280) return 8
  if (width >= 900) return 6
  if (width >= 640) return 4
  return 2
})
const recommendations = computed(() =>
  showAllRecommendations.value
    ? allRecommendations.value
    : allRecommendations.value.slice(0, recommendationBaseLimit.value)
)
const hasHiddenRecommendations = computed(() => allRecommendations.value.length > recommendationBaseLimit.value)
const reviews = computed(() => (reviewsBundle.value.reviews || []).filter(Boolean))
const overviewReviews = computed(() => reviews.value.slice(0, 3))
const hasMoreReviews = computed(() => Boolean(reviewsBundle.value.hasNextPage))
const canUsePersonalFeeds = computed(() => Boolean(anilistToken.value && anilistUserId.value))
const activeSocialActivities = computed(() => {
  // L'onglet social partage le même rendu; seul le tableau source change selon le filtre.
  if (socialFeedType.value === 'SELF') return selfActivities.value
  if (socialFeedType.value === 'FOLLOWING') return followingActivities.value
  return globalActivities.value
})
const canLoadMoreSocial = computed(() => activeSocialActivities.value.length >= socialPageSize.value && activeSocialActivities.value.length > 0)
const socialFeedOptions = computed(() => [
  { key: 'SELF' as const, label: 'Moi', disabled: !canUsePersonalFeeds.value },
  { key: 'FOLLOWING' as const, label: 'Suivis', disabled: !canUsePersonalFeeds.value },
  { key: 'GLOBAL' as const, label: 'Global', disabled: false }
])
const followingLatestByUser = computed(() => {
  const seen = new Set<string>()
  return followingActivities.value.filter((activity) => {
    const name = activity.user?.name || ''
    // Garde seulement la dernière activité par utilisateur pour le résumé latéral.
    if (!name || seen.has(name)) return false
    seen.add(name)
    return true
  })
})
const followingUserCount = computed(() => followingLatestByUser.value.length)
const followingStatusCounts = computed(() => {
  const counts = new Map<string, number>()

  // Les statuts bruts AniList sont traduits avant regroupement pour éviter les doublons d'affichage.
  for (const activity of followingLatestByUser.value) {
    const key = formatStatus(activity.status)
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return [...counts.entries()].map(([label, count]) => ({ label, count })).slice(0, 4)
})
const followingTimelineItems = computed(() => {
  const sorted = [...followingActivities.value].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  const items: Array<{ type: 'activity'; activity: Activity } | { type: 'gap'; label: string }> = []
  let previousTimestamp = 0

  // Insère des séparateurs quand l'activité des suivis saute plusieurs semaines.
  for (const activity of sorted) {
    const currentTimestamp = activity.createdAt || 0
    if (previousTimestamp) {
      const delta = currentTimestamp - previousTimestamp
      if (delta > 45 * 86_400) {
        items.push({ type: 'gap', label: formatTimelineGap(delta) })
      }
    }
    items.push({ type: 'activity', activity })
    previousTimestamp = currentTimestamp
  }

  return items
})
const createThreadUrl = computed(() => `https://anilist.co/forum/thread/editor/new?mediaId=${animeId.value}`)

watch(canUsePersonalFeeds, (available) => {
  // Les flux Moi/Suivis dependent du token AniList; on force un onglet valide si le token disparait.
  if (!available) {
    socialFeedType.value = 'GLOBAL'
    return
  }

  // Une fois connecté, l'utilisateur arrive directement sur son activité personnelle.
  if (socialFeedType.value === 'GLOBAL') {
    socialFeedType.value = 'SELF'
  }
}, { immediate: true })

const STATUS_TRANSLATIONS: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV courte',
  MOVIE: 'Film',
  SPECIAL: 'Spécial',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Musique',
  MANGA: 'Manga',
  NOVEL: 'Roman',
  ONE_SHOT: 'One-shot',
  LIGHT_NOVEL: 'Light novel',
  VISUAL_NOVEL: 'Visual novel',
  VIDEO_GAME: 'Jeu vidéo',
  OTHER: 'Autre',
  ORIGINAL: 'Original',
  DOUJINSHI: 'Doujinshi',
  COMIC: 'BD',
  LIVE_ACTION: 'Prise de vue reelle',
  GAME: 'Jeu',
  MULTIMEDIA_PROJECT: 'Projet multimedia',
  PICTURE_BOOK: 'Album illustre',
  WEB_NOVEL: 'Web novel',
  FINISHED: 'Terminé',
  RELEASING: 'En cours',
  NOT_YET_RELEASED: 'A venir',
  CANCELLED: 'Annulé',
  HIATUS: 'En pause',
  MAIN: 'Principal',
  SUPPORTING: 'Secondaire',
  BACKGROUND: 'Figuration',
  ADAPTATION: 'Adaptation',
  PREQUEL: 'Prequelle',
  SEQUEL: 'Suite',
  PARENT: 'Parent',
  SIDE_STORY: 'Histoire annexe',
  CHARACTER: 'Personnage',
  SUMMARY: 'Resume',
  ALTERNATIVE: 'Alternative',
  SPIN_OFF: 'Spin-off',
  SOURCE: 'Source',
  COMPILATION: 'Compilation',
  CONTAINS: 'Contient',
  CURRENT: 'En cours',
  PLANNING: 'À voir',
  COMPLETED: 'Terminé',
  REPEATING: 'Revisionnage',
  PAUSED: 'En pause',
  DROPPED: 'Abandonné',
  'watched episode': 'a regardé l\'épisode',
  'plans to watch': 'prevoit de regarder',
  completed: 'a terminé',
  dropped: 'a abandonné',
  'paused watching': 'a mis en pause',
  rewatched: 'a revisionné'
}

/**
 * Formate status.
 *
 * @param value - Valeur utilisée par le traitement « format status ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatStatus(value?: string | null) {
  if (!value) return 'Inconnu'
  const raw = String(value).trim()
  const lower = raw.toLowerCase()
  const upper = raw.toUpperCase().replace(/\s+/g, '_')
  // AniList mélange enums, phrases d'activité et valeurs déjà lisibles; on tente les trois formes.
  return STATUS_TRANSLATIONS[raw]
    || STATUS_TRANSLATIONS[lower]
    || STATUS_TRANSLATIONS[upper]
    || raw
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
}

/**
 * Formate date.
 *
 * @param date - Valeur utilisée par le traitement « format date ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatDate(date?: FuzzyDate | null) {
  if (!date?.year) return 'A venir'
  return new Date(date.year, (date.month || 1) - 1, date.day || 1).toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Formate season.
 *
 * @param season - Valeur utilisée par le traitement « format season ».
 * @param year - Valeur utilisée par le traitement « format season ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatSeason(season?: string | null, year?: number | null) {
  const seasonMap: Record<string, string> = {
    WINTER: 'Hiver',
    SPRING: 'Printemps',
    SUMMER: 'Été',
    FALL: 'Automne'
  }
  return season && year ? `${seasonMap[String(season).toUpperCase()] || formatStatus(season)} ${year}` : 'Inconnu'
}

/**
 * Formate number.
 *
 * @param value - Valeur utilisée par le traitement « format number ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('fr-FR').format(value || 0)
}

/**
 * Formate compact number.
 *
 * @param value - Valeur utilisée par le traitement « format compact number ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value || 0)
}

/**
 * Calcule la valeur « relative time ».
 *
 * @param timestamp - Valeur utilisée par le traitement « relative time ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function relativeTime(timestamp?: number | null) {
  if (!timestamp) return ''
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  if (delta > 86_400) return `il y a ${Math.floor(delta / 86_400)} j`
  if (delta > 3_600) return `il y a ${Math.floor(delta / 3_600)} h`
  if (delta > 60) return `il y a ${Math.floor(delta / 60)} min`
  return 'à l\'instant'
}

/**
 * Formate progress.
 *
 * @param activity - Valeur utilisée par le traitement « format progress ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatProgress(activity: Activity) {
  return [formatStatus(activity.status), activity.progress].filter(Boolean).join(' ')
}

/**
 * Calcule la valeur « activity media title ».
 *
 * @param activity - Valeur utilisée par le traitement « activity media title ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function activityMediaTitle(activity: Activity) {
  return activity.media?.title?.english || activity.media?.title?.romaji || activity.media?.title?.native || pageTitle.value
}

/**
 * Calcule la valeur « activity summary ».
 *
 * @param activity - Valeur utilisée par le traitement « activity summary ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function activitySummary(activity: Activity) {
  const status = activity.status
    ? `${activity.status.charAt(0).toUpperCase()}${activity.status.slice(1)}`
    : 'Mise à jour'
  // "progress" contient déjà le numéro/texte d'épisode renvoyé par AniList.
  return activity.progress ? `${formatStatus(status)} ${activity.progress} de` : formatStatus(status)
}

/**
 * Calcule la valeur « activity user url ».
 *
 * @param activity - Valeur utilisée par le traitement « activity user url ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function activityUserUrl(activity: Activity) {
  const name = activity.user?.name
  return name ? `https://anilist.co/user/${encodeURIComponent(name)}` : 'https://anilist.co'
}

/**
 * Calcule la valeur « activity external url ».
 *
 * @param activity - Valeur utilisée par le traitement « activity external url ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function activityExternalUrl(activity: Activity) {
  return `https://anilist.co/activity/${activity.id}`
}

/**
 * Calcule la valeur « thread external url ».
 *
 * @param thread - Valeur utilisée par le traitement « thread external url ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function threadExternalUrl(thread: SocialThread) {
  return `https://anilist.co/forum/thread/${thread.id}`
}

/**
 * Formate timeline date.
 *
 * @param timestamp - Valeur utilisée par le traitement « format timeline date ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatTimelineDate(timestamp?: number | null) {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Formate timeline gap.
 *
 * @param seconds - Valeur utilisée par le traitement « format timeline gap ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatTimelineGap(seconds: number) {
  const days = Math.max(1, Math.round(seconds / 86_400))
  if (days >= 60) return `- ${Math.round(days / 30)} mois -`
  if (days >= 14) return `- ${Math.round(days / 7)} semaines -`
  return `- ${days} jours -`
}

/**
 * Charge more social.
 *
 * @returns Aucune valeur.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function loadMoreSocial() {
  socialPageSize.value += 8
}

/**
 * Formate ranking label.
 *
 * @param type - Valeur utilisée par le traitement « format ranking label ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function formatRankingLabel(type?: string | null) {
  if (type === 'RATED') return 'Mieux note'
  if (type === 'POPULAR') return 'Plus populaire'
  return formatStatus(type)
}

const statusDistribution = computed(() => {
  const total = (media.value?.stats?.statusDistribution || []).reduce((sum, item) => sum + (item.amount || 0), 0) || 1
  const colors: Record<string, string> = {
    COMPLETED: '#4cca5a',
    PLANNING: '#02a9ff',
    CURRENT: '#9256f3',
    PAUSED: '#f779a4',
    DROPPED: '#e85d75'
  }

  // Trie du plus frequent au moins frequent pour que la barre commence par le statut dominant.
  return [...(media.value?.stats?.statusDistribution || [])]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .map((item) => ({
      key: item.status || 'UNKNOWN',
      label: formatStatus(item.status),
      value: item.amount || 0,
      width: `${((item.amount || 0) / total) * 100}%`,
      share: `${Math.round(((item.amount || 0) / total) * 100)}%`,
      color: colors[item.status || ''] || '#3db4f2'
    }))
})

const scoreDistribution = computed(() => {
  const buckets = [...(media.value?.stats?.scoreDistribution || [])].sort((a, b) => (a.score || 0) - (b.score || 0))
  const max = Math.max(...buckets.map((item) => item.amount || 0), 1)
  // Chaque barre est normalisee sur le bucket le plus rempli pour garder un graphe lisible.
  return buckets.map((item) => ({
    score: item.score || 0,
    amount: item.amount || 0,
    height: `${((item.amount || 0) / max) * 100}%`
  }))
})

const totalTrackedUsers = computed(() => statusDistribution.value.reduce((sum, item) => sum + item.value, 0))
const dominantStatus = computed(() => statusDistribution.value[0] || null)
const peakScoreBucket = computed(() => [...scoreDistribution.value].sort((a, b) => b.amount - a.amount)[0] || null)
const overviewStats = computed(() => [
  {
    label: 'Note moyenne',
    value: media.value?.averageScore ? `${media.value.averageScore}%` : '-',
    meta: 'Note de la communaute'
  },
  {
    label: 'Score moyen',
    value: media.value?.meanScore ? `${media.value.meanScore}%` : '-',
    meta: peakScoreBucket.value ? `Pic: ${peakScoreBucket.value.score}` : 'Tendance des notes'
  },
  {
    label: 'Popularité',
    value: media.value?.popularity ? formatCompactNumber(media.value.popularity) : '-',
    meta: media.value?.popularity ? formatNumber(media.value.popularity) : 'Pas de données'
  },
  {
    label: 'Favoris',
    value: media.value?.favourites ? formatCompactNumber(media.value.favourites) : '-',
    meta: media.value?.favourites ? `${formatNumber(media.value.favourites)} utilisateurs` : 'Pas de données'
  }
])
const statsSummaryCards = computed(() => [
  {
    label: 'Note moyenne',
    value: media.value?.averageScore ? `${media.value.averageScore}%` : '-',
    meta: 'Note de la communaute'
  },
  {
    label: 'Score moyen',
    value: media.value?.meanScore ? `${media.value.meanScore}%` : '-',
    meta: peakScoreBucket.value ? `Pic de note : ${peakScoreBucket.value.score}` : 'Pas de tendance de note'
  },
  {
    label: 'Popularité',
    value: media.value?.popularity ? formatNumber(media.value.popularity) : '-',
    meta: 'Popularité AniList'
  },
  {
    label: 'Favoris',
    value: media.value?.favourites ? formatNumber(media.value.favourites) : '-',
    meta: 'Utilisateurs qui l\'ont mis en favori'
  },
  {
    label: 'Épisodes',
    value: media.value?.episodes ? String(media.value.episodes) : '?',
    meta: media.value?.duration ? `${media.value.duration} min chacun` : 'Durée inconnue'
  },
  {
    label: 'Studio',
    value: animationStudio.value,
    meta: producers.value[0] ? `Producteur : ${producers.value[0]}` : 'Données de production'
  }
])
const infoFacts = computed(() => [
  { label: 'Format', value: formatStatus(media.value?.format) },
  { label: 'Statut', value: formatStatus(media.value?.status) },
  { label: 'Saison', value: formatSeason(media.value?.season, media.value?.seasonYear) },
  { label: 'Épisodes', value: media.value?.episodes ? String(media.value.episodes) : '?' },
  { label: 'Durée', value: media.value?.duration ? `${media.value.duration} min` : 'Inconnue' },
  { label: 'Source', value: formatStatus(media.value?.source) }
])
const scoreMarkers = computed(() => {
  if (!scoreDistribution.value.length) return []
  const step = Math.max(10, Math.ceil(scoreDistribution.value.length / 4))
  return scoreDistribution.value.filter((_, index) => index % step === 0 || index === scoreDistribution.value.length - 1)
})

const tabs = [
  { key: 'overview', label: 'Vue d\'ensemble' },
  { key: 'watch', label: 'Regarder' },
  { key: 'characters', label: 'Personnages' },
  { key: 'reviews', label: 'Critiques' },
  { key: 'stats', label: 'Statistiques' },
  { key: 'social', label: 'Social' }
] as const

const listOptions: Array<{ value: EditableAniListStatus; label: string }> = [
  { value: 'CURRENT', label: 'En cours' },
  { value: 'PLANNING', label: 'À voir' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'REPEATING', label: 'Revisionnage' },
  { value: 'PAUSED', label: 'En pause' },
  { value: 'DROPPED', label: 'Abandonné' }
]

const currentListStatus = ref<EditableAniListStatus | ''>('')
const currentListLabel = computed(() => {
  const status = currentListStatus.value || media.value?.mediaListEntry?.status
  if (!status) return 'Ajouter à la liste'
  return listOptions.find((option) => option.value === status)?.label || formatStatus(status)
})

const sharedListOptions = computed(() => {
  // On ne propose que les listes où l'utilisateur a une appartenance effective.
  return sharedLists.value.filter(list => list.isOwner || list.isMember)
})

/**
 * Bascule favorite.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif, effectue des appels réseau ou persistants.
 */
async function toggleFavorite() {
  if (!media.value?.id || !anilistToken.value || actionBusy.value) return

  actionBusy.value = 'favorite'
  const next = !media.value.isFavourite
  const prevCount = media.value.favourites || 0

  // Mise à jour optimiste: l'UI répond tout de suite, puis rollback en cas d'erreur AniList.
  media.value.isFavourite = next
  media.value.favourites = Math.max(0, prevCount + (next ? 1 : -1))

  try {
    const response = await anilistGraphql.request<any>(
      toggleFavouriteMutation,
      { animeId: media.value.id },
      { token: anilistToken.value, skipCache: true }
    )
    if (response?.errors?.length) throw new Error(response.errors[0]?.message || 'Impossible de mettre à jour le favori.')
  } catch {
    media.value.isFavourite = !next
    media.value.favourites = prevCount
  } finally {
    actionBusy.value = null
  }
}

/**
 * Enregistre list status.
 *
 * @param status - Valeur utilisée par le traitement « save list status ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
async function saveListStatus(status: EditableAniListStatus) {
  if (!media.value?.id || !anilistToken.value || actionBusy.value) return

  actionBusy.value = 'list'
  listMenuOpen.value = false
  // Conserve l'ancien statut pour revenir à l'état exact si la sauvegarde échoue.
  const previousStatus: EditableAniListStatus | '' = (currentListStatus.value || media.value.mediaListEntry?.status || '') as EditableAniListStatus | ''
  currentListStatus.value = status

  try {
    const savedEntry = await anilistSync.saveEntry({
      entryId: media.value.mediaListEntry?.id || undefined,
      mediaId: media.value.id,
      status
    })

    media.value.mediaListEntry = {
      id: Number(savedEntry.id),
      status: String(savedEntry.status || status)
    }
  } catch (error) {
    currentListStatus.value = previousStatus
  } finally {
    actionBusy.value = null
  }
}

/**
 * Garantit shared lists loaded.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const ensureSharedListsLoaded = async () => {
  if (isSharedListsLoading.value) return
  if (sharedLists.value.length > 0) return

  try {
    // Chargement paresseux: les listes partagees ne sont demandees que quand le picker s'ouvre.
    isSharedListsLoading.value = true
    sharedListError.value = ''
    sharedLists.value = await sharedListsStore.loadSummaries()
  } catch (error: any) {
    sharedLists.value = []
    sharedListError.value = error?.message || 'Impossible de charger vos listes partagées.'
  } finally {
    isSharedListsLoading.value = false
  }
}

/**
 * Bascule shared list picker.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const toggleSharedListPicker = async () => {
  if (showSharedListPicker.value) {
    showSharedListPicker.value = false
    return
  }

  await ensureSharedListsLoaded()
  showSharedListPicker.value = true
}

/**
 * Ajoute selected anime to shared list.
 *
 * @param listId - Valeur utilisée par le traitement « add selected anime to shared list ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const addSelectedAnimeToSharedList = async (listId: string) => {
  if (!media.value?.id || !listId || isAddingToSharedList.value) return

  // Si l'utilisateur n'a pas encore de statut AniList, on ajoute l'anime en planifié par défaut.
  const status = (currentListStatus.value || media.value.mediaListEntry?.status || 'PLANNING') as EditableAniListStatus

  try {
    isAddingToSharedList.value = true
    sharedListError.value = ''
    await sharedListsStore.addAnimeToList(listId, {
      mediaId: media.value.id,
      title: pageTitle.value,
      fetchLink: `/anime/${media.value.id}`,
      status,
      progress: 0,
      score: 0
    })
    showSharedListPicker.value = false
  } catch (error: any) {
    sharedListError.value = error?.message || "Impossible d'ajouter cet anime à la liste partagée."
  } finally {
    isAddingToSharedList.value = false
  }
}

/**
 * Calcule la valeur « provider name ».
 *
 * @param site - Valeur utilisée par le traitement « provider name ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function providerName(site?: string | null) {
  return site || 'Streaming'
}

/**
 * Calcule la valeur « provider name from url ».
 *
 * @param url - Valeur utilisée par le traitement « provider name from url ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function providerNameFromUrl(url?: string | null) {
  if (!url) return 'Regarder'
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    // Les liens AniList ne donnent pas toujours un "site" propre, donc on deduit le fournisseur par domaine.
    if (hostname.includes('crunchyroll')) return 'Crunchyroll'
    if (hostname.includes('netflix')) return 'Netflix'
    if (hostname.includes('hidive')) return 'HIDIVE'
    if (hostname.includes('youtube')) return 'YouTube'
    if (hostname.includes('hulu')) return 'Hulu'
    if (hostname.includes('primevideo') || hostname.includes('amazon')) return 'Prime Video'
    const primaryLabel = hostname.split('.')[0] || ''
    if (!primaryLabel) return 'Regarder'
    return primaryLabel.charAt(0).toUpperCase() + primaryLabel.slice(1)
  } catch {
    return 'Regarder'
  }
}

/**
 * Calcule la valeur « to ani list small cover ».
 *
 * @param url - Valeur utilisée par le traitement « to ani list small cover ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function toAniListSmallCover(url?: string | null) {
  if (!url) return ''
  return url.replace('/medium/', '/small/')
}

/**
 * Calcule la valeur « review text ».
 *
 * @param review - Valeur utilisée par le traitement « review text ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function reviewText(review: Review) {
  return (review.body || review.summary || '').trim()
}

/**
 * Calcule la valeur « review preview ».
 *
 * @param review - Valeur utilisée par le traitement « review preview ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function reviewPreview(review: Review) {
  const text = reviewText(review)
  if (text.length <= 280) return text
  // Coupe les longues critiques uniquement pour la carte; le texte complet reste disponible au clic.
  return `${text.slice(0, 280).trim()}...`
}

/**
 * Synchronise recommendation viewport width.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif, interagit avec le navigateur ou le DOM.
 */
function syncRecommendationViewportWidth() {
  recommendationViewportWidth.value = window.innerWidth
}

/**
 * Indique si review expanded.
 *
 * @param reviewId - Valeur utilisée par le traitement « is review expanded ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function isReviewExpanded(reviewId: number) {
  return Boolean(expandedReviews.value[reviewId])
}

/**
 * Bascule review expanded.
 *
 * @param reviewId - Valeur utilisée par le traitement « toggle review expanded ».
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
function toggleReviewExpanded(reviewId: number) {
  expandedReviews.value = {
    ...expandedReviews.value,
    [reviewId]: !expandedReviews.value[reviewId]
  }
}

/**
 * Indique si review overflow.
 *
 * @param review - Valeur utilisée par le traitement « has review overflow ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function hasReviewOverflow(review: Review) {
  return reviewText(review).length > 280
}

/**
 * Traite document click.
 *
 * @param event - Valeur utilisée par le traitement « handle document click ».
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null
  // Un seul listener document ferme les deux menus contextuels quand le clic sort de leur zone.
  if (listMenuOpen.value && listActionRef.value && target && !listActionRef.value.contains(target)) {
    listMenuOpen.value = false
  }
  if (showSharedListPicker.value && sharedListActionRef.value && target && !sharedListActionRef.value.contains(target)) {
    showSharedListPicker.value = false
  }
}

/**
 * Charge more reviews.
 *
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function loadMoreReviews() {
  if (!hasMoreReviews.value || reviewsState.pending.value) return
  reviewPage.value += 1
}

watch(animeId, () => {
  // Changement de route dynamique: remet les etats locaux pour ne pas melanger deux fiches anime.
  reviewPage.value = 1
  expandedReviews.value = {}
  currentListStatus.value = ''
  showSharedListPicker.value = false
  sharedListError.value = ''
})

onMounted(() => {
  // Les recommandations dependent de la largeur reelle du viewport, indisponible pendant le rendu serveur.
  syncRecommendationViewportWidth()
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('resize', syncRecommendationViewportWidth)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', syncRecommendationViewportWidth)
})

useHead(() => ({ title: `${pageTitle.value} - Kizuna` }))
</script>

<template>
  <div class="anime-page">
    <div v-if="loading" class="state-panel">Chargement de l'anime...</div>
    <div v-else-if="hasError || !media" class="state-panel error">Impossible de charger cette fiche anime.</div>
    <div v-else>
      <div
        class="banner"
        :class="{ 'banner-empty': !bannerImage }"
        :style="bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined"
      />

      <div class="container">
        <div class="two-col-layout">
          <aside class="sidebar-left">
            <div class="cover">
              <img :src="coverImage" :alt="pageTitle">
            </div>

            <div v-if="rankings.length" class="sidebar-section">
              <div class="sidebar-title">Classements</div>
              <div v-for="item in rankings" :key="`${item.type}-${item.rank}`" class="rank-item">
                <span class="rank-icon">{{ item.type === 'RATED' ? '★' : '♥' }}</span>
                <span class="rank-label">{{ formatRankingLabel(item.type) }}</span>
                <span>#{{ item.rank }}</span>
              </div>
            </div>

            <div class="sidebar-section">
              <div class="sidebar-title">Données</div>
              <div class="data-row"><span class="data-label">Format</span><span class="data-value">{{ formatStatus(media.format) }}</span></div>
              <div class="data-row"><span class="data-label">Épisodes</span><span class="data-value">{{ media.episodes || '?' }}</span></div>
              <div class="data-row"><span class="data-label">Durée d'épisode</span><span class="data-value">{{ media.duration ? `${media.duration} min` : 'Inconnue' }}</span></div>
              <div class="data-row"><span class="data-label">Statut</span><span class="data-value">{{ formatStatus(media.status) }}</span></div>
              <div class="data-row"><span class="data-label">Date de début</span><span class="data-value">{{ formatDate(media.startDate) }}</span></div>
              <div class="data-row"><span class="data-label">Date de fin</span><span class="data-value">{{ formatDate(media.endDate) }}</span></div>
              <div class="data-row"><span class="data-label">Saison</span><span class="data-value">{{ formatSeason(media.season, media.seasonYear) }}</span></div>
              <div class="data-row"><span class="data-label">Note moyenne</span><span class="data-value">{{ media.averageScore ? `${media.averageScore}%` : '-' }}</span></div>
              <div class="data-row"><span class="data-label">Score moyen</span><span class="data-value">{{ media.meanScore ? `${media.meanScore}%` : '-' }}</span></div>
              <div class="data-row"><span class="data-label">Popularité</span><span class="data-value">{{ formatNumber(media.popularity) }}</span></div>
              <div class="data-row"><span class="data-label">Favoris</span><span class="data-value">{{ formatNumber(media.favourites) }}</span></div>
              <div class="data-row"><span class="data-label">Studio</span><span class="data-value">{{ animationStudio }}</span></div>
              <div v-if="producers.length" class="data-row"><span class="data-label">Producteurs</span><span class="data-value stacked"><span v-for="producer in producers" :key="producer">{{ producer }}</span></span></div>
              <div class="data-row"><span class="data-label">Source</span><span class="data-value">{{ formatStatus(media.source) }}</span></div>
              <div v-if="media.hashtag" class="data-row"><span class="data-label">Hashtag</span><span class="data-value accent">{{ media.hashtag }}</span></div>
            </div>

            <div v-if="tags.length" class="sidebar-section">
              <div class="sidebar-title">Tags</div>
              <div class="tag-list">
                <div v-for="tag in tags" :key="tag.name" class="tag-item">
                  <span class="tag-name">{{ tag.name }}</span>
                  <span class="tag-percent">{{ tag.rank || 0 }}%</span>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div class="media-content">
              <div class="media-kicker">Fiche anime</div>
              <div class="media-meta-strip">
                <span class="media-meta-pill">{{ formatStatus(media.format) }}</span>
                <span class="media-meta-pill">{{ formatSeason(media.season, media.seasonYear) }}</span>
                <span class="media-meta-pill">{{ media.averageScore ? `${media.averageScore}% de note` : 'Pas de note pour le moment' }}</span>
                <span class="media-meta-pill">{{ media.episodes ? `${media.episodes} eps` : 'Épisodes à venir' }}</span>
              </div>
              <h1 class="media-title">{{ pageTitle }}</h1>
              <div v-if="genres.length" class="media-genre-row">
                <span v-for="genre in genres" :key="`${genre}-hero`" class="media-genre-chip">{{ genre }}</span>
              </div>
              <p class="media-description">{{ description }}</p>

              <div class="actions">
                <div ref="listActionRef" class="list-action">
                  <button class="btn btn-primary list-button" type="button" :disabled="actionBusy === 'list' || !anilistToken" @click="listMenuOpen = !listMenuOpen">
                    <span>{{ currentListLabel }}</span>
                    <span class="button-arrow">&#9662;</span>
                  </button>

                  <div v-if="listMenuOpen" class="list-menu">
                    <button
                      v-for="option in listOptions"
                      :key="option.value"
                      type="button"
                      class="list-option"
                      :class="{ active: media.mediaListEntry?.status === option.value }"
                      @click="saveListStatus(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div ref="sharedListActionRef" class="list-action">
                  <button class="btn btn-primary list-button" type="button" :disabled="!anilistToken || isSharedListsLoading || isAddingToSharedList" @click="toggleSharedListPicker">
                    <span>{{ showSharedListPicker ? 'Fermer les listes partagées' : 'Ajouter à une liste partagée' }}</span>
                    <span class="button-arrow">&#9662;</span>
                  </button>
                </div>

                <button class="favorite-button" type="button" :disabled="actionBusy === 'favorite' || !anilistToken" @click="toggleFavorite">
                  <span v-if="media.isFavourite">&#9829;</span>
                  <span v-else>&#9825;</span>
                </button>
              </div>

              <div v-if="showSharedListPicker" class="anime-editor-list-picker">
                <div v-if="isSharedListsLoading" class="anime-editor-list-picker-state">
                  Chargement des listes partagées...
                </div>
                <div v-else-if="sharedListOptions.length === 0" class="anime-editor-list-picker-state">
                  Aucune liste partagée disponible.
                </div>
                <div v-else class="anime-editor-list-grid">
                  <button
                    v-for="list in sharedListOptions"
                    :key="list.id"
                    class="anime-editor-list-option"
                    type="button"
                    :disabled="isAddingToSharedList"
                    @click="addSelectedAnimeToSharedList(list.id)"
                  >
                    <span class="anime-editor-list-option-title">{{ list.title }}</span>
                    <span class="anime-editor-list-option-meta">{{ list.memberCount }} membres · {{ list.animeCount }} anime</span>
                  </button>
                </div>
              </div>

              <div v-if="sharedListError" class="anime-editor-inline-error">
                {{ sharedListError }}
              </div>
            </div>

            <div class="tabs">
              <div class="tabs-nav">
                <button
                  v-for="tab in tabs"
                  :key="tab.key"
                  type="button"
                  class="tab"
                  :class="{ active: selectedTab === tab.key }"
                  @click="selectedTab = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <template v-if="selectedTab === 'overview'">
              <section v-if="relations.length">
                <h2 class="section-title">Relations</h2>
                <div class="relations-strip">
                  <NuxtLink
                    v-for="relation in relations"
                    :key="`${relation.relationType}-${relation.node?.id}`"
                    class="relation-card relation-card-compact"
                    :to="`/${(relation.node?.type || 'ANIME').toLowerCase()}/${relation.node?.id}`"
                  >
                    <img :src="relation.node?.coverImage?.medium || relation.node?.coverImage?.large || ''" :alt="relation.node?.title?.english || relation.node?.title?.romaji || ''">
                    <div class="relation-copy">
                      <div class="relation-name">{{ relation.node?.title?.english || relation.node?.title?.romaji || relation.node?.title?.native }}</div>
                      <div class="relation-type-inline">{{ formatStatus(relation.relationType) }}</div>
                    </div>
                  </NuxtLink>
                </div>
              </section>

              <div class="overview-stats-grid">
                <article v-for="item in overviewStats" :key="item.label" class="overview-stat-card">
                  <div class="overview-stat-label">{{ item.label }}</div>
                  <div class="overview-stat-value">{{ item.value }}</div>
                  <div class="overview-stat-meta">{{ item.meta }}</div>
                </article>
              </div>

              <section v-if="overviewCharacters.length">
                <h2 class="section-title">Personnages</h2>
                <div class="characters-grid">
                  <article v-for="character in overviewCharacters" :key="character.node?.id" class="character-row" :class="{ 'has-voice': !!character.voiceActors?.[0] }">
                    <div class="character-left">
                      <img :src="character.node?.image?.large || ''" :alt="character.node?.name?.full || ''" class="character-img">
                      <div class="character-info">
                        <div class="character-name">{{ character.node?.name?.full }}</div>
                        <div class="character-role">{{ formatStatus(character.role) }}</div>
                      </div>
                    </div>

                    <div v-if="character.voiceActors?.[0]" class="character-left voice-side">
                      <div class="character-info text-right">
                        <div class="character-name">{{ character.voiceActors[0].name?.full }}</div>
                        <div class="character-role">{{ character.voiceActors[0].languageV2 || 'Japonais' }}</div>
                      </div>
                      <img :src="character.voiceActors[0].image?.large || ''" :alt="character.voiceActors[0].name?.full || ''" class="character-img">
                    </div>
                  </article>
                </div>
              </section>

              <section v-if="watchEpisodes.length" class="watch-section">
                <h2 class="section-title">Regarder</h2>
                <div class="watch-provider-grid">
                  <a
                    v-for="episode in watchEpisodes"
                    :key="`${episode.url}-${episode.title}`"
                    class="watch-provider-card"
                    :href="episode.url || '#'"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img :src="episode.thumbnail || ''" :alt="episode.title || pageTitle" class="watch-provider-image">
                    <div class="watch-provider-copy">
                      <div class="watch-provider-name">{{ episode.title || 'Épisode' }}</div>
                      <div class="watch-provider-label">{{ providerNameFromUrl(episode.url) }}</div>
                    </div>
                  </a>
                </div>
              </section>

              <section v-if="media.trailer?.thumbnail">
                <h2 class="section-title">Bande-annonce</h2>
                <a
                  class="trailer-container"
                  :href="media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : '#'"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img :src="media.trailer.thumbnail" :alt="`${pageTitle} trailer`">
                  <div class="play-btn">Lire</div>
                </a>
              </section>

              <section v-if="followingActivities.length">
                <h2 class="section-title">Suivis</h2>
                <div class="following-grid">
                  <article v-for="activity in followingActivities.slice(0, 6)" :key="activity.id" class="following-item">
                    <div class="following-user">
                      <img :src="activity.user?.avatar?.medium || coverImage" :alt="activity.user?.name || 'Utilisateur'" class="following-avatar">
                      <div>
                        <div class="following-name">{{ activity.user?.name }}</div>
                        <div class="following-status">{{ formatProgress(activity) }}</div>
                      </div>
                    </div>
                    <div class="following-score">{{ relativeTime(activity.createdAt) }}</div>
                  </article>
                </div>
                </section>

                <section v-if="recommendations.length">
                  <div class="section-head">
                    <h2 class="section-title">Recommandations</h2>
                    <button
                      v-if="hasHiddenRecommendations"
                      type="button"
                      class="section-link-button"
                      @click="showAllRecommendations = !showAllRecommendations"
                    >
                      {{ showAllRecommendations ? 'Voir moins' : 'Voir toutes les recommandations' }}
                    </button>
                  </div>
                  <div class="recommendations-grid">
                    <BrowseAnimeCard
                      v-for="item in recommendations"
                    :key="item.mediaRecommendation?.id"
                    :anime="{
                      id: item.mediaRecommendation?.id,
                      title: item.mediaRecommendation?.title,
                      coverImage: item.mediaRecommendation?.coverImage,
                      averageScore: item.mediaRecommendation?.averageScore ?? item.rating ?? null,
                      format: item.mediaRecommendation?.format ?? null,
                      episodes: item.mediaRecommendation?.episodes ?? null,
                      seasonYear: item.mediaRecommendation?.seasonYear ?? null,
                      genres: item.mediaRecommendation?.genres ?? []
                    }"
                    :to="`/anime/${item.mediaRecommendation?.id}`"
                  />
                </div>
              </section>

              <section v-if="overviewReviews.length">
                <h2 class="section-title">Critiques</h2>
                <article v-for="review in overviewReviews" :key="review.id" class="review-item">
                  <div class="review-header">
                    <img :src="review.user?.avatar?.large || coverImage" :alt="review.user?.name || 'Utilisateur'" class="review-avatar">
                    <div>
                      <div class="following-name">{{ review.user?.name }}</div>
                      <div class="following-status">Note : {{ review.score || '-' }}/100</div>
                    </div>
                  </div>
                  <div class="review-text">{{ isReviewExpanded(review.id) ? reviewText(review) : reviewPreview(review) }}</div>
                  <button
                    v-if="hasReviewOverflow(review)"
                    type="button"
                    class="review-expand"
                    @click="toggleReviewExpanded(review.id)"
                  >
                    {{ isReviewExpanded(review.id) ? 'Voir moins' : 'Voir plus' }}
                  </button>
                  <div class="review-likes">Evaluation : {{ review.rating || 0 }}</div>
                </article>
              </section>
            </template>

            <template v-else-if="selectedTab === 'watch'">
              <section class="watch-section">
                <h2 class="section-title">Regarder</h2>
                <div v-if="watchEpisodes.length" class="watch-provider-grid">
                  <a
                    v-for="episode in watchEpisodes"
                    :key="`${episode.url}-${episode.title}-watch`"
                    class="watch-provider-card"
                    :href="episode.url || '#'"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img :src="episode.thumbnail || ''" :alt="episode.title || pageTitle" class="watch-provider-image">
                    <div class="watch-provider-copy">
                      <div class="watch-provider-name">{{ episode.title || 'Épisode' }}</div>
                      <div class="watch-provider-label">{{ providerNameFromUrl(episode.url) }}</div>
                    </div>
                  </a>
                </div>
                <div v-else class="social-empty compact">Aucun aperçu d'épisode avec miniature n'a été trouvé sur AniList pour ce titre.</div>
              </section>
            </template>

            <template v-else-if="selectedTab === 'characters'">
              <section>
                <h2 class="section-title">Personnages</h2>
                <div class="characters-grid">
                  <article v-for="character in characters" :key="`${character.node?.id}-characters`" class="character-row" :class="{ 'has-voice': !!character.voiceActors?.[0] }">
                    <div class="character-left">
                      <img :src="character.node?.image?.large || ''" :alt="character.node?.name?.full || ''" class="character-img">
                      <div class="character-info">
                        <div class="character-name">{{ character.node?.name?.full }}</div>
                        <div class="character-role">{{ formatStatus(character.role) }}</div>
                      </div>
                    </div>

                    <div v-if="character.voiceActors?.[0]" class="character-left voice-side">
                      <div class="character-info text-right">
                        <div class="character-name">{{ character.voiceActors[0].name?.full }}</div>
                        <div class="character-role">{{ character.voiceActors[0].languageV2 || 'Japonais' }}</div>
                      </div>
                      <img :src="character.voiceActors[0].image?.large || ''" :alt="character.voiceActors[0].name?.full || ''" class="character-img">
                    </div>
                  </article>
                </div>
              </section>
            </template>

            <template v-else-if="selectedTab === 'reviews'">
              <section>
                <h2 class="section-title">Critiques</h2>
                <article v-for="review in reviews" :key="`${review.id}-reviewtab`" class="review-item">
                  <div class="review-header">
                    <img :src="review.user?.avatar?.large || coverImage" :alt="review.user?.name || 'Utilisateur'" class="review-avatar">
                    <div>
                      <div class="following-name">{{ review.user?.name }}</div>
                      <div class="following-status">Note : {{ review.score || '-' }}/100</div>
                    </div>
                  </div>
                  <div class="review-text">{{ isReviewExpanded(review.id) ? reviewText(review) : reviewPreview(review) }}</div>
                  <button
                    v-if="hasReviewOverflow(review)"
                    type="button"
                    class="review-expand"
                    @click="toggleReviewExpanded(review.id)"
                  >
                    {{ isReviewExpanded(review.id) ? 'Voir moins' : 'Voir plus' }}
                  </button>
                </article>
                <div v-if="reviewsState.pending" class="social-empty compact">Chargement de critiques supplementaires...</div>
                <button
                  v-else-if="hasMoreReviews"
                  type="button"
                  class="review-load-more"
                  :disabled="reviewsState.pending"
                  @click="loadMoreReviews"
                >
                  Charger plus
                </button>
              </section>
            </template>

            <template v-else-if="selectedTab === 'stats'">
              <div class="stats-page">
                <div class="stats-summary-grid">
                  <article v-for="item in statsSummaryCards" :key="item.label" class="overview-stat-card detailed">
                    <div class="overview-stat-label">{{ item.label }}</div>
                    <div class="overview-stat-value">{{ item.value }}</div>
                    <div class="overview-stat-meta">{{ item.meta }}</div>
                  </article>
                </div>

                <div class="stats-section">
                  <div class="stat-card">
                    <div class="profile-like-head">
                      <div class="stat-title">Repartition des statuts</div>
                      <div class="profile-like-meta">{{ formatNumber(totalTrackedUsers) }} suivis</div>
                    </div>
                    <div class="status-progress profile-progress">
                      <div v-for="item in statusDistribution" :key="`${item.key}-statsbar`" class="progress-segment" :style="{ width: item.width, background: item.color }" />
                    </div>
                    <div class="status-list">
                      <div v-for="item in statusDistribution" :key="`${item.key}-stats`" class="status-row">
                        <div class="status-row-label">
                          <span class="status-dot" :style="{ background: item.color }" />
                          <span>{{ item.label }}</span>
                        </div>
                        <div class="status-row-value">
                          <strong>{{ formatNumber(item.value) }}</strong>
                          <span>{{ item.share }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="profile-like-head">
                      <div class="stat-title">Repartition des notes</div>
                      <div class="profile-like-meta">
                        {{ media.meanScore ? `${media.meanScore}% de moyenne` : 'Pas de score moyen' }}
                      </div>
                    </div>
                    <div class="score-bars compact">
                    <div v-for="item in scoreDistribution" :key="`${item.score}-stats`" class="score-column">
                      <div class="score-bar-wrap">
                        <div class="score-bar" :style="{ height: item.height }" />
                      </div>
                      <span class="score-label">{{ item.score }}</span>
                    </div>
                  </div>
                  <div class="score-marker-row">
                    <span v-for="marker in scoreMarkers" :key="`score-marker-${marker.score}`">{{ marker.score }}</span>
                  </div>
                </div>
                </div>

                <div class="stats-info-grid">
                  <section class="info-card">
                    <h3 class="info-card-title">Détails du média</h3>
                    <div class="info-card-list">
                      <div v-for="item in infoFacts" :key="item.label" class="info-card-row">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                      </div>
                    </div>
                  </section>

                  <section class="info-card">
                    <h3 class="info-card-title">Production</h3>
                    <div class="info-card-list">
                      <div class="info-card-row">
                        <span>Studio principal</span>
                        <strong>{{ animationStudio }}</strong>
                      </div>
                      <div class="info-card-row">
                        <span>Producteurs</span>
                        <strong>{{ producers.length ? producers.join(', ') : 'Inconnu' }}</strong>
                      </div>
                      <div v-if="media.hashtag" class="info-card-row">
                        <span>Hashtag</span>
                        <strong>{{ media.hashtag }}</strong>
                      </div>
                    </div>
                  </section>

                  <section v-if="rankings.length" class="info-card">
                    <h3 class="info-card-title">Temps forts de la communaute</h3>
                    <div class="info-card-list">
                      <div v-for="item in rankings" :key="`${item.type}-${item.rank}-detail`" class="info-card-row">
                        <span>{{ formatRankingLabel(item.type) }}</span>
                        <strong>#{{ item.rank }}</strong>
                      </div>
                    </div>
                  </section>

                  <section v-if="genres.length || tags.length" class="info-card">
                    <h3 class="info-card-title">Genres et tags</h3>
                    <div v-if="genres.length" class="chip-list">
                      <span v-for="genre in genres" :key="genre" class="genre-chip">{{ genre }}</span>
                    </div>
                    <div v-if="tags.length" class="tag-metric-list">
                      <div v-for="tag in tags.slice(0, 6)" :key="tag.name" class="tag-metric-row">
                        <span class="tag-metric-name">{{ tag.name }}</span>
                        <strong>{{ tag.rank || 0 }}%</strong>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </template>

            <template v-else>
              <section class="social-layout tab-panel">
                <div class="social-main">
                  <article class="social-panel">
                    <div class="social-panel-head">
                      <div>
                        <h2 class="social-heading">Activite récente</h2>
                        <p class="social-subheading">Activite récente des listes anime autour de ce titre.</p>
                      </div>

                      <div class="social-controls">
                        <div class="feed-type-toggle">
                          <button
                            v-for="option in socialFeedOptions"
                            :key="option.key"
                            type="button"
                            class="feed-type-btn"
                            :class="{ active: socialFeedType === option.key }"
                            :disabled="option.disabled"
                            @click="socialFeedType = option.key"
                          >
                            {{ option.label }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p v-if="!canUsePersonalFeeds" class="social-note">
                      Liez votre compte AniList pour debloquer les flux Moi et Suivis.
                    </p>

                    <div v-if="socialLoading" class="social-empty">Chargement de l'activité...</div>

                    <div v-else-if="activeSocialActivities.length" class="activity-feed-list">
                      <article v-for="activity in activeSocialActivities" :key="`${activity.id}-feed`" class="activity-entry-card">
                        <div class="activity-entry-wrap">
                          <NuxtLink
                            class="activity-cover"
                            :to="`/anime/${activity.media?.id || animeId}`"
                            :style="{ backgroundImage: `url(${activity.media?.coverImage?.large || activity.media?.coverImage?.medium || coverImage})` }"
                          />

                          <div class="activity-details">
                            <a
                              class="activity-user-link"
                              :href="activityUserUrl(activity)"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {{ activity.user?.name || 'Utilisateur AniList' }}
                            </a>

                            <div class="activity-status-line">
                              {{ activitySummary(activity) }}
                              <NuxtLink class="activity-title-link" :to="`/anime/${activity.media?.id || animeId}`">
                                {{ activityMediaTitle(activity) }}
                              </NuxtLink>
                            </div>

                            <div class="activity-meta-row">
                              <span class="activity-meta-pill">{{ relativeTime(activity.createdAt) }}</span>
                              <a
                                class="activity-meta-link"
                                :href="activityExternalUrl(activity)"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Lien direct
                              </a>
                            </div>
                          </div>

                          <a
                            class="activity-avatar"
                            :href="activityUserUrl(activity)"
                            target="_blank"
                            rel="noreferrer"
                            :style="{ backgroundImage: `url(${activity.user?.avatar?.medium || coverImage})` }"
                          />
                        </div>

                        <div class="activity-actions">
                          <span class="activity-action">Reponses {{ activity.replyCount || 0 }}</span>
                          <span class="activity-action">J'aime {{ activity.likeCount || 0 }}</span>
                          <span v-if="activity.isSubscribed" class="activity-action accent">Abonné</span>
                        </div>
                      </article>
                    </div>

                    <div v-else class="social-empty">
                      Aucune activité pour ce flux pour le moment.
                    </div>

                    <button
                      v-if="canLoadMoreSocial"
                      type="button"
                      class="load-more-btn"
                      :disabled="socialPending"
                      @click="loadMoreSocial"
                    >
                      Charger plus
                    </button>
                  </article>
                </div>

                <aside class="social-sidebar">
                  <article class="social-panel">
                    <div class="social-side-head">
                      <div>
                        <h2 class="social-side-title">Suivis</h2>
                        <p class="social-side-subtitle">Les personnes que vous suivez et qui ont interagi avec cet anime.</p>
                      </div>
                      <span class="social-side-count">Utilisateurs : {{ followingUserCount }}</span>
                    </div>

                    <p v-if="!canUsePersonalFeeds" class="social-note">
                      Connectez AniList pour voir ici les personnes que vous suivez.
                    </p>

                    <div v-else-if="followingStatusCounts.length" class="social-status-chips">
                      <span v-for="item in followingStatusCounts" :key="item.label" class="social-status-chip">
                        {{ item.label }}: {{ item.count }}
                      </span>
                    </div>

                    <div v-if="canUsePersonalFeeds && followingLatestByUser.length" class="following-summary-grid">
                      <article v-for="activity in followingLatestByUser" :key="`${activity.id}-following`" class="social-following-row">
                        <a
                          class="social-following-avatar"
                          :href="activityUserUrl(activity)"
                          target="_blank"
                          rel="noreferrer"
                          :style="{ backgroundImage: `url(${activity.user?.avatar?.medium || coverImage})` }"
                        />
                        <div class="social-following-meta">
                          <a
                            class="following-name"
                            :href="activityUserUrl(activity)"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {{ activity.user?.name || 'Utilisateur AniList' }}
                          </a>
                          <div class="social-following-progress">{{ formatProgress(activity) }}</div>
                        </div>
                        <div class="social-following-time">{{ relativeTime(activity.createdAt) }}</div>
                      </article>
                    </div>

                    <div v-else-if="canUsePersonalFeeds" class="social-empty compact">
                      Aucun utilisateur suivi trouvé pour cet anime pour le moment.
                    </div>

                    <div v-if="canUsePersonalFeeds && followingTimelineItems.length" class="timeline-block">
                      <h3 class="mini-title">Chronologie de l'activité</h3>
                      <div class="timeline-list">
                        <template v-for="(item, index) in followingTimelineItems" :key="`timeline-${index}`">
                          <div v-if="item.type === 'gap'" class="timeline-gap">{{ item.label }}</div>
                          <div v-else class="timeline-entry">
                            <a
                              :href="activityExternalUrl(item.activity)"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {{ activitySummary(item.activity) }}
                            </a>
                            <span>{{ formatTimelineDate(item.activity.createdAt) }}</span>
                          </div>
                        </template>
                      </div>
                    </div>
                  </article>

                  <article class="social-panel">
                    <div class="social-side-head threads-head">
                      <div>
                        <h2 class="social-side-title">
                          Discussions
                        </h2>
                        <p class="social-side-subtitle">Discussions récentes des forums AniList.</p>
                      </div>
                      <a class="create-thread-link" :href="createThreadUrl" target="_blank" rel="noreferrer">
                        Créer une discussion
                      </a>
                    </div>

                    <div v-if="socialThreads.length" class="threads-list">
                      <article v-for="thread in socialThreads" :key="thread.id" class="social-thread-card">
                        <a class="thread-title" :href="threadExternalUrl(thread)" target="_blank" rel="noreferrer">
                          {{ thread.title }}
                        </a>

                        <div class="thread-footer">
                          <div class="thread-author">
                            <span
                              class="thread-avatar"
                              :style="{ backgroundImage: `url(${thread.user?.avatar?.medium || coverImage})` }"
                            />
                            <span>{{ thread.user?.name || 'Utilisateur AniList' }}</span>
                          </div>
                          <div class="thread-metrics">
                            <span>{{ formatCompactNumber(thread.viewCount || 0) }} vues</span>
                            <span>{{ thread.replyCount || 0 }} réponses</span>
                          </div>
                        </div>

                        <div class="thread-meta">
                          <span v-for="category in thread.categories || []" :key="`${thread.id}-${category.id}`" class="thread-category">
                            {{ category.name }}
                          </span>
                          <span>{{ relativeTime(thread.repliedAt) }}</span>
                        </div>
                      </article>
                    </div>

                    <div v-else class="social-empty compact">
                      Aucune discussion trouvée pour cet anime.
                    </div>
                  </article>
                </aside>
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="~/assets/css/pages/animeDetails.css"></style>

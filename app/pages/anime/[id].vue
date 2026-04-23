<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSync, type EditableAniListStatus } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import BrowseAnimeCard from '~/components/BrowseAnimeCard.vue'

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

const route = useRoute()
const animeId = computed(() => Number(route.params.id))
const selectedTab = ref<'overview' | 'watch' | 'characters' | 'reviews' | 'stats' | 'social'>('overview')
const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const anilistSync = useAnilistSync()
const actionBusy = ref<'favorite' | 'list' | null>(null)
const listMenuOpen = ref(false)
const listActionRef = ref<HTMLElement | null>(null)
const anilistToken = computed(() => String(((pocketbaseStore.authRecord as any) || {})?.anilist_token ?? ''))
const anilistUserId = computed(() => Number(((pocketbaseStore.authRecord as any) || {})?.anilist_user_id ?? 0))
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
const description = computed(() =>
  (media.value?.description || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
)
const rankings = computed(() => (media.value?.rankings || []).filter((item) => item.rank && item.allTime).slice(0, 2))
const studios = computed(() => (media.value?.studios?.nodes || []).filter(Boolean))
const animationStudio = computed(() => studios.value.find((item) => item?.isAnimationStudio)?.name || studios.value[0]?.name || 'Unknown')
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
  if (socialFeedType.value === 'SELF') return selfActivities.value
  if (socialFeedType.value === 'FOLLOWING') return followingActivities.value
  return globalActivities.value
})
const canLoadMoreSocial = computed(() => activeSocialActivities.value.length >= socialPageSize.value && activeSocialActivities.value.length > 0)
const socialFeedOptions = computed(() => [
  { key: 'SELF' as const, label: 'Self', disabled: !canUsePersonalFeeds.value },
  { key: 'FOLLOWING' as const, label: 'Following', disabled: !canUsePersonalFeeds.value },
  { key: 'GLOBAL' as const, label: 'Global', disabled: false }
])
const followingLatestByUser = computed(() => {
  const seen = new Set<string>()
  return followingActivities.value.filter((activity) => {
    const name = activity.user?.name || ''
    if (!name || seen.has(name)) return false
    seen.add(name)
    return true
  })
})
const followingUserCount = computed(() => followingLatestByUser.value.length)
const followingStatusCounts = computed(() => {
  const counts = new Map<string, number>()

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
const mediaSocialUrl = computed(() => `https://anilist.co/anime/${animeId.value}/social`)

watch(canUsePersonalFeeds, (available) => {
  if (!available) {
    socialFeedType.value = 'GLOBAL'
    return
  }

  if (socialFeedType.value === 'GLOBAL') {
    socialFeedType.value = 'SELF'
  }
}, { immediate: true })

function formatStatus(value?: string | null) {
  return value
    ? value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    : 'Unknown'
}

function formatDate(date?: FuzzyDate | null) {
  if (!date?.year) return 'TBA'
  return new Date(date.year, (date.month || 1) - 1, date.day || 1).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatSeason(season?: string | null, year?: number | null) {
  return season && year ? `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}` : 'Unknown'
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value || 0)
}

function relativeTime(timestamp?: number | null) {
  if (!timestamp) return ''
  const delta = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  if (delta > 86_400) return `${Math.floor(delta / 86_400)}d ago`
  if (delta > 3_600) return `${Math.floor(delta / 3_600)}h ago`
  if (delta > 60) return `${Math.floor(delta / 60)}m ago`
  return 'just now'
}

function formatProgress(activity: Activity) {
  return [formatStatus(activity.status), activity.progress].filter(Boolean).join(' ')
}

function activityMediaTitle(activity: Activity) {
  return activity.media?.title?.english || activity.media?.title?.romaji || activity.media?.title?.native || pageTitle.value
}

function activitySummary(activity: Activity) {
  const status = activity.status
    ? `${activity.status.charAt(0).toUpperCase()}${activity.status.slice(1)}`
    : 'Updated'
  return activity.progress ? `${status} ${activity.progress} of` : status
}

function activityUserUrl(activity: Activity) {
  const name = activity.user?.name
  return name ? `https://anilist.co/user/${encodeURIComponent(name)}` : 'https://anilist.co'
}

function activityExternalUrl(activity: Activity) {
  return `https://anilist.co/activity/${activity.id}`
}

function threadExternalUrl(thread: SocialThread) {
  return `https://anilist.co/forum/thread/${thread.id}`
}

function formatTimelineDate(timestamp?: number | null) {
  if (!timestamp) return ''
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTimelineGap(seconds: number) {
  const days = Math.max(1, Math.round(seconds / 86_400))
  if (days >= 60) return `- ${Math.round(days / 30)} months -`
  if (days >= 14) return `- ${Math.round(days / 7)} weeks -`
  return `- ${days} days -`
}

function loadMoreSocial() {
  socialPageSize.value += 8
}

function formatRankingLabel(type?: string | null) {
  if (type === 'RATED') return 'Highest Rated'
  if (type === 'POPULAR') return 'Most Popular'
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
    label: 'Average Score',
    value: media.value?.averageScore ? `${media.value.averageScore}%` : '-',
    meta: 'Community rating'
  },
  {
    label: 'Mean Score',
    value: media.value?.meanScore ? `${media.value.meanScore}%` : '-',
    meta: peakScoreBucket.value ? `Peak bucket: ${peakScoreBucket.value.score}` : 'Score trend'
  },
  {
    label: 'Popularity',
    value: media.value?.popularity ? formatCompactNumber(media.value.popularity) : '-',
    meta: media.value?.popularity ? formatNumber(media.value.popularity) : 'No data'
  },
  {
    label: 'Favorites',
    value: media.value?.favourites ? formatCompactNumber(media.value.favourites) : '-',
    meta: media.value?.favourites ? `${formatNumber(media.value.favourites)} users` : 'No data'
  }
])
const statsSummaryCards = computed(() => [
  {
    label: 'Average Score',
    value: media.value?.averageScore ? `${media.value.averageScore}%` : '-',
    meta: 'Community rating'
  },
  {
    label: 'Mean Score',
    value: media.value?.meanScore ? `${media.value.meanScore}%` : '-',
    meta: peakScoreBucket.value ? `Peak score: ${peakScoreBucket.value.score}` : 'No score trend'
  },
  {
    label: 'Popularity',
    value: media.value?.popularity ? formatNumber(media.value.popularity) : '-',
    meta: 'AniList popularity'
  },
  {
    label: 'Favorites',
    value: media.value?.favourites ? formatNumber(media.value.favourites) : '-',
    meta: 'Users who favorited it'
  },
  {
    label: 'Episodes',
    value: media.value?.episodes ? String(media.value.episodes) : '?',
    meta: media.value?.duration ? `${media.value.duration} mins each` : 'Duration unknown'
  },
  {
    label: 'Studio',
    value: animationStudio.value,
    meta: producers.value[0] ? `Producer: ${producers.value[0]}` : 'Production data'
  }
])
const infoFacts = computed(() => [
  { label: 'Format', value: formatStatus(media.value?.format) },
  { label: 'Status', value: formatStatus(media.value?.status) },
  { label: 'Season', value: formatSeason(media.value?.season, media.value?.seasonYear) },
  { label: 'Episodes', value: media.value?.episodes ? String(media.value.episodes) : '?' },
  { label: 'Duration', value: media.value?.duration ? `${media.value.duration} mins` : 'Unknown' },
  { label: 'Source', value: formatStatus(media.value?.source) }
])
const scoreMarkers = computed(() => {
  if (!scoreDistribution.value.length) return []
  const step = Math.max(10, Math.ceil(scoreDistribution.value.length / 4))
  return scoreDistribution.value.filter((_, index) => index % step === 0 || index === scoreDistribution.value.length - 1)
})

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'watch', label: 'Watch' },
  { key: 'characters', label: 'Characters' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'stats', label: 'Stats' },
  { key: 'social', label: 'Social' }
] as const

const listOptions: Array<{ value: EditableAniListStatus; label: string }> = [
  { value: 'CURRENT', label: 'Watching' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REPEATING', label: 'Rewatching' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'DROPPED', label: 'Dropped' }
]

const currentListLabel = computed(() => {
  const status = media.value?.mediaListEntry?.status
  if (!status) return 'Add to List'
  return listOptions.find((option) => option.value === status)?.label || formatStatus(status)
})

async function toggleFavorite() {
  if (!media.value?.id || !anilistToken.value || actionBusy.value) return

  actionBusy.value = 'favorite'
  const next = !media.value.isFavourite
  const prevCount = media.value.favourites || 0

  media.value.isFavourite = next
  media.value.favourites = Math.max(0, prevCount + (next ? 1 : -1))

  try {
    const response = await anilistGraphql.request<any>(
      toggleFavouriteMutation,
      { animeId: media.value.id },
      { token: anilistToken.value, skipCache: true }
    )
    if (response?.errors?.length) throw new Error(response.errors[0]?.message || 'Unable to update favorite.')
  } catch {
    media.value.isFavourite = !next
    media.value.favourites = prevCount
  } finally {
    actionBusy.value = null
  }
}

async function saveListStatus(status: EditableAniListStatus) {
  if (!media.value?.id || !anilistToken.value || actionBusy.value) return

  actionBusy.value = 'list'
  listMenuOpen.value = false

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
  } finally {
    actionBusy.value = null
  }
}

function providerName(site?: string | null) {
  return site || 'Streaming'
}

function providerNameFromUrl(url?: string | null) {
  if (!url) return 'Watch'
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (hostname.includes('crunchyroll')) return 'Crunchyroll'
    if (hostname.includes('netflix')) return 'Netflix'
    if (hostname.includes('hidive')) return 'HIDIVE'
    if (hostname.includes('youtube')) return 'YouTube'
    if (hostname.includes('hulu')) return 'Hulu'
    if (hostname.includes('primevideo') || hostname.includes('amazon')) return 'Prime Video'
    const primaryLabel = hostname.split('.')[0] || ''
    if (!primaryLabel) return 'Watch'
    return primaryLabel.charAt(0).toUpperCase() + primaryLabel.slice(1)
  } catch {
    return 'Watch'
  }
}

function toAniListSmallCover(url?: string | null) {
  if (!url) return ''
  return url.replace('/medium/', '/small/')
}

function reviewText(review: Review) {
  return (review.body || review.summary || '').trim()
}

function reviewPreview(review: Review) {
  const text = reviewText(review)
  if (text.length <= 280) return text
  return `${text.slice(0, 280).trim()}...`
}

function syncRecommendationViewportWidth() {
  recommendationViewportWidth.value = window.innerWidth
}

function isReviewExpanded(reviewId: number) {
  return Boolean(expandedReviews.value[reviewId])
}

function toggleReviewExpanded(reviewId: number) {
  expandedReviews.value = {
    ...expandedReviews.value,
    [reviewId]: !expandedReviews.value[reviewId]
  }
}

function hasReviewOverflow(review: Review) {
  return reviewText(review).length > 280
}

function handleDocumentClick(event: MouseEvent) {
  if (!listMenuOpen.value) return
  const target = event.target as Node | null
  if (listActionRef.value && target && !listActionRef.value.contains(target)) {
    listMenuOpen.value = false
  }
}

function loadMoreReviews() {
  if (!hasMoreReviews.value || reviewsState.pending.value) return
  reviewPage.value += 1
}

watch(animeId, () => {
  reviewPage.value = 1
  expandedReviews.value = {}
})

onMounted(() => {
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
    <div v-if="loading" class="state-panel">Loading anime...</div>
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
              <div class="sidebar-title">Rankings</div>
              <div v-for="item in rankings" :key="`${item.type}-${item.rank}`" class="rank-item">
                <span class="rank-icon">{{ item.type === 'RATED' ? '★' : '♥' }}</span>
                <span class="rank-label">{{ formatRankingLabel(item.type) }}</span>
                <span>#{{ item.rank }}</span>
              </div>
            </div>

            <div class="sidebar-section">
              <div class="sidebar-title">Data</div>
              <div class="data-row"><span class="data-label">Format</span><span class="data-value">{{ formatStatus(media.format) }}</span></div>
              <div class="data-row"><span class="data-label">Episodes</span><span class="data-value">{{ media.episodes || '?' }}</span></div>
              <div class="data-row"><span class="data-label">Episode Duration</span><span class="data-value">{{ media.duration ? `${media.duration} mins` : 'Unknown' }}</span></div>
              <div class="data-row"><span class="data-label">Status</span><span class="data-value">{{ formatStatus(media.status) }}</span></div>
              <div class="data-row"><span class="data-label">Start Date</span><span class="data-value">{{ formatDate(media.startDate) }}</span></div>
              <div class="data-row"><span class="data-label">End Date</span><span class="data-value">{{ formatDate(media.endDate) }}</span></div>
              <div class="data-row"><span class="data-label">Season</span><span class="data-value">{{ formatSeason(media.season, media.seasonYear) }}</span></div>
              <div class="data-row"><span class="data-label">Average Score</span><span class="data-value">{{ media.averageScore ? `${media.averageScore}%` : '-' }}</span></div>
              <div class="data-row"><span class="data-label">Mean Score</span><span class="data-value">{{ media.meanScore ? `${media.meanScore}%` : '-' }}</span></div>
              <div class="data-row"><span class="data-label">Popularity</span><span class="data-value">{{ formatNumber(media.popularity) }}</span></div>
              <div class="data-row"><span class="data-label">Favorites</span><span class="data-value">{{ formatNumber(media.favourites) }}</span></div>
              <div class="data-row"><span class="data-label">Studio</span><span class="data-value">{{ animationStudio }}</span></div>
              <div v-if="producers.length" class="data-row"><span class="data-label">Producers</span><span class="data-value stacked"><span v-for="producer in producers" :key="producer">{{ producer }}</span></span></div>
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
              <div class="media-kicker">Anime Detail</div>
              <div class="media-meta-strip">
                <span class="media-meta-pill">{{ formatStatus(media.format) }}</span>
                <span class="media-meta-pill">{{ formatSeason(media.season, media.seasonYear) }}</span>
                <span class="media-meta-pill">{{ media.averageScore ? `${media.averageScore}% score` : 'No score yet' }}</span>
                <span class="media-meta-pill">{{ media.episodes ? `${media.episodes} eps` : 'Episodes TBA' }}</span>
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

                <button class="favorite-button" type="button" :disabled="actionBusy === 'favorite' || !anilistToken" @click="toggleFavorite">
                  <span v-if="media.isFavourite">&#9829;</span>
                  <span v-else>&#9825;</span>
                </button>
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
                <h2 class="section-title">Characters</h2>
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
                        <div class="character-role">{{ character.voiceActors[0].languageV2 || 'Japanese' }}</div>
                      </div>
                      <img :src="character.voiceActors[0].image?.large || ''" :alt="character.voiceActors[0].name?.full || ''" class="character-img">
                    </div>
                  </article>
                </div>
              </section>

              <section v-if="watchEpisodes.length" class="watch-section">
                <h2 class="section-title">Watch</h2>
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
                      <div class="watch-provider-name">{{ episode.title || 'Episode' }}</div>
                      <div class="watch-provider-label">{{ providerNameFromUrl(episode.url) }}</div>
                    </div>
                  </a>
                </div>
              </section>

              <section v-if="media.trailer?.thumbnail">
                <h2 class="section-title">Trailer</h2>
                <a
                  class="trailer-container"
                  :href="media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : '#'"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img :src="media.trailer.thumbnail" :alt="`${pageTitle} trailer`">
                  <div class="play-btn">Play</div>
                </a>
              </section>

              <section v-if="followingActivities.length">
                <h2 class="section-title">Following</h2>
                <div class="following-grid">
                  <article v-for="activity in followingActivities.slice(0, 6)" :key="activity.id" class="following-item">
                    <div class="following-user">
                      <img :src="activity.user?.avatar?.medium || coverImage" :alt="activity.user?.name || 'User'" class="following-avatar">
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
                    <h2 class="section-title">Recommendations</h2>
                    <button
                      v-if="hasHiddenRecommendations"
                      type="button"
                      class="section-link-button"
                      @click="showAllRecommendations = !showAllRecommendations"
                    >
                      {{ showAllRecommendations ? 'View less' : 'View all recommendations' }}
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
                <h2 class="section-title">Reviews</h2>
                <article v-for="review in overviewReviews" :key="review.id" class="review-item">
                  <div class="review-header">
                    <img :src="review.user?.avatar?.large || coverImage" :alt="review.user?.name || 'User'" class="review-avatar">
                    <div>
                      <div class="following-name">{{ review.user?.name }}</div>
                      <div class="following-status">Score: {{ review.score || '-' }}/100</div>
                    </div>
                  </div>
                  <div class="review-text">{{ isReviewExpanded(review.id) ? reviewText(review) : reviewPreview(review) }}</div>
                  <button
                    v-if="hasReviewOverflow(review)"
                    type="button"
                    class="review-expand"
                    @click="toggleReviewExpanded(review.id)"
                  >
                    {{ isReviewExpanded(review.id) ? 'View less' : 'View more' }}
                  </button>
                  <div class="review-likes">Rating: {{ review.rating || 0 }}</div>
                </article>
              </section>
            </template>

            <template v-else-if="selectedTab === 'watch'">
              <section class="watch-section">
                <h2 class="section-title">Watch</h2>
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
                      <div class="watch-provider-name">{{ episode.title || 'Episode' }}</div>
                      <div class="watch-provider-label">{{ providerNameFromUrl(episode.url) }}</div>
                    </div>
                  </a>
                </div>
                <div v-else class="social-empty compact">No episode previews with thumbnails were found on AniList for this title.</div>
              </section>
            </template>

            <template v-else-if="selectedTab === 'characters'">
              <section>
                <h2 class="section-title">Characters</h2>
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
                        <div class="character-role">{{ character.voiceActors[0].languageV2 || 'Japanese' }}</div>
                      </div>
                      <img :src="character.voiceActors[0].image?.large || ''" :alt="character.voiceActors[0].name?.full || ''" class="character-img">
                    </div>
                  </article>
                </div>
              </section>
            </template>

            <template v-else-if="selectedTab === 'reviews'">
              <section>
                <h2 class="section-title">Reviews</h2>
                <article v-for="review in reviews" :key="`${review.id}-reviewtab`" class="review-item">
                  <div class="review-header">
                    <img :src="review.user?.avatar?.large || coverImage" :alt="review.user?.name || 'User'" class="review-avatar">
                    <div>
                      <div class="following-name">{{ review.user?.name }}</div>
                      <div class="following-status">Score: {{ review.score || '-' }}/100</div>
                    </div>
                  </div>
                  <div class="review-text">{{ isReviewExpanded(review.id) ? reviewText(review) : reviewPreview(review) }}</div>
                  <button
                    v-if="hasReviewOverflow(review)"
                    type="button"
                    class="review-expand"
                    @click="toggleReviewExpanded(review.id)"
                  >
                    {{ isReviewExpanded(review.id) ? 'View less' : 'View more' }}
                  </button>
                </article>
                <div v-if="reviewsState.pending" class="social-empty compact">Loading more reviews...</div>
                <button
                  v-else-if="hasMoreReviews"
                  type="button"
                  class="review-load-more"
                  :disabled="reviewsState.pending"
                  @click="loadMoreReviews"
                >
                  Load more
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
                      <div class="stat-title">Status Distribution</div>
                      <div class="profile-like-meta">{{ formatNumber(totalTrackedUsers) }} tracked</div>
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
                      <div class="stat-title">Score Distribution</div>
                      <div class="profile-like-meta">
                        {{ media.meanScore ? `${media.meanScore}% mean` : 'No mean score' }}
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
                    <h3 class="info-card-title">Media Details</h3>
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
                        <span>Main Studio</span>
                        <strong>{{ animationStudio }}</strong>
                      </div>
                      <div class="info-card-row">
                        <span>Producers</span>
                        <strong>{{ producers.length ? producers.join(', ') : 'Unknown' }}</strong>
                      </div>
                      <div v-if="media.hashtag" class="info-card-row">
                        <span>Hashtag</span>
                        <strong>{{ media.hashtag }}</strong>
                      </div>
                    </div>
                  </section>

                  <section v-if="rankings.length" class="info-card">
                    <h3 class="info-card-title">Community Highlights</h3>
                    <div class="info-card-list">
                      <div v-for="item in rankings" :key="`${item.type}-${item.rank}-detail`" class="info-card-row">
                        <span>{{ formatRankingLabel(item.type) }}</span>
                        <strong>#{{ item.rank }}</strong>
                      </div>
                    </div>
                  </section>

                  <section v-if="genres.length || tags.length" class="info-card">
                    <h3 class="info-card-title">Genres and Tags</h3>
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
                        <h2 class="social-heading">Recent Activity</h2>
                        <p class="social-subheading">Live anime list activity around this title.</p>
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
                      Link your AniList account to unlock the Self and Following feeds.
                    </p>

                    <div v-if="socialLoading" class="social-empty">Loading activity...</div>

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
                              {{ activity.user?.name || 'AniList User' }}
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
                                Direct Link
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
                          <span class="activity-action">Replies {{ activity.replyCount || 0 }}</span>
                          <span class="activity-action">Likes {{ activity.likeCount || 0 }}</span>
                          <span v-if="activity.isSubscribed" class="activity-action accent">Subscribed</span>
                        </div>
                      </article>
                    </div>

                    <div v-else class="social-empty">
                      No activity found for this feed yet.
                    </div>

                    <button
                      v-if="canLoadMoreSocial"
                      type="button"
                      class="load-more-btn"
                      :disabled="socialPending"
                      @click="loadMoreSocial"
                    >
                      Load More
                    </button>
                  </article>
                </div>

                <aside class="social-sidebar">
                  <article class="social-panel">
                    <div class="social-side-head">
                      <div>
                        <h2 class="social-side-title">Following</h2>
                        <p class="social-side-subtitle">People you follow who interacted with this anime.</p>
                      </div>
                      <span class="social-side-count">Users: {{ followingUserCount }}</span>
                    </div>

                    <p v-if="!canUsePersonalFeeds" class="social-note">
                      Connect AniList to see the people you follow here.
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
                            {{ activity.user?.name || 'AniList User' }}
                          </a>
                          <div class="social-following-progress">{{ formatProgress(activity) }}</div>
                        </div>
                        <div class="social-following-time">{{ relativeTime(activity.createdAt) }}</div>
                      </article>
                    </div>

                    <div v-else-if="canUsePersonalFeeds" class="social-empty compact">
                      No followed users found for this anime yet.
                    </div>

                    <div v-if="canUsePersonalFeeds && followingTimelineItems.length" class="timeline-block">
                      <h3 class="mini-title">Activity Timeline</h3>
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
                          <a :href="mediaSocialUrl" target="_blank" rel="noreferrer">Threads</a>
                        </h2>
                        <p class="social-side-subtitle">Recent discussions from AniList forums.</p>
                      </div>
                      <a class="create-thread-link" :href="createThreadUrl" target="_blank" rel="noreferrer">
                        Create New Thread
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
                            <span>{{ thread.user?.name || 'AniList User' }}</span>
                          </div>
                          <div class="thread-metrics">
                            <span>{{ formatCompactNumber(thread.viewCount || 0) }} views</span>
                            <span>{{ thread.replyCount || 0 }} replies</span>
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
                      No threads found for this anime.
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

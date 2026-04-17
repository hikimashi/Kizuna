<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSync, type EditableAniListStatus } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

type FuzzyDate = { year?: number | null; month?: number | null; day?: number | null }
type MediaTitle = { romaji?: string | null; english?: string | null; native?: string | null }
type CoverImage = { large?: string | null; extraLarge?: string | null; color?: string | null }
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
  mediaRecommendation?: { id: number; title?: MediaTitle | null; coverImage?: CoverImage | null } | null
}
type Review = {
  id: number
  rating?: number | null
  score?: number | null
  summary?: string | null
  body?: string | null
  user?: { name?: string | null; avatar?: { large?: string | null } | null } | null
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
  user?: { name?: string | null; avatar?: { medium?: string | null } | null } | null
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
const anilistToken = computed(() => String(((pocketbaseStore.authRecord as any) || {})?.anilist_token ?? ''))

const mediaQuery = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      description(asHtml: false)
      bannerImage
      coverImage { large extraLarge color }
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
            coverImage { large extraLarge color }
          }
        }
      }
      recommendations(sort: [RATING_DESC]) {
        nodes {
          rating
          mediaRecommendation {
            id
            title { romaji english native }
            coverImage { large extraLarge color }
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
      reviews(sort: [RATING_DESC, SCORE_DESC]) {
        nodes {
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
      stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
      }
    }
  }
`

const socialQuery = `
  query ($id: Int) {
    Page(page: 1, perPage: 8) {
      activities(mediaId: $id, sort: ID_DESC, type: MEDIA_LIST) {
        ... on ListActivity {
          id
          status
          progress
          createdAt
          user {
            name
            avatar { medium }
          }
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
  () => `anime-social-${animeId.value}`,
  async () => {
    const response = await anilistGraphql.request<AniListGraphqlResponse<{ Page?: { activities?: Activity[] | null } }>>(
      socialQuery,
      { id: animeId.value },
      { cacheTtlMs: 60_000 }
    )
    return response.data?.Page?.activities ?? []
  },
  { default: () => [], watch: [animeId] }
)

const media = computed(() => mediaState.data.value)
const activities = computed(() => socialState.data.value ?? [])
const loading = computed(() => mediaState.pending.value && !mediaState.data.value)
const hasError = computed(() => Boolean(mediaState.error.value))
const pageTitle = computed(() => media.value?.title?.english || media.value?.title?.romaji || 'Anime')
const bannerImage = computed(() => media.value?.bannerImage || media.value?.coverImage?.extraLarge || media.value?.coverImage?.large || '')
const coverImage = computed(() => media.value?.coverImage?.extraLarge || media.value?.coverImage?.large || '')
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
    .filter(Boolean)
    .slice(0, 5)
)
const genres = computed(() => ((media.value?.genres || []).filter(Boolean) as string[]).slice(0, 6))
const tags = computed(() => (media.value?.tags || []).filter((tag) => !tag?.isMediaSpoiler).slice(0, 10))
const relations = computed(() => (media.value?.relations?.edges || []).filter((edge) => edge?.node).slice(0, 4))
const allCharacters = computed(() => (media.value?.characters?.edges || []).filter((edge) => edge?.node))
const overviewCharacters = computed(() => allCharacters.value.slice(0, 6))
const characters = computed(() => allCharacters.value.slice(0, 12))
const episodes = computed(() => (media.value?.streamingEpisodes || []).filter(Boolean).slice(0, 8))
const recommendations = computed(() => (media.value?.recommendations?.nodes || []).filter((item) => item?.mediaRecommendation).slice(0, 4))
const reviews = computed(() => (media.value?.reviews?.nodes || []).filter(Boolean).slice(0, 4))

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
      >
        <a
          v-if="bannerImage"
          class="hohDownload"
          :href="bannerImage"
          :aria-label="`Open ${pageTitle} banner image`"
          title="Download banner"
          target="_blank"
          rel="noreferrer"
        >
          <svg aria-hidden="true" viewBox="0 0 512 512">
            <path
              fill="currentColor"
              d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zM432 456c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z"
            />
          </svg>
        </a>
      </div>

      <div class="container">
        <div class="two-col-layout">
          <aside class="sidebar-left">
            <div class="cover">
              <img :src="coverImage" :alt="pageTitle">
            </div>

            <div v-if="rankings.length" class="sidebar-section">
              <div class="sidebar-title">Rankings</div>
              <div v-for="item in rankings" :key="`${item.type}-${item.rank}`" class="rank-item">
                <span>{{ item.type === 'RATED' ? 'Star' : 'Heart' }}</span>
                <span>#{{ item.rank }} {{ item.type === 'RATED' ? 'Highest Rated All Time' : 'Most Popular All Time' }}</span>
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
              <h1 class="media-title">{{ pageTitle }}</h1>
              <p class="media-description">{{ description }}</p>

              <div class="actions">
                <div class="list-action">
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
              <div class="overview-stats-grid">
                <article v-for="item in overviewStats" :key="item.label" class="overview-stat-card">
                  <div class="overview-stat-label">{{ item.label }}</div>
                  <div class="overview-stat-value">{{ item.value }}</div>
                  <div class="overview-stat-meta">{{ item.meta }}</div>
                </article>
              </div>

              <div class="stats-section">
                <div class="stat-card">
                  <div class="stat-header">
                    <div class="stat-title">Status Distribution</div>
                    <div class="stat-summary">
                      <div class="stat-pill">
                        <span class="stat-pill-label">Tracked</span>
                        <strong>{{ formatNumber(totalTrackedUsers) }}</strong>
                      </div>
                      <div v-if="dominantStatus" class="stat-pill" :style="{ '--pill-accent': dominantStatus.color }">
                        <span class="stat-pill-label">Top</span>
                        <strong>{{ dominantStatus.label }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="status-bar">
                    <div v-for="item in statusDistribution" :key="item.key" class="status-item">
                      <div class="status-badge" :style="{ background: item.color }">{{ item.label }}</div>
                      <div class="status-count">{{ formatNumber(item.value) }} Users</div>
                      <div class="status-share">{{ item.share }}</div>
                    </div>
                  </div>
                  <div class="status-progress">
                    <div v-for="item in statusDistribution" :key="`${item.key}-bar`" class="progress-segment" :style="{ width: item.width, background: item.color }" />
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-header">
                    <div class="stat-title">Score Distribution</div>
                    <div class="stat-summary">
                      <div class="stat-pill">
                        <span class="stat-pill-label">Mean</span>
                        <strong>{{ media.meanScore ? `${media.meanScore}%` : '-' }}</strong>
                      </div>
                      <div v-if="peakScoreBucket" class="stat-pill">
                        <span class="stat-pill-label">Peak</span>
                        <strong>{{ peakScoreBucket.score }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="score-bars">
                    <div v-for="item in scoreDistribution" :key="item.score" class="score-column">
                      <span class="score-count">{{ item.amount ? formatCompactNumber(item.amount) : '' }}</span>
                      <div class="score-bar-wrap">
                        <div class="score-bar" :style="{ height: item.height }" />
                      </div>
                      <span class="score-label">{{ item.score }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <section v-if="relations.length">
                <h2 class="section-title">Relations</h2>
                <div class="relations-grid">
                  <NuxtLink
                    v-for="relation in relations"
                    :key="`${relation.relationType}-${relation.node?.id}`"
                    class="relation-card"
                    :to="`/${(relation.node?.type || 'ANIME').toLowerCase()}/${relation.node?.id}`"
                  >
                    <img :src="relation.node?.coverImage?.large || ''" :alt="relation.node?.title?.english || relation.node?.title?.romaji || ''">
                    <div class="relation-type">{{ formatStatus(relation.relationType) }}</div>
                  </NuxtLink>
                </div>
              </section>

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

              <section v-if="episodes.length" class="watch-section">
                <h2 class="section-title">Watch</h2>
                <div class="episodes-grid">
                  <a
                    v-for="episode in episodes"
                    :key="`${episode.title}-${episode.url}`"
                    class="episode-card"
                    :href="episode.url || '#'"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img :src="episode.thumbnail || coverImage" :alt="episode.title || pageTitle">
                    <div class="episode-title">{{ episode.title }}</div>
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

              <section v-if="activities.length">
                <h2 class="section-title">Following</h2>
                <div class="following-grid">
                  <article v-for="activity in activities" :key="activity.id" class="following-item">
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
                <h2 class="section-title">Recommendations</h2>
                <div class="recommendations-grid">
                  <NuxtLink v-for="item in recommendations" :key="item.mediaRecommendation?.id" class="rec-card" :to="`/anime/${item.mediaRecommendation?.id}`">
                    <img :src="item.mediaRecommendation?.coverImage?.large || ''" :alt="item.mediaRecommendation?.title?.english || item.mediaRecommendation?.title?.romaji || ''">
                    <div class="rec-info">
                      <div class="rec-title">{{ item.mediaRecommendation?.title?.english || item.mediaRecommendation?.title?.romaji }}</div>
                      <div class="rec-votes">+{{ item.rating || 0 }}</div>
                    </div>
                  </NuxtLink>
                </div>
              </section>

              <section v-if="reviews.length">
                <h2 class="section-title">Reviews</h2>
                <article v-for="review in reviews" :key="review.id" class="review-item">
                  <div class="review-header">
                    <img :src="review.user?.avatar?.large || coverImage" :alt="review.user?.name || 'User'" class="review-avatar">
                    <div>
                      <div class="following-name">{{ review.user?.name }}</div>
                      <div class="following-status">Score: {{ review.score || '-' }}/100</div>
                    </div>
                  </div>
                  <div class="review-text">{{ review.summary || review.body }}</div>
                  <div class="review-likes">Rating: {{ review.rating || 0 }}</div>
                </article>
              </section>
            </template>

            <template v-else-if="selectedTab === 'watch'">
              <section class="watch-section">
                <h2 class="section-title">Watch</h2>
                <div class="episodes-grid">
                  <a
                    v-for="episode in episodes"
                    :key="`${episode.title}-${episode.url}-watch`"
                    class="episode-card"
                    :href="episode.url || '#'"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img :src="episode.thumbnail || coverImage" :alt="episode.title || pageTitle">
                    <div class="episode-title">{{ episode.title }}</div>
                  </a>
                </div>
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
                  <div class="review-text">{{ review.body || review.summary }}</div>
                </article>
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
                    <div class="stat-header">
                      <div class="stat-title">Status Distribution</div>
                      <div class="stat-summary">
                        <div class="stat-pill">
                          <span class="stat-pill-label">Tracked</span>
                          <strong>{{ formatNumber(totalTrackedUsers) }}</strong>
                        </div>
                        <div v-if="dominantStatus" class="stat-pill" :style="{ '--pill-accent': dominantStatus.color }">
                          <span class="stat-pill-label">Top</span>
                          <strong>{{ dominantStatus.label }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="status-bar">
                      <div v-for="item in statusDistribution" :key="`${item.key}-stats`" class="status-item">
                        <div class="status-badge" :style="{ background: item.color }">{{ item.label }}</div>
                        <div class="status-count">{{ formatNumber(item.value) }} Users</div>
                        <div class="status-share">{{ item.share }}</div>
                      </div>
                    </div>
                    <div class="status-progress">
                      <div v-for="item in statusDistribution" :key="`${item.key}-statsbar`" class="progress-segment" :style="{ width: item.width, background: item.color }" />
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-header">
                      <div class="stat-title">Score Distribution</div>
                      <div class="stat-summary">
                        <div class="stat-pill">
                          <span class="stat-pill-label">Mean</span>
                          <strong>{{ media.meanScore ? `${media.meanScore}%` : '-' }}</strong>
                        </div>
                        <div v-if="peakScoreBucket" class="stat-pill">
                          <span class="stat-pill-label">Peak</span>
                          <strong>{{ peakScoreBucket.score }}</strong>
                        </div>
                      </div>
                    </div>
                  <div class="score-bars">
                    <div v-for="item in scoreDistribution" :key="`${item.score}-stats`" class="score-column">
                      <span class="score-count">{{ item.amount ? formatCompactNumber(item.amount) : '' }}</span>
                      <div class="score-bar-wrap">
                        <div class="score-bar" :style="{ height: item.height }" />
                        </div>
                      <span class="score-label">{{ item.score }}</span>
                    </div>
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
              <section>
                <h2 class="section-title">Following</h2>
                <div class="following-grid">
                  <article v-for="activity in activities" :key="`${activity.id}-social`" class="following-item">
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
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="~/assets/css/pages/animeDetails.css"></style>

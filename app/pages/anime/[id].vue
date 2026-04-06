
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
type RelationEdge = { relationType?: string | null; node?: { id: number; type?: string | null; title?: MediaTitle | null; coverImage?: CoverImage | null } | null }
type CharacterEdge = { role?: string | null; node?: { id: number; name?: { full?: string | null } | null; image?: { large?: string | null } | null } | null; voiceActors?: Array<{ id: number; languageV2?: string | null; name?: { full?: string | null } | null; image?: { large?: string | null } | null }> }
type Recommendation = { rating?: number | null; mediaRecommendation?: { id: number; title?: MediaTitle | null; coverImage?: CoverImage | null } | null }
type Review = { id: number; rating?: number | null; score?: number | null; summary?: string | null; body?: string | null; user?: { name?: string | null; avatar?: { large?: string | null } | null } | null }
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
type Activity = { id: number; status?: string | null; progress?: string | null; createdAt?: number | null; user?: { name?: string | null; avatar?: { medium?: string | null } | null } | null }

const route = useRoute()
const animeId = computed(() => Number(route.params.id))
const selectedTab = ref<'overview' | 'watch' | 'characters' | 'reviews' | 'stats' | 'social'>('overview')
const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const anilistSync = useAnilistSync()
const actionBusy = ref<'favorite' | 'list' | null>(null)
const listMenuOpen = ref(false)
const anilistToken = computed(() => String(((pocketbaseStore.authRecord as any) || {})?.anilist_token ?? ''))

const mediaQuery = `query($id:Int){Media(id:$id,type:ANIME){id title{romaji english native} description(asHtml:false) bannerImage coverImage{large extraLarge color} averageScore meanScore popularity favourites isFavourite episodes duration format status season seasonYear source hashtag startDate{year month day} endDate{year month day} trailer{site id thumbnail} rankings{rank type allTime} tags{name rank isMediaSpoiler} streamingEpisodes{title thumbnail url} studios{nodes{name isAnimationStudio}} mediaListEntry{id status} relations{edges{relationType node{id type title{romaji english native} coverImage{large extraLarge color}}}} recommendations(sort:[RATING_DESC]){nodes{rating mediaRecommendation{id title{romaji english native} coverImage{large extraLarge color}}}} characters(sort:[ROLE,RELEVANCE,ID]){edges{role node{id name{full} image{large}} voiceActors(language:JAPANESE,sort:[RELEVANCE,ID]){id languageV2 name{full} image{large}}}} reviews(sort:[RATING_DESC,SCORE_DESC]){nodes{id rating score summary body(asHtml:false) user{name avatar{large}}}} stats{scoreDistribution{score amount} statusDistribution{status amount}}}}`
const socialQuery = `query($id:Int){Page(page:1,perPage:8){activities(mediaId:$id,sort:ID_DESC,type:MEDIA_LIST){... on ListActivity{id status progress createdAt user{name avatar{medium}}}}}}`
const toggleFavouriteMutation = `mutation($animeId:Int){ToggleFavourite(animeId:$animeId){anime{nodes{id}}}}`

const mediaState = await useAsyncData(() => `anime-detail-${animeId.value}`, async () => {
  const response = await anilistGraphql.request<{ data?: { Media?: MediaData } }>(mediaQuery, { id: animeId.value }, { token: anilistToken.value, cacheTtlMs: anilistToken.value ? 15_000 : 120_000 })
  return response.data?.Media ?? null
}, { watch: [animeId] })

const socialState = await useAsyncData(() => `anime-social-${animeId.value}`, async () => {
  const response = await $fetch<{ data?: { Page?: { activities?: Activity[] | null } } }>('https://graphql.anilist.co', { method: 'POST', body: { query: socialQuery, variables: { id: animeId.value } }, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
  return response.data?.Page?.activities ?? []
}, { default: () => [], watch: [animeId] })

const media = computed(() => mediaState.data.value)
const activities = computed(() => socialState.data.value ?? [])
const loading = computed(() => mediaState.pending.value)
const hasError = computed(() => Boolean(mediaState.error.value))
const pageTitle = computed(() => media.value?.title?.english || media.value?.title?.romaji || 'Anime')
const bannerImage = computed(() => media.value?.bannerImage || media.value?.coverImage?.extraLarge || media.value?.coverImage?.large || '')
const coverImage = computed(() => media.value?.coverImage?.extraLarge || media.value?.coverImage?.large || '')
const description = computed(() => (media.value?.description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim())
const rankings = computed(() => (media.value?.rankings || []).filter(item => item.rank && item.allTime).slice(0, 2))
const studios = computed(() => (media.value?.studios?.nodes || []).filter(Boolean))
const animationStudio = computed(() => studios.value.find(item => item?.isAnimationStudio)?.name || studios.value[0]?.name || 'Unknown')
const producers = computed(() => studios.value.filter(item => !item?.isAnimationStudio).map(item => item?.name).filter(Boolean).slice(0, 5))
const tags = computed(() => (media.value?.tags || []).filter(tag => !tag?.isMediaSpoiler).slice(0, 10))
const relations = computed(() => (media.value?.relations?.edges || []).filter(edge => edge?.node).slice(0, 4))
const characters = computed(() => (media.value?.characters?.edges || []).filter(edge => edge?.node).slice(0, 6))
const episodes = computed(() => (media.value?.streamingEpisodes || []).filter(Boolean).slice(0, 8))
const recommendations = computed(() => (media.value?.recommendations?.nodes || []).filter(item => item?.mediaRecommendation).slice(0, 4))
const reviews = computed(() => (media.value?.reviews?.nodes || []).filter(Boolean).slice(0, 4))

function formatStatus(value?: string | null) { return value ? value.toLowerCase().split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : 'Unknown' }
function formatDate(date?: FuzzyDate | null) { if (!date?.year) return 'TBA'; return new Date(date.year, (date.month || 1) - 1, date.day || 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function formatSeason(season?: string | null, year?: number | null) { return season && year ? `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}` : 'Unknown' }
function formatNumber(value?: number | null) { return new Intl.NumberFormat('en-US').format(value || 0) }
function relativeTime(timestamp?: number | null) { if (!timestamp) return ''; const delta = Math.max(0, Math.floor(Date.now() / 1000) - timestamp); if (delta > 86400) return `${Math.floor(delta / 86400)}d ago`; if (delta > 3600) return `${Math.floor(delta / 3600)}h ago`; if (delta > 60) return `${Math.floor(delta / 60)}m ago`; return 'just now' }
function formatProgress(activity: Activity) { return [formatStatus(activity.status), activity.progress].filter(Boolean).join(' ') }

const statusDistribution = computed(() => {
  const total = (media.value?.stats?.statusDistribution || []).reduce((sum, item) => sum + (item.amount || 0), 0) || 1
  const colors: Record<string, string> = { COMPLETED: '#4CCA5A', PLANNING: '#02A9FF', CURRENT: '#9256F3', PAUSED: '#F779A4', DROPPED: '#E85D75' }
  return (media.value?.stats?.statusDistribution || []).map(item => ({ key: item.status || 'UNKNOWN', label: formatStatus(item.status), value: item.amount || 0, width: `${((item.amount || 0) / total) * 100}%`, color: colors[item.status || ''] || '#3DB4F2' }))
})

const scoreDistribution = computed(() => {
  const buckets = [...(media.value?.stats?.scoreDistribution || [])].sort((a, b) => (a.score || 0) - (b.score || 0))
  const max = Math.max(...buckets.map(item => item.amount || 0), 1)
  return buckets.map(item => ({ score: item.score || 0, height: `${((item.amount || 0) / max) * 100}%` }))
})

const tabs = [{ key: 'overview', label: 'Overview' }, { key: 'watch', label: 'Watch' }, { key: 'characters', label: 'Characters' }, { key: 'reviews', label: 'Reviews' }, { key: 'stats', label: 'Stats' }, { key: 'social', label: 'Social' }] as const
const listOptions: Array<{ value: EditableAniListStatus; label: string }> = [{ value: 'CURRENT', label: 'Watching' }, { value: 'PLANNING', label: 'Planning' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'REPEATING', label: 'Rewatching' }, { value: 'PAUSED', label: 'Paused' }, { value: 'DROPPED', label: 'Dropped' }]
const currentListLabel = computed(() => {
  const status = media.value?.mediaListEntry?.status
  if (!status) return 'Add to List'
  return listOptions.find(option => option.value === status)?.label || formatStatus(status)
})

async function toggleFavorite() {
  if (!media.value?.id || !anilistToken.value || actionBusy.value) return
  actionBusy.value = 'favorite'
  const next = !media.value.isFavourite
  const prevCount = media.value.favourites || 0
  media.value.isFavourite = next
  media.value.favourites = Math.max(0, prevCount + (next ? 1 : -1))
  try {
    const response = await anilistGraphql.request<any>(toggleFavouriteMutation, { animeId: media.value.id }, { token: anilistToken.value, skipCache: true })
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
    const savedEntry = await anilistSync.saveEntry({ entryId: media.value.mediaListEntry?.id || undefined, mediaId: media.value.id, status })
    media.value.mediaListEntry = { id: Number(savedEntry.id), status: String(savedEntry.status || status) }
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
      <div class="banner" :style="bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined">
        <div class="banner-overlay" />
      </div>

      <div class="container">
        <div class="two-col-layout">
          <aside class="sidebar-left">
            <div class="cover">
              <img :src="coverImage" :alt="pageTitle">
            </div>

            <div class="sidebar-section" v-if="rankings.length">
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
              <div class="data-row" v-if="producers.length"><span class="data-label">Producers</span><span class="data-value stacked"><span v-for="producer in producers" :key="producer">{{ producer }}</span></span></div>
              <div class="data-row"><span class="data-label">Source</span><span class="data-value">{{ formatStatus(media.source) }}</span></div>
              <div class="data-row" v-if="media.hashtag"><span class="data-label">Hashtag</span><span class="data-value accent">{{ media.hashtag }}</span></div>
            </div>

            <div class="sidebar-section" v-if="tags.length">
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
                    <button v-for="option in listOptions" :key="option.value" type="button" class="list-option" :class="{ active: media.mediaListEntry?.status === option.value }" @click="saveListStatus(option.value)">
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
                <button v-for="tab in tabs" :key="tab.key" type="button" class="tab" :class="{ active: selectedTab === tab.key }" @click="selectedTab = tab.key">
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <template v-if="selectedTab === 'overview'">
              <div class="stats-section">
                <div class="stat-card">
                  <div class="stat-title">Status Distribution</div>
                  <div class="status-bar">
                    <div v-for="item in statusDistribution" :key="item.key" class="status-item">
                      <div class="status-badge" :style="{ background: item.color }">{{ item.label }}</div>
                      <div class="status-count">{{ formatNumber(item.value) }} Users</div>
                    </div>
                  </div>
                  <div class="status-progress">
                    <div v-for="item in statusDistribution" :key="`${item.key}-bar`" class="progress-segment" :style="{ width: item.width, background: item.color }" />
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-title">Score Distribution</div>
                  <div class="score-bars">
                    <div v-for="item in scoreDistribution" :key="item.score" class="score-column">
                      <div class="score-bar" :style="{ height: item.height }" />
                      <span>{{ item.score }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <section v-if="relations.length">
                <h2 class="section-title">Relations</h2>
                <div class="relations-grid">
                  <NuxtLink v-for="relation in relations" :key="`${relation.relationType}-${relation.node?.id}`" class="relation-card" :to="`/${(relation.node?.type || 'ANIME').toLowerCase()}/${relation.node?.id}`">
                    <img :src="relation.node?.coverImage?.large || ''" :alt="relation.node?.title?.english || relation.node?.title?.romaji || ''">
                    <div class="relation-type">{{ formatStatus(relation.relationType) }}</div>
                  </NuxtLink>
                </div>
              </section>

              <section v-if="characters.length">
                <h2 class="section-title">Characters</h2>
                <div class="characters-grid">
                  <article v-for="character in characters" :key="character.node?.id" class="character-row">
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
                  <a v-for="episode in episodes" :key="`${episode.title}-${episode.url}`" class="episode-card" :href="episode.url || '#'" target="_blank" rel="noreferrer">
                    <img :src="episode.thumbnail || coverImage" :alt="episode.title || pageTitle">
                    <div class="episode-title">{{ episode.title }}</div>
                  </a>
                </div>
              </section>

              <section v-if="media.trailer?.thumbnail">
                <h2 class="section-title">Trailer</h2>
                <a class="trailer-container" :href="media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : '#'" target="_blank" rel="noreferrer">
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
                  <a v-for="episode in episodes" :key="`${episode.title}-${episode.url}-watch`" class="episode-card" :href="episode.url || '#'" target="_blank" rel="noreferrer">
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
                  <article v-for="character in characters" :key="`${character.node?.id}-characters`" class="character-row">
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
              <div class="stats-section">
                <div class="stat-card">
                  <div class="stat-title">Status Distribution</div>
                  <div class="status-bar">
                    <div v-for="item in statusDistribution" :key="`${item.key}-stats`" class="status-item">
                      <div class="status-badge" :style="{ background: item.color }">{{ item.label }}</div>
                      <div class="status-count">{{ formatNumber(item.value) }} Users</div>
                    </div>
                  </div>
                  <div class="status-progress">
                    <div v-for="item in statusDistribution" :key="`${item.key}-statsbar`" class="progress-segment" :style="{ width: item.width, background: item.color }" />
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-title">Score Distribution</div>
                  <div class="score-bars">
                    <div v-for="item in scoreDistribution" :key="`${item.score}-stats`" class="score-column">
                      <div class="score-bar" :style="{ height: item.height }" />
                      <span>{{ item.score }}</span>
                    </div>
                  </div>
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
<style scoped>
.anime-page{min-height:100vh;color:#A0B1C5;font-family:Overpass,Roboto,sans-serif;font-size:14px}
.state-panel{max-width:1520px;margin:120px auto;padding:24px;border-radius:4px;background:#151F2E}.state-panel.error{color:#ff8b9b}
.banner{position:relative;height:240px;background:center/cover;border-bottom:1px solid rgba(160,177,197,.08)}.banner-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,22,34,.18) 0%,rgba(11,22,34,.55) 60%,rgba(11,22,34,.88) 100%)}
.container{max-width:1520px;margin:0 auto;padding:24px 40px 0}.two-col-layout{display:grid;grid-template-columns:215px 1fr;gap:30px;margin-top:0;position:relative;margin-bottom:40px}
.sidebar-left{display:flex;flex-direction:column;gap:18px}.cover{width:215px;height:310px;border-radius:4px;overflow:hidden;box-shadow:0 14px 30px rgba(0,0,0,.5)}.cover img{width:100%;height:100%;object-fit:cover}
.sidebar-section,.stat-card,.review-item,.following-item,.character-row,.rec-card{background:#151F2E;border-radius:4px}.sidebar-section,.stat-card,.review-item{padding:18px}
.sidebar-title{font-size:13px;font-weight:700;color:#fff;margin-bottom:15px;text-transform:uppercase;letter-spacing:.3px}
.data-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(160,177,197,.08);font-size:13px}.data-row:last-child{border-bottom:none}.data-label{color:#748899}.data-value{color:#C0D0E0;font-weight:600;text-align:right}.data-value.stacked{display:flex;flex-direction:column;gap:2px}.accent,.tag-percent{color:#3DB4F2}
.rank-item,.tag-item{display:flex;justify-content:space-between;gap:8px;font-size:13px;color:#C0D0E0}.rank-item+.rank-item,.tag-item+.tag-item{margin-top:8px}.tag-list{display:flex;flex-direction:column;gap:8px}
.media-content{padding-top:0}.media-title{font-size:27px;font-weight:700;color:#fff;margin-bottom:8px}.media-description{font-size:14px;line-height:1.6;color:#A0B1C5;margin:12px 0 16px;max-width:980px;white-space:pre-line}
.actions{display:flex;gap:12px;margin:0 0 25px;align-items:center}.btn{padding:12px 24px;border:none;border-radius:4px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}.btn-primary{background:#3DB4F2;color:#fff}
.list-action{position:relative}.list-button{display:flex;align-items:center;gap:10px;min-width:190px;justify-content:space-between;box-shadow:none}.button-arrow{font-size:11px;opacity:.9}
.list-menu{position:absolute;top:calc(100% + 8px);left:0;min-width:190px;background:#151F2E;border:1px solid rgba(160,177,197,.12);border-radius:4px;box-shadow:0 12px 30px rgba(0,0,0,.35);overflow:hidden;z-index:20}
.list-option{display:block;width:100%;padding:10px 14px;background:transparent;border:none;color:#C0D0E0;text-align:left;font:inherit;cursor:pointer}.list-option:hover,.list-option.active{background:#1C2738;color:#fff}
.favorite-button{width:48px;height:48px;border-radius:4px;border:2px solid #E85D75;background:transparent;color:#E85D75;font-size:24px;line-height:1;cursor:pointer}.favorite-button:hover{background:#E85D75;color:#fff}.favorite-button:disabled,.list-button:disabled{opacity:.5;cursor:not-allowed}
.tabs{border-bottom:1px solid rgba(160,177,197,.15);margin:30px 0}.tabs-nav{display:flex;gap:40px}.tab{padding:18px 0;color:#A0B1C5;background:transparent;border:none;border-bottom:3px solid transparent;font-weight:600;font-size:15px;cursor:pointer}.tab.active{color:#3DB4F2;border-bottom-color:#3DB4F2}
.stats-section{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:40px}.stat-title,.section-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:20px}
.status-bar{display:flex;gap:10px;margin-bottom:8px}.status-item{flex:1;text-align:center}.status-badge{padding:8px 12px;border-radius:4px;font-size:12px;font-weight:700;color:#fff;margin-bottom:5px}.status-count{font-size:12px;color:#C0D0E0}.status-progress{height:8px;background:rgba(0,0,0,.3);border-radius:4px;overflow:hidden;display:flex;margin-top:15px}.progress-segment{height:100%}
.score-bars{display:flex;align-items:flex-end;justify-content:space-around;height:120px;gap:8px}.score-column{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;color:#748899;font-size:11px}.score-bar{width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#66BB6A 0%,#4CCA5A 100%)}
.relations-grid,.recommendations-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:40px}.relation-card,.rec-card{position:relative;overflow:hidden;cursor:pointer;text-decoration:none;color:inherit;transition:transform .2s}.relation-card:hover,.rec-card:hover{transform:translateY(-4px)}.relation-card img{width:100%;height:145px;object-fit:cover}.relation-type{position:absolute;left:0;right:0;bottom:0;padding:6px 8px;background:rgba(0,0,0,.72);font-size:11px;font-weight:700;color:#fff;text-align:center;text-transform:uppercase}
.characters-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:40px}.character-row{display:flex;overflow:hidden}.character-left{display:flex;flex:1}.voice-side{justify-content:flex-end}.character-img{width:60px;height:85px;object-fit:cover}.character-info{padding:10px;display:flex;flex-direction:column;justify-content:center}.character-name{font-size:13px;font-weight:600;color:#C0D0E0;margin-bottom:3px}.character-role{font-size:11px;color:#748899}.text-right{text-align:right}
.watch-section{margin-bottom:40px}.episodes-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:30px}.episode-card{position:relative;border-radius:4px;overflow:hidden;cursor:pointer;transition:transform .2s;color:#fff;text-decoration:none}.episode-card:hover{transform:scale(1.02)}.episode-card img{width:100%;height:120px;object-fit:cover}.episode-title{position:absolute;left:0;right:0;bottom:0;padding:8px;background:linear-gradient(to top,rgba(0,0,0,.9),transparent);color:#fff;font-size:12px;font-weight:600}
.trailer-container{position:relative;display:block;width:100%;max-width:700px;aspect-ratio:16/9;background:#000;border-radius:4px;overflow:hidden;margin-bottom:30px}.trailer-container img{width:100%;height:100%;object-fit:cover}.play-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:14px 18px;border-radius:999px;background:rgba(255,255,255,.92);color:#000;font-weight:700}
.following-grid{display:grid;gap:15px;margin-bottom:40px}.following-item{padding:15px;display:flex;align-items:center;justify-content:space-between}.following-user{display:flex;align-items:center;gap:12px}.following-avatar,.review-avatar{border-radius:50%;object-fit:cover}.following-avatar{width:45px;height:45px}.following-name{font-size:14px;font-weight:600;color:#C0D0E0}.following-status,.review-likes{font-size:13px;color:#A0B1C5}.following-score{font-size:14px;font-weight:700;color:#4CCA5A}
.rec-card img{width:100%;height:180px;object-fit:cover}.rec-info{padding:12px}.rec-title{font-size:13px;font-weight:600;color:#C0D0E0;margin-bottom:5px}.rec-votes{font-size:11px;color:#748899}
.review-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}.review-avatar{width:50px;height:50px}.review-text{font-size:14px;line-height:1.7;color:#A0B1C5}
@media (max-width:1200px){.two-col-layout{grid-template-columns:1fr}.cover{margin:0 auto}.media-content{padding-top:0}.stats-section,.relations-grid,.characters-grid,.episodes-grid,.recommendations-grid{grid-template-columns:1fr}.container{padding:20px 20px 0}.banner{height:180px}}
</style>

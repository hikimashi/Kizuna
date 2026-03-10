<template>
  <section class="browse-results">
    <div class="results-info">
      <template v-if="totalResults > 0">
        Showing <b>{{ items.length }}</b> of <b>{{ totalResults }}</b> results
      </template>
      <template v-else-if="loading && items.length === 0">
        Loading results...
      </template>
      <template v-else>
        Browse the AniList catalog
      </template>
    </div>

    <div v-if="loadError" class="error-state">
      {{ loadError }}
    </div>

    <div v-else-if="loading && items.length === 0" class="initial-loading">
      <SkeletonLoader :count="12" />
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.4-3.4" />
        </svg>
      </div>
      <h2>No anime match these filters</h2>
      <p>Try a broader search, another season, or fewer tags.</p>
    </div>

    <div v-else class="results-shell" :class="`view-${currentViewMode}`">
      <div class="results-grid">
        <article
          v-for="anime in items"
          :key="anime.id"
          class="anime-card"
        >
          <div class="card-media">
            <img
              v-if="coverSrc(anime)"
              :src="coverSrc(anime)"
              :alt="animeTitle(anime)"
              class="card-cover"
            >
            <div v-else class="card-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>

            <span class="card-format">{{ formatLabel(anime.format) }}</span>

            <button
              class="card-add card-add-grid"
              :class="{ added: isAdded(anime) }"
              :disabled="addingMediaId === anime.id || isAdded(anime)"
              type="button"
              :title="cardActionLabel(anime)"
              @click.stop="addToPlanning(anime)"
            >
              <svg v-if="addingMediaId === anime.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
                <path stroke-linecap="round" d="M12 3a9 9 0 1 0 9 9" />
              </svg>
              <svg v-else-if="isAdded(anime)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
                <path stroke-linecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>

            <div class="card-overlay">
              <div class="card-title">{{ animeTitle(anime) }}</div>
              <div class="card-meta">
                <span class="card-score">{{ formatScore(anime.averageScore) }}</span>
                <span class="card-eps">{{ episodesLabel(anime.episodes) }}</span>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="card-main">
              <div class="card-title">{{ animeTitle(anime) }}</div>
              <div class="card-submeta">{{ cardSubmeta(anime) }}</div>
              <div class="card-genres">
                <span
                  v-for="genre in anime.genres.slice(0, 3)"
                  :key="genre"
                  class="genre-tag"
                  :style="genreTagStyle(genre)"
                >
                  {{ genre }}
                </span>
              </div>
              <div v-if="anime.mediaListEntry?.id" class="card-library-state">
                In {{ statusLabel(anime.mediaListEntry?.status) }}
              </div>
            </div>

            <div class="card-side">
              <span class="card-score">{{ formatScore(anime.averageScore) }}</span>
              <span class="card-eps">{{ episodesLabel(anime.episodes) }}</span>
              <button
                class="card-add card-add-inline"
                :class="{ added: isAdded(anime) }"
                :disabled="addingMediaId === anime.id || isAdded(anime)"
                type="button"
                :title="cardActionLabel(anime)"
                @click.stop="addToPlanning(anime)"
              >
                <svg v-if="addingMediaId === anime.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
                  <path stroke-linecap="round" d="M12 3a9 9 0 1 0 9 9" />
                </svg>
                <svg v-else-if="isAdded(anime)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
                  <path stroke-linecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div v-if="loading && items.length > 0" class="loading-more">
      <div class="spinner-ring"></div>
      <p>Loading more...</p>
    </div>

    <div v-else-if="!hasMore && items.length > 0" class="end-of-list">
      Reached the end of these results.
    </div>

    <div ref="sentinelRef" class="sentinel-element"></div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistListEditor } from '~/composables/useAnilistListEditor'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useToastStore } from '~/composables/useToastStore'

const props = defineProps<{
  sortBy?: string
  format?: string
  search?: string
  genres?: string[]
  season?: string
  year?: string
  status?: string
  viewMode?: 'grid' | 'list'
}>()

type BrowseAnime = {
  id: number
  title: {
    romaji?: string | null
    english?: string | null
  }
  coverImage: {
    medium?: string | null
    large?: string | null
  }
  averageScore?: number | null
  format?: string | null
  episodes?: number | null
  seasonYear?: number | null
  genres: string[]
  mediaListEntry?: {
    id?: number | null
    status?: string | null
  } | null
}

const genreStyleMap: Record<string, { background: string; color?: string }> = {
  Action: { background: '#f77f00' },
  Adventure: { background: '#4cc9f0', color: '#0b1622' },
  Comedy: { background: '#68d639', color: '#0b1622' },
  Drama: { background: '#02a9ff', color: '#0b1622' },
  Fantasy: { background: '#9256f3' },
  Horror: { background: '#d62828' },
  Romance: { background: '#f779a4', color: '#0b1622' },
  'Sci-Fi': { background: '#4361ee' },
  'Slice of Life': { background: '#a8dadc', color: '#0b1622' },
  Sports: { background: '#06d6a0', color: '#0b1622' },
  Mystery: { background: '#7b2d8b' },
  Supernatural: { background: '#6a0572' },
  Psychological: { background: '#9b2335' },
  Thriller: { background: '#e85d75' },
  Mecha: { background: '#6c8ebf' },
  Music: { background: '#ffbe0b', color: '#0b1622' }
}

const currentSort = computed(() => props.sortBy || 'POPULARITY_DESC')
const currentFormat = computed(() => props.format || 'ALL')
const currentSearch = computed(() => props.search?.trim() || '')
const currentGenres = computed(() => props.genres || [])
const currentSeason = computed(() => props.season || '')
const currentYearFilter = computed(() => props.year || '')
const currentStatus = computed(() => props.status || '')
const currentViewMode = computed(() => props.viewMode || 'grid')

const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const anilistListEditor = useAnilistListEditor()
const toastStore = useToastStore()
const addingMediaId = ref<number | null>(null)
const totalResults = ref(0)
const loadError = ref('')

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))

const animeTitle = (anime: BrowseAnime) =>
  anime.title.romaji || anime.title.english || 'Unknown title'

const formatLabel = (format?: string | null) => {
  if (!format) return 'Anime'
  if (format === 'TV_SHORT') return 'TV Short'
  return format.replaceAll('_', ' ')
}

const formatScore = (score?: number | null) => {
  if (!score) return 'N/A'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const episodesLabel = (episodes?: number | null) => {
  if (!episodes) return 'Unknown eps'
  return `${episodes} eps`
}

const coverSrc = (anime: BrowseAnime) =>
  anime.coverImage?.large || anime.coverImage?.medium || ''

const statusLabel = (status?: string | null) => {
  if (status === 'CURRENT') return 'Watching'
  if (status === 'COMPLETED') return 'Completed'
  if (status === 'PAUSED') return 'Paused'
  if (status === 'DROPPED') return 'Dropped'
  return 'Planning'
}

const isAdded = (anime: BrowseAnime) => Boolean(anime.mediaListEntry?.id)

const cardActionLabel = (anime: BrowseAnime) => {
  if (addingMediaId.value === anime.id) return 'Adding anime'
  if (isAdded(anime)) return `Already in ${statusLabel(anime.mediaListEntry?.status)}`
  return 'Add to Planning'
}

const cardSubmeta = (anime: BrowseAnime) => {
  const parts = [
    anime.genres[0],
    anime.seasonYear ? String(anime.seasonYear) : '',
    formatLabel(anime.format)
  ].filter(Boolean)
  return parts.join(' / ')
}

const genreTagStyle = (genre: string) => {
  const genreStyle = genreStyleMap[genre]
  if (!genreStyle) return {}
  return {
    background: genreStyle.background,
    color: genreStyle.color || '#ffffff'
  }
}

const resolveYearRange = (yearFilter: string) => {
  if (!yearFilter) return {} as { startDateGreater?: number; startDateLesser?: number }

  if (/^\d{4}$/.test(yearFilter)) {
    const startYear = Number(yearFilter)
    return {
      startDateGreater: startYear * 10000,
      startDateLesser: (startYear + 1) * 10000
    }
  }

  if (yearFilter.endsWith('0s') && yearFilter.length === 5) {
    const startYear = Number(yearFilter.slice(0, 4))
    if (!Number.isNaN(startYear)) {
      return {
        startDateGreater: startYear * 10000,
        startDateLesser: (startYear + 10) * 10000
      }
    }
  }

  if (yearFilter === 'older') {
    return {
      startDateLesser: 2000 * 10000
    }
  }

  return {}
}

const fetchAnimeList = async (page: number, perPage: number): Promise<BrowseAnime[]> => {
  const { startDateGreater, startDateLesser } = resolveYearRange(currentYearFilter.value)

  const query = `
    query (
      $page: Int
      $perPage: Int
      $sort: [MediaSort]
      $format: MediaFormat
      $search: String
      $genres: [String]
      $season: MediaSeason
      $status: MediaStatus
      $startDateGreater: FuzzyDateInt
      $startDateLesser: FuzzyDateInt
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
        }
        media(
          type: ANIME
          sort: $sort
          format: $format
          search: $search
          genre_in: $genres
          season: $season
          status: $status
          startDate_greater: $startDateGreater
          startDate_lesser: $startDateLesser
        ) {
          id
          title {
            romaji
            english
          }
          coverImage {
            medium
            large
          }
          averageScore
          format
          episodes
          seasonYear
          genres
          mediaListEntry {
            id
            status
          }
        }
      }
    }
  `

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: currentSort.value,
    search: currentSearch.value || undefined,
    genres: currentGenres.value.length ? currentGenres.value : undefined,
    season: currentSeason.value || undefined,
    status: currentStatus.value || undefined,
    startDateGreater,
    startDateLesser
  }

  if (currentFormat.value !== 'ALL') {
    variables.format = currentFormat.value
  }

  loadError.value = ''
  if (page === 1) totalResults.value = 0

  const data = await anilistGraphql.request<any>(
    query,
    variables,
    { token: token.value, cacheTtlMs: token.value ? 15_000 : 60_000 }
  )

  if (data?.errors?.length) {
    loadError.value = data.errors[0]?.message || 'Failed to fetch anime list'
    throw new Error(loadError.value)
  }

  totalResults.value = Number(data?.data?.Page?.pageInfo?.total ?? 0)
  return data?.data?.Page?.media ?? []
}

const {
  items,
  loading,
  hasMore,
  sentinelRef,
  setItems,
  reset
} = useInfiniteScroll<BrowseAnime>(fetchAnimeList, {
  threshold: 300,
  initialPage: 1,
  perPage: 20,
  immediate: true
})

const addToPlanning = async (anime: BrowseAnime) => {
  if (!anime?.id || addingMediaId.value === anime.id || anime.mediaListEntry?.id) return

  try {
    addingMediaId.value = anime.id
    const savedEntry = await anilistListEditor.saveEntry({
      mediaId: anime.id,
      status: 'PLANNING'
    })

    setItems(items.value.map((item) =>
      item.id === anime.id
        ? {
          ...item,
          mediaListEntry: {
            id: Number(savedEntry.id),
            status: String(savedEntry.status || 'PLANNING')
          }
        }
        : item
    ))

    toastStore.openToast({ type: 'success', message: 'Anime added to Planning.' })
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to add anime to AniList.' })
  } finally {
    addingMediaId.value = null
  }
}

const filterSignature = computed(() => JSON.stringify({
  sort: currentSort.value,
  format: currentFormat.value,
  search: currentSearch.value,
  genres: currentGenres.value,
  season: currentSeason.value,
  year: currentYearFilter.value,
  status: currentStatus.value
}))

watch(filterSignature, async () => {
  totalResults.value = 0
  loadError.value = ''
  await reset()
})
</script>

<style scoped>
.browse-results {
  --results-surface: var(--kz-card-bg);
  --results-surface-soft: var(--kz-soft-bg);
  --results-surface-input: var(--kz-card-input);
  --results-accent: var(--kz-accent);
  --results-text: var(--kz-text-primary);
  --results-text-secondary: var(--kz-text-secondary);
  --results-text-dim: var(--kz-text-dim);
  --results-border: var(--kz-border);
  --results-shadow: var(--kz-shadow-strong);
  width: min(100%, 1440px);
  margin: 18px auto 0;
  color: var(--results-text);
}

.results-info {
  margin-bottom: 16px;
  color: var(--results-text-dim);
  font-size: 12px;
  font-weight: 600;
}

.results-info b {
  color: var(--results-text-secondary);
}

.initial-loading {
  display: flex;
  justify-content: center;
  padding: 8px 0 0;
}

.error-state,
.empty-state {
  border: 1px solid var(--results-border);
  border-radius: 20px;
  background: rgba(19, 26, 38, 0.76);
  box-shadow: var(--results-shadow);
  backdrop-filter: blur(16px);
}

.error-state {
  padding: 18px 20px;
  color: #f9b4b4;
  font-size: 13px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 48px 20px;
}

.empty-icon {
  width: 62px;
  height: 62px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(61, 180, 242, 0.1);
  color: var(--results-accent);
}

.empty-icon svg {
  width: 28px;
  height: 28px;
}

.empty-state h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--results-text);
}

.empty-state p {
  max-width: 420px;
  margin: 0;
  color: var(--results-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.results-grid {
  display: grid;
  gap: 12px;
}

.view-grid .results-grid {
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
}

.anime-card {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  overflow: hidden;
  background: #131d2a;
  transition: transform 0.16s, border-color 0.16s, box-shadow 0.16s;
}

.anime-card:hover {
  transform: translateY(-3px);
  border-color: rgba(61, 180, 242, 0.18);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-media {
  position: relative;
  overflow: hidden;
}

.view-grid .card-media {
  aspect-ratio: 2 / 3;
}

.card-cover,
.card-placeholder {
  width: 100%;
  height: 100%;
  display: block;
}

.card-cover {
  object-fit: cover;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, #172436 0%, #0d1a27 100%);
}

.card-format {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.72);
  color: #9fadbd;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.card-add {
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: background 0.12s, opacity 0.12s, transform 0.12s, color 0.12s;
}

.card-add:disabled {
  cursor: not-allowed;
}

.card-add-grid {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: rgba(61, 180, 242, 0.86);
  opacity: 0;
}

.anime-card:hover .card-add-grid,
.card-add-grid.added {
  opacity: 1;
}

.card-add:hover:not(:disabled) {
  transform: translateY(-1px);
}

.card-add.added {
  background: rgba(22, 183, 154, 0.9);
}

.card-overlay {
  position: absolute;
  inset: auto 0 0 0;
  min-height: 66px;
  padding: 9px 9px 8px;
  background: rgba(0, 0, 0, 0.76);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-score {
  color: var(--results-accent);
  font-family: 'Overpass Mono', monospace;
  font-size: 9px;
  font-weight: 700;
}

.card-eps {
  color: var(--results-text-dim);
  font-size: 9px;
  font-weight: 600;
}

.view-grid .anime-card {
  aspect-ratio: 2 / 3;
  cursor: pointer;
}

.view-grid .card-title {
  color: #e8f0ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
}

.view-list .results-grid {
  grid-template-columns: 1fr;
}

.view-list .anime-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
}

.view-list .card-media {
  width: 36px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 4px;
}

.view-list .card-overlay,
.view-list .card-add-grid {
  display: none;
}

.view-list .card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  flex: 1;
  padding: 4px 7px;
  background: rgba(0, 0, 0, 0.92);
  border-radius: 4px;
}

.card-main {
  min-width: 0;
}

.view-list .card-title {
  color: #e8f0ff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
}

.card-submeta {
  margin-top: 3px;
  color: #7a9ab8;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Overpass Mono', monospace;
}

.view-grid .card-body,
.view-list .card-format {
  display: none;
}

.view-list .card-genres,
.view-list .card-library-state {
  display: none;
}

.card-side {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.view-list .card-side .card-score {
  font-size: 13px;
}

.card-add-inline {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: rgba(61, 180, 242, 0.12);
  border: 1px solid rgba(61, 180, 242, 0.25);
  color: var(--results-accent);
}

.card-add-inline.added {
  background: rgba(22, 183, 154, 0.16);
  border-color: rgba(22, 183, 154, 0.24);
  color: #16b79a;
}

.loading-more,
.end-of-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 0 0;
  color: var(--results-text-dim);
  font-size: 12px;
  font-weight: 600;
}

.spinner-ring {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(61, 180, 242, 0.18);
  border-top-color: var(--results-accent);
  animation: spin 0.7s linear infinite;
}

.sentinel-element {
  width: 100%;
  height: 1px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .view-grid .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  }
}

@media (max-width: 640px) {
  .view-grid .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 10px;
  }

  .view-list .anime-card {
    gap: 10px;
    padding: 10px;
  }

  .view-list .card-media {
    width: 48px;
    height: 68px;
  }

  .view-list .card-body {
    align-items: flex-start;
  }

  .card-side {
    align-items: center;
  }
}

[data-theme="winter"] .browse-results .error-state,
[data-theme="winter"] .browse-results .empty-state,
[data-theme="winter"] .browse-results .anime-card {
  background: rgba(244, 249, 254, 0.9);
}

[data-theme="winter"] .browse-results .card-placeholder {
  background: linear-gradient(180deg, #e6f1fb 0%, #d4e6f7 100%);
  color: rgba(23, 52, 78, 0.08);
}

[data-theme="winter"] .browse-results .card-format {
  background: rgba(23, 52, 78, 0.72);
  color: #e8f2fb;
}
</style>

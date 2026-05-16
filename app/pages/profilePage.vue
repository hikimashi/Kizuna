<template>
  <div class="profile-page">
    <section class="banner-wrap" :class="{ 'has-image': Boolean(bannerSrc) }">
      <img v-if="bannerSrc" :src="bannerSrc" alt="Bannière AniList" class="banner-image" />
      <div class="banner-content">
        <div class="banner-avatar">
          <img v-if="avatarSrc" :src="avatarSrc" alt="Avatar AniList" />
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8.5" r="4" />
            <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <div class="banner-meta">
          <div class="banner-username">{{ username }}</div>
          <div class="banner-joined">Inscrit {{ joinedDisplay }}</div>
        </div>
      </div>
    </section>

    <main class="page">
      <section class="grid">
        <aside class="left">
          <div class="info-panel">
            <div class="field-row">
              <span class="field-label">AniList ID:</span>
              <span class="field-value">{{ anilistIdDisplay }}</span>
            </div>
          </div>

          <div class="panel">
            <span class="panel-title">Genres</span>
            <div ref="genreTagsContainerRef" class="genre-tags">
              <template v-if="isLoading">
                <span v-for="n in 5" :key="`genre-skeleton-${n}`" class="tag skeleton-pulse" />
              </template>
              <template v-else>
                <span
                  v-for="genre in visibleTopGenres"
                  :key="genre.genre"
                  class="tag"
                  :style="{ background: getGenreColor(genre.genre) }"
                >
                  {{ genre.genre }}
                  <span class="tag-count">{{ genre.count }}</span>
                </span>
              </template>
            </div>
            <div class="genre-tags-measure" aria-hidden="true">
              <span
                v-for="genre in topGenres"
                :key="`measure-${genre.genre}`"
                :ref="setGenreMeasureRef(genre.genre)"
                class="tag"
              >
                {{ genre.genre }}
                <span class="tag-count">{{ genre.count }}</span>
              </span>
            </div>
            <div class="genre-bar" :class="{ 'skeleton-pulse': isLoading }">
              <template v-if="!isLoading">
                <span
                  v-for="genre in barGenres"
                  :key="`bar-${genre.genre}`"
                  class="gb"
                  :data-tooltip="`${genre.genre} (${genre.count})`"
                  :title="`${genre.genre} (${genre.count})`"
                  :style="{
                    width: `${(genre.count / barGenreTotal) * 100}%`,
                    background: getGenreColor(genre.genre)
                  }"
                />
              </template>
            </div>
          </div>

          <div class="panel" v-if="isLoading || hasFavoriteAnime">
            <span class="panel-title">Favoris</span>
            <div class="fav-grid">
              <div v-if="isLoading" v-for="n in 5" :key="`fav-anime-skeleton-${n}`" class="fav-card">
                <div class="fav-placeholder skeleton-pulse">-</div>
              </div>
              <a
                v-else
                v-for="anime in favoriteAnime"
                :key="`fav-anime-${anime.id}`"
                class="fav-card"
                :class="{ 'is-clickable': Boolean(anime?.id), 'is-loading': navigatingFavoriteAnimeId === anime?.id }"
                :href="animeHref(anime?.id)"
                :data-tooltip="getFavoriteAnimeTitle(anime)"
                :title="getFavoriteAnimeTitle(anime)"
                :role="anime?.id ? 'link' : undefined"
                :tabindex="anime?.id ? 0 : undefined"
                @click="handleAnimeLinkClick($event, anime?.id)"
                @keydown.enter.prevent="openFavoriteAnimePage(anime?.id)"
                @keydown.space.prevent="openFavoriteAnimePage(anime?.id)"
              >
                <img
                  :src="favoriteAnimeCoverSrc(anime)"
                  :srcset="favoriteAnimeCoverSrcSet(anime)"
                  :alt="getFavoriteAnimeTitle(anime)"
                  loading="lazy"
                  decoding="async"
                />
                <div v-if="navigatingFavoriteAnimeId === anime?.id" class="fav-card-loader">
                  <div class="fav-card-loader-spinner" />
                  <span>Ouverture...</span>
                </div>
              </a>
            </div>
          </div>

          <div class="panel" v-if="isLoading || hasFavoriteCharacters">
            <span class="panel-title">Personnages favoris</span>
            <div class="fav-grid">
              <div v-if="isLoading" v-for="n in 3" :key="`fav-char-skeleton-${n}`" class="fav-card">
                <div class="fav-placeholder skeleton-pulse">-</div>
              </div>
              <div
                v-else
                v-for="character in favoriteCharacters"
                :key="`fav-char-${character.id}`"
                class="fav-card"
                :data-tooltip="getFavoriteCharacterName(character)"
                :title="getFavoriteCharacterName(character)"
              >
                <img :src="character.image?.large || character.image?.medium" :alt="getFavoriteCharacterName(character)" />
              </div>
            </div>
          </div>
        </aside>

        <section class="right">
          <div class="stats-panel">
            <div class="stats-row">
              <div class="stat">
                <span class="stat-num" :class="{ 'skeleton-pulse skeleton-text': isLoading }">
                  <span v-if="!isLoading">{{ totalAnimes }}</span>
                </span>
                <span class="stat-lbl">Total animes</span>
              </div>
              <div class="stat">
                <span class="stat-num" :class="{ 'skeleton-pulse skeleton-text': isLoading }">
                  <span v-if="!isLoading">{{ daysWatched }}</span>
                </span>
                <span class="stat-lbl">Jours regardés</span>
              </div>
              <div class="stat">
                <span class="stat-num" :class="{ 'skeleton-pulse skeleton-text': isLoading }">
                  <span v-if="!isLoading">{{ meanScore }}</span>
                </span>
                <span class="stat-lbl">Note moyenne</span>
              </div>
            </div>
            <div class="progress-markers">
              <div v-for="marker in progressMarkers" :key="marker" class="marker">
                <span class="marker-num">{{ marker }}</span>
                <div class="marker-tick" />
              </div>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :class="{ 'skeleton-pulse': isLoading }"
                :style="{ width: isLoading ? '31%' : `${progressFillPercent}%` }"
              />
            </div>
          </div>

          <div class="panel">
            <div class="activity-header">
              <span class="activity-title">Activité</span>
            </div>

            <template v-if="isLoading || (activityLoading && activityItems.length === 0)">
              <div v-for="n in 6" :key="`activity-skeleton-${n}`" class="a-item skeleton-pulse">
                <div class="a-thumb" />
                <div class="a-body">
                  <div class="a-text skeleton-line" />
                </div>
              </div>
            </template>
            <template v-else>
              <article
                v-for="activity in activityItems"
                :key="activity.id"
                class="a-item"
                :class="{ 'is-loading': navigatingActivityAnimeId === activity.media?.id }"
              >
                <a
                  class="a-thumb"
                  :class="{ 'is-clickable': Boolean(activity.media?.id), 'is-loading': navigatingActivityAnimeId === activity.media?.id }"
                  :href="animeHref(activity.media?.id)"
                  :role="activity.media?.id ? 'link' : undefined"
                  :tabindex="activity.media?.id ? 0 : undefined"
                  @click="handleActivityAnimeLinkClick($event, activity.media?.id)"
                  @keydown.enter.prevent="openActivityAnimePage(activity.media?.id)"
                  @keydown.space.prevent="openActivityAnimePage(activity.media?.id)"
                >
                  <img
                    v-if="activityCoverSrc(activity)"
                    :src="activityCoverSrc(activity)"
                    :srcset="activityCoverSrcSet(activity)"
                    alt="Couverture"
                    loading="lazy"
                    decoding="async"
                  />
                  <div v-else class="thumb-ph">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                    </svg>
                  </div>
                  <div v-if="navigatingActivityAnimeId === activity.media?.id" class="a-thumb-loader">
                    <div class="a-thumb-spinner" />
                  </div>
                </a>
                <div class="a-body">
                  <div class="a-text">
                    {{ getActivityPrefix(activity) }}
                    <a
                      v-if="activity.media?.id"
                      class="a-title-link"
                      :class="{ 'is-loading': navigatingActivityAnimeId === activity.media?.id }"
                      :href="animeHref(activity.media.id)"
                      @click="handleActivityAnimeLinkClick($event, activity.media.id)"
                    >
                      {{ getActivityTitle(activity) }}
                    </a>
                    <span v-else>{{ getActivityTitle(activity) }}</span>
                  </div>
                </div>
                <span class="a-date">{{ timeAgo(activity.createdAt) }}</span>
              </article>
              <div v-if="activityLoading && activityItems.length > 0" class="activity-loading-more">
                Chargement...
              </div>
              <button
                v-else-if="activityHasMore && activityItems.length > 0"
                class="activity-load-more"
                :disabled="activityLoading"
                type="button"
                @click="loadMoreActivity"
              >
                Charger plus
              </button>
              <div v-else-if="!activityHasMore && activityItems.length === 0" class="activity-empty">
                Aucune activité récente.
              </div>
            </template>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, unref, watch, type ComponentPublicInstance, type VNodeRef } from 'vue'
import { storeToRefs } from 'pinia'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage } from '~/composables/useAnilistCoverImage'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useAnilistProfileStore } from '~/composables/useAnilistProfileStore'

const pocketbaseStore = usePocketbaseStore()
const profileStore = useAnilistProfileStore()
const {
  isLoading,
  totalAnimes,
  daysWatched,
  meanScore,
  genres,
  favoriteAnime,
  favoriteCharacters
} = storeToRefs(profileStore)

const activityItems = ref<any[]>([])
const activityLoading = ref(false)
const activityHasMore = ref(true)
const activityPage = ref(1)
const activityPerPage = 15
const navigatingFavoriteAnimeId = ref<number | null>(null)
const navigatingActivityAnimeId = ref<number | null>(null)
const profileSyncPending = ref(false)

const loadMoreActivity = async () => {
  if (activityLoading.value || !activityHasMore.value) return

  activityLoading.value = true
  try {
    const chunk = await profileStore.fetchActivityPage(activityPage.value, activityPerPage)
    activityItems.value.push(...chunk)

    if (chunk.length < activityPerPage) {
      activityHasMore.value = false
      return
    }

    activityPage.value += 1
  } catch (error) {
    console.error("Echec du chargement de la page d'activite :", error)
    activityHasMore.value = false
  } finally {
    activityLoading.value = false
  }
}

const resetActivityList = async () => {
  activityItems.value = []
  activityHasMore.value = true
  activityPage.value = 1
  await loadMoreActivity()
}

const GENRE_COLORS: Record<string, string> = {
  Action: '#F77F00',
  Adventure: '#4CC9F0',
  Comedy: '#68D639',
  Drama: '#02A9FF',
  Ecchi: '#FF6B9D',
  Fantasy: '#9256F3',
  Horror: '#D62828',
  'Mahou Shoujo': '#FF85C8',
  Mecha: '#6C8EBF',
  Music: '#FFBE0B',
  Mystery: '#7B2D8B',
  Psychological: '#9B2335',
  Romance: '#F779A4',
  'Sci-Fi': '#4361EE',
  'Slice of Life': '#A8DADC',
  Sports: '#06D6A0',
  Supernatural: '#6A0572',
  Thriller: '#E85D75'
}
function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? '#3db4f2'
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000)
  if (seconds < 60) return "À l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  if (months < 12) return `Il y a ${months} mois`
  return `Il y a ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`
}

function getActivityTitle(activity: any): string {
  return activity?.media?.title?.english ?? activity?.media?.title?.romaji ?? 'Titre inconnu'
}

const ACTIVITY_STATUS_PREFIXES: Record<string, string> = {
  'watched episode': "A regardé l'épisode",
  'plans to watch': 'Prévoit de regarder',
  completed: 'A terminé',
  rewatched: 'A re-regardé',
  'paused watching': 'A mis en pause',
  dropped: 'A abandonné'
}

function getActivityPrefix(activity: any): string {
  const status = String(activity?.status ?? '').replace(/_/g, ' ').toLowerCase().trim()
  const progress = activity?.progress

  if (status === 'watched episode') return `${ACTIVITY_STATUS_PREFIXES['watched episode']} ${progress ?? '?'} de `
  if (ACTIVITY_STATUS_PREFIXES[status]) return `${ACTIVITY_STATUS_PREFIXES[status]} `

  if (status === 'watched') return `A regardé l'épisode ${progress ?? '?'} de `
  if (status === 'completed') return 'A terminé '
  if (status === 'rewatched') return 'A re-regardé '
  const raw = String(activity?.status ?? 'updated').replace(/_/g, ' ').toLowerCase()
  const normalized = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Mis à jour'
  return `${normalized} `
}

function getFavoriteAnimeTitle(anime: any): string {
  return anime?.title?.english ?? anime?.title?.romaji ?? 'Anime inconnu'
}

async function openAnimePage(animeId?: number | null) {
  if (!animeId) return
  await navigateTo(`/anime/${animeId}`)
}

async function openFavoriteAnimePage(animeId?: number | null) {
  if (!animeId || navigatingFavoriteAnimeId.value === animeId) return
  navigatingFavoriteAnimeId.value = animeId
  try {
    await nextTick()
    await waitForPaint()
    await openAnimePage(animeId)
  } catch (error) {
    navigatingFavoriteAnimeId.value = null
    throw error
  }
}

async function openActivityAnimePage(animeId?: number | null) {
  if (!animeId || navigatingActivityAnimeId.value === animeId) return
  navigatingActivityAnimeId.value = animeId
  try {
    await nextTick()
    await waitForPaint()
    await openAnimePage(animeId)
  } catch (error) {
    navigatingActivityAnimeId.value = null
    throw error
  }
}

function animeHref(animeId?: number | null): string {
  return animeId ? `/anime/${animeId}` : '#'
}

function handleAnimeLinkClick(event: MouseEvent, animeId?: number | null) {
  if (!animeId) {
    event.preventDefault()
    return
  }
  if (!shouldHandleClientNavigation(event)) return
  event.preventDefault()
  void openFavoriteAnimePage(animeId)
}

function handleActivityAnimeLinkClick(event: MouseEvent, animeId?: number | null) {
  if (!animeId) {
    event.preventDefault()
    return
  }
  if (!shouldHandleClientNavigation(event)) return
  event.preventDefault()
  void openActivityAnimePage(animeId)
}

function shouldHandleClientNavigation(event: MouseEvent): boolean {
  // Laisse le navigateur gerer ctrl/cmd/shift-click, clic milieu, etc.
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function waitForPaint(): Promise<void> {
  if (!import.meta.client) return Promise.resolve()
  // Attend un frame pour mesurer les tags une fois les styles appliques.
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function favoriteAnimeCoverSrc(anime: any): string {
  return getAnilistCoverSrc(anime?.coverImage as AnilistCoverImage | null, 'card')
}

function favoriteAnimeCoverSrcSet(anime: any): string | undefined {
  return getAnilistCoverSrcSet(anime?.coverImage as AnilistCoverImage | null, 'card')
}

function getFavoriteCharacterName(character: any): string {
  return character?.name?.full ?? character?.name?.userPreferred ?? 'Personnage inconnu'
}

function activityCoverSrc(activity: any): string {
  return getAnilistCoverSrc(activity?.media?.coverImage as AnilistCoverImage | null, 'thumb')
}

function activityCoverSrcSet(activity: any): string | undefined {
  return getAnilistCoverSrcSet(activity?.media?.coverImage as AnilistCoverImage | null, 'thumb')
}

const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
const authUserId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
const authUsername = computed(() => String(authRecord.value.anilist_username ?? ''))
// Cle de cache locale: change si l'utilisateur lie un autre compte AniList.
const authUserKey = computed(() => `${authUserId.value}:${authUsername.value}`)
const username = computed(() => authRecord.value.anilist_username ?? "Nom d'utilisateur")
const anilistIdDisplay = computed(() => authRecord.value.anilist_user_id ?? '-')
const avatarSrc = computed(() => authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
const bannerSrc = computed(() => authRecord.value.anilist_banner || '')
const joinedDisplay = computed(() => {
  const created = authRecord.value.created
  if (!created) return '-'
  const date = new Date(created)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
})

const topGenres = computed(() => genres.value.slice(0, 5))
const barGenres = computed(() => {
  if (!genres.value.length) return []
  // Ajoute un genre de plus que les tags visibles pour que le graphique garde du contexte.
  const visibleCount = visibleTopGenres.value.length || topGenres.value.length
  const limit = Math.min(visibleCount + 1, genres.value.length)
  return genres.value.slice(0, limit)
})
const visibleTopGenres = ref<{ genre: string; count: number }[]>([])
const genreTagsContainerRef = ref<HTMLElement | null>(null)
const genreMeasureRefs = ref<Record<string, HTMLElement | null>>({})
const hasFavoriteAnime = computed(() => favoriteAnime.value.length > 0)
const hasFavoriteCharacters = computed(() => favoriteCharacters.value.length > 0)
const barGenreTotal = computed(() => {
  const sum = barGenres.value.reduce((acc, item) => acc + item.count, 0)
  return sum || 1
})

const progressStep = computed(() => {
  // Les marqueurs s'adaptent au volume de la liste pour eviter une barre bloquee a 100.
  const perSegment = Math.max(10, Math.ceil((totalAnimes.value || 0) / 3))
  if (perSegment <= 25) return 25
  if (perSegment <= 50) return 50
  if (perSegment <= 100) return 100
  if (perSegment <= 250) return 250
  if (perSegment <= 500) return 500
  return Math.ceil(perSegment / 100) * 100
})

const progressMarkers = computed(() => [
  progressStep.value,
  progressStep.value * 2,
  progressStep.value * 3
])

const progressMax = computed(() => progressMarkers.value[2] || 1)
const progressFillPercent = computed(() => Math.min((totalAnimes.value / progressMax.value) * 100, 100).toFixed(2))

function setGenreMeasureRef(genreName: string): VNodeRef {
  return (el: Element | ComponentPublicInstance | null) => {
    // Vue peut fournir un HTMLElement direct ou l'instance du composant; on normalise les deux.
    if (el instanceof HTMLElement) {
      genreMeasureRefs.value[genreName] = el
      return
    }

    if (el && '$el' in el && el.$el instanceof HTMLElement) {
      genreMeasureRefs.value[genreName] = el.$el
      return
    }

    genreMeasureRefs.value[genreName] = null
  }
}
async function computeVisibleGenres() {
  if (isLoading.value) return
  await nextTick()
  const container = genreTagsContainerRef.value
  if (!container) {
    visibleTopGenres.value = topGenres.value
    return
  }
  const availableWidth = container.clientWidth
  const nextVisible: { genre: string; count: number }[] = []
  let used = 0
  // Mesure les tags dans l'ordre et s'arrete au premier qui ne rentre plus.
  for (const genre of topGenres.value) {
    const el = genreMeasureRefs.value[genre.genre]
    if (!el) continue
    const width = Math.ceil(el.offsetWidth)
    const gap = nextVisible.length > 0 ? 6 : 0
    if (used + gap + width <= availableWidth) {
      used += gap + width
      nextVisible.push(genre)
    } else {
      break
    }
  }
  visibleTopGenres.value = nextVisible
}

const handleGenreResize = () => {
  computeVisibleGenres()
}

const resetNavigationStates = () => {
  navigatingFavoriteAnimeId.value = null
  navigatingActivityAnimeId.value = null
}

const syncProfilePageData = async (
  options: {
    forceProfile?: boolean
    forceActivity?: boolean
  } = {}
) => {
  if (profileSyncPending.value) return
  if (!authUserId.value && !authUsername.value) return

  profileSyncPending.value = true
  try {
    // Les stats/favoris passent par le store; l'activite est paginee separement par la page.
    await profileStore.loadProfile(Boolean(options.forceProfile))

    if (options.forceActivity || !activityItems.value.length) {
      await resetActivityList()
    }

    await computeVisibleGenres()
  } finally {
    profileSyncPending.value = false
  }
}

const handlePageShow = async (event: PageTransitionEvent) => {
  resetNavigationStates()

  // Quand la page revient du bfcache, les donnees visuelles peuvent avoir besoin d'une resynchro.
  if (event.persisted || !activityItems.value.length) {
    await syncProfilePageData({ forceActivity: true })
  }
}

watch(topGenres, () => {
  computeVisibleGenres()
}, { deep: true })

watch(authUserKey, async (next, previous) => {
  if (!import.meta.client) return
  if (!authUserId.value && !authUsername.value) return

  const userChanged = next !== previous
  // Changement de compte AniList: on force stats et activite pour ne pas melanger deux profils.
  await syncProfilePageData({
    forceProfile: userChanged,
    forceActivity: userChanged || !activityItems.value.length
  })
})

onMounted(async () => {
  await syncProfilePageData({ forceActivity: true })
  window.addEventListener('resize', handleGenreResize, { passive: true })
  window.addEventListener('pageshow', handlePageShow)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleGenreResize)
  window.removeEventListener('pageshow', handlePageShow)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;600;700;900&family=Overpass+Mono:wght@600&family=Roboto:wght@400;500;800&display=swap');

.profile-page {
  min-height: 100vh;
  background: transparent;
  color: #fafafa;
}

.banner-wrap {
  width: 100%;
  height: clamp(230px, 28vw, 340px);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20, 30, 50, 0.95) 0%, rgba(10, 18, 35, 0.98) 100%);
}

.banner-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  image-rendering: auto;
  image-rendering: -webkit-optimize-contrast;
  z-index: 0;
}

.banner-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 70% 50%, rgba(61, 180, 242, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 40% 60% at 30% 60%, rgba(146, 86, 243, 0.15) 0%, transparent 60%);
}

.banner-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255, 255, 255, 0.012) 20px, rgba(255, 255, 255, 0.012) 21px);
}

.banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(5, 10, 20, 0.12) 0%,
    rgba(8, 12, 22, 0.34) 75%,
    rgba(8, 12, 22, 0.5) 100%
  );
}

.banner-wrap.has-image::after {
  display: none;
}

.banner-content {
  position: absolute;
  bottom: 0;
  left: clamp(16px, 2.4vw, 40px);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 18px;
}

.banner-meta {
  transform: translateY(-16px);
}

.banner-avatar {
  width: 132px;
  height: 132px;
  border-radius: 8px;
  background: transparent;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.banner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.banner-avatar svg {
  width: 46px;
  height: 46px;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1.2;
}

.banner-username {
  font-family: 'Overpass', sans-serif;
  font-size: clamp(30px, 3.6vw, 46px);
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
  margin-bottom: 0;
}

.banner-joined {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.3px;
  transform: translateY(-12px);
}

.page {
  width: min(100%, 1680px);
  margin: 0 auto;
  padding: 24px clamp(18px, 3vw, 64px) 80px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);
  gap: clamp(20px, 2.2vw, 34px);
  align-items: start;
}

.left,
.right {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel,
.stats-panel,
.info-panel {
  background: color-mix(in srgb, var(--kz-card-bg) 94%, #152232 6%);
  border: 1px solid var(--kz-border);
  border-radius: 2.5px;
}

.panel,
.stats-panel {
  padding: 16px;
}

.panel-title,
.activity-title {
  font-size: 13px;
  font-weight: 500;
  color: #9FADBD;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: block;
  text-transform: uppercase;
}

.info-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-row {
  min-height: 32px;
  background: var(--kz-soft-bg);
  border: 1px solid var(--kz-border);
  border-radius: 2.5px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #9FADBD;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.field-value {
  font-size: 12px;
  font-weight: 500;
  color: #fafafa;
  letter-spacing: 0.3px;
}

.genre-tags {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.genre-tags-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  left: -9999px;
  top: -9999px;
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.tag {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 14px;
  border-radius: 2.5px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #fafafa;
  letter-spacing: 0.3px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.07);
}

.tag-count {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
}

.genre-bar {
  height: 7px;
  display: flex;
  margin: 0 -16px;
  overflow: hidden;
  position: relative;
}

.genre-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.07), transparent 12%, transparent 88%, rgba(255, 255, 255, 0.05));
}

.gb {
  height: 100%;
  position: relative;
  transition: width 220ms ease, background-color 260ms ease;
}

.gb::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  background: rgba(11, 22, 34, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fafafa;
  font-size: 10px;
  line-height: 1.2;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  z-index: 4;
}

.gb:hover::after {
  opacity: 1;
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.fav-card {
  display: block;
  aspect-ratio: 2 / 3;
  border-radius: 5px;
  background: #0d1a27;
  overflow: hidden;
  position: relative;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.fav-card.is-clickable:focus-visible {
  outline: 2px solid #25A5F2;
  outline-offset: 2px;
}

.fav-card.is-loading {
  pointer-events: none;
}

.fav-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.fav-card.is-loading img {
  opacity: 0.28;
  transform: scale(1.04);
}
.fav-card::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  max-width: calc(100% - 10px);
  background: rgba(11, 22, 34, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fafafa;
  font-size: 10px;
  line-height: 1.2;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transition: opacity 0.16s ease;
  pointer-events: none;
  z-index: 2;
}
.fav-card:hover::after {
  opacity: 1;
}

.fav-card.is-loading::after {
  opacity: 0;
}

.fav-card-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(8, 14, 24, 0.56);
  color: #f0f7ff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  z-index: 3;
}

.fav-card-loader-spinner {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 2.5px solid rgba(255, 255, 255, 0.22);
  border-top-color: #25A5F2;
  animation: spin 0.75s linear infinite;
}

.fav-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a2a3a 0%, #0d1a27 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.15);
  font-size: 12px;
}

.stats-panel {
  padding: 18px 22px 20px;
}

.stats-row {
  display: flex;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
  align-items: stretch;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.stat + .stat {
  border-left: 1px solid rgba(255, 255, 255, 0.07);
  padding-left: 20px;
}

.stat-num {
  font-family: 'Overpass Mono', monospace;
  font-size: 26px;
  font-weight: 600;
  color: #25A5F2;
  display: block;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-lbl {
  font-size: 10px;
  font-weight: 500;
  color: #9FADBD;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.progress-markers {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.marker-num {
  font-size: 11px;
  color: #fff;
  letter-spacing: 0.5px;
}

.marker-tick {
  width: 1px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
}

.progress-track {
  height: 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #25A5F2;
  border-radius: 100px;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.a-item {
  background: color-mix(in srgb, var(--kz-card-bg) 92%, #0d1a27 8%);
  border: 1px solid var(--kz-border);
  border-radius: 2.5px;
  display: flex;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  min-height: 70px;
  margin-bottom: 8px;
}

.a-item.is-loading {
  border-color: rgba(37, 165, 242, 0.42);
}

.a-item:last-child {
  margin-bottom: 0;
}

.a-thumb {
  width: 54px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(31, 38, 49, 0.6);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  position: relative;
}

.a-thumb.is-clickable:focus-visible {
  outline: 2px solid #25A5F2;
  outline-offset: -2px;
}

.a-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.a-thumb.is-loading img {
  opacity: 0.3;
  transform: scale(1.04);
}

.thumb-ph {
  color: rgba(255, 255, 255, 0.15);
}

.a-thumb-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 14, 24, 0.56);
}

.a-thumb-spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.24);
  border-top-color: #25A5F2;
  animation: spin 0.75s linear infinite;
}

.a-body {
  flex: 1;
  padding: 11px 72px 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.a-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--kz-text-secondary);
  letter-spacing: 0.3px;
  line-height: 1.5;
}

.a-text a,
.a-title-link {
  color: #25A5F2;
  text-decoration: none;
  font-weight: 500;
}

.a-text a:hover,
.a-title-link:hover {
  text-decoration: underline;
}

.a-title-link {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

.a-title-link.is-loading {
  opacity: 0.72;
  pointer-events: none;
}

.a-date {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 10px;
  font-weight: 500;
  color: color-mix(in srgb, var(--kz-text-secondary) 70%, transparent);
  white-space: nowrap;
}

.activity-loading-more,
.activity-empty {
  margin-top: 10px;
  font-size: 12px;
  color: var(--kz-text-secondary);
  text-align: center;
}

.activity-load-more {
  margin-top: 10px;
  width: 100%;
  height: 36px;
  border-radius: 2.5px;
  border: 1px solid var(--kz-border);
  background: color-mix(in srgb, var(--kz-card-bg) 90%, #1c3348 10%);
  color: var(--kz-text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
}

.activity-load-more:hover:not(:disabled) {
  background: color-mix(in srgb, var(--kz-card-bg) 84%, #1f4f70 16%);
  color: #d9ebfa;
}

.activity-load-more:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.skeleton-pulse {
  animation: pulse 1.4s infinite;
}

.skeleton-text {
  min-width: 52px;
  min-height: 18px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 4px;
}

.skeleton-line {
  width: 80%;
  height: 11px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 3px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .page {
    padding-top: 18px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 700px) {
  .banner-wrap {
    height: 220px;
  }

  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .banner-meta {
    transform: none;
    padding-bottom: 12px;
  }

  .banner-avatar {
    width: 102px;
    height: 102px;
  }

  .banner-username {
    font-size: clamp(24px, 6vw, 32px);
    margin-bottom: 4px;
  }

  .banner-joined {
    font-size: 13px;
  }

  .genre-tags {
    justify-content: flex-start;
    flex-wrap: wrap;
    overflow: visible;
  }

  .fav-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .stat + .stat {
    border-left: 0;
    padding-left: 0;
  }

  .a-date {
    position: static;
    margin: 0 12px 10px auto;
  }

  .a-body {
    padding-right: 12px;
  }

}

@media (max-width: 520px) {
  .page {
    padding-left: 12px;
    padding-right: 12px;
  }

  .banner-content {
    left: 12px;
    right: 12px;
  }

  .genre-tags {
    gap: 5px;
  }

  .fav-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .a-item {
    min-height: 62px;
  }

  .a-thumb {
    width: 48px;
  }

  .a-text {
    font-size: 12px;
  }
}

@media (max-width: 420px) {
  .fav-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

[data-theme="winter"] .profile-page .banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(8, 12, 22, 0.2) 0%,
    rgba(8, 12, 22, 0.45) 75%,
    rgba(8, 12, 22, 0.58) 100%
  );
}

[data-theme="winter"] .profile-page .panel,
[data-theme="winter"] .profile-page .stats-panel,
[data-theme="winter"] .profile-page .info-panel {
  background: rgba(245, 250, 255, 0.9);
  border-color: rgba(32, 62, 92, 0.26);
}

[data-theme="winter"] .profile-page .field-row {
  background: rgba(232, 242, 251, 0.95);
  border-color: rgba(32, 62, 92, 0.22);
}

[data-theme="winter"] .profile-page .a-item {
  background: rgba(236, 245, 253, 0.95);
  border-color: rgba(32, 62, 92, 0.22);
}

[data-theme="winter"] .profile-page .field-label,
[data-theme="winter"] .profile-page .a-text,
[data-theme="winter"] .profile-page .a-date,
[data-theme="winter"] .profile-page .panel-title,
[data-theme="winter"] .profile-page .activity-title,
[data-theme="winter"] .profile-page .stat-lbl {
  color: #3b5c78;
}

[data-theme="winter"] .profile-page .field-value,
[data-theme="winter"] .profile-page .marker-num,
[data-theme="winter"] .profile-page .stat-num {
  color: #1f3f5f;
  text-shadow: none;
}

[data-theme="winter"] .profile-page .stat + .stat {
  border-left-color: rgba(32, 62, 92, 0.26);
}

[data-theme="winter"] .profile-page .stats-row {
  border-bottom-color: rgba(32, 62, 92, 0.24);
}

[data-theme="winter"] .profile-page .marker-tick {
  background: rgba(32, 62, 92, 0.6);
}

[data-theme="winter"] .profile-page .banner-username {
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.42);
}

[data-theme="winter"] .profile-page .a-text a,
[data-theme="winter"] .profile-page .a-title-link {
  color: #1d8ed8;
}

[data-theme="winter"] .profile-page .fav-card-loader {
  background: rgba(240, 247, 255, 0.72);
  color: #24415c;
}

[data-theme="winter"] .profile-page .fav-card-loader-spinner {
  border-color: rgba(36, 65, 92, 0.18);
  border-top-color: #1d8ed8;
}

[data-theme="winter"] .profile-page .a-thumb-loader {
  background: rgba(240, 247, 255, 0.72);
}

[data-theme="winter"] .profile-page .a-thumb-spinner {
  border-color: rgba(36, 65, 92, 0.18);
  border-top-color: #1d8ed8;
}

</style>

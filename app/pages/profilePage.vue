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
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


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

/**
 * Charge more activity.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif, peut écrire dans les journaux.
 */
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
    console.error("Échec du chargement de la page d'activité :", error)
    activityHasMore.value = false
  } finally {
    activityLoading.value = false
  }
}

/**
 * Réinitialise activity list.
 *
 * @returns Une promesse résolue une fois le traitement terminé.
 * @sideEffects modifie l'état réactif.
 */
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
/**
 * Retourne genre color.
 *
 * @param genre - Valeur utilisée par le traitement « get genre color ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? '#3db4f2'
}

/**
 * Calcule la valeur « time ago ».
 *
 * @param timestamp - Valeur utilisée par le traitement « time ago ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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

/**
 * Retourne activity title.
 *
 * @param activity - Valeur utilisée par le traitement « get activity title ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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

/**
 * Retourne activity prefix.
 *
 * @param activity - Valeur utilisée par le traitement « get activity prefix ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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

/**
 * Retourne favorite anime title.
 *
 * @param anime - Valeur utilisée par le traitement « get favorite anime title ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function getFavoriteAnimeTitle(anime: any): string {
  return anime?.title?.english ?? anime?.title?.romaji ?? 'Anime inconnu'
}

/**
 * Ouvre anime page.
 *
 * @param animeId - Valeur utilisée par le traitement « open anime page ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects Aucun effet de bord direct identifié.
 */
async function openAnimePage(animeId?: number | null) {
  if (!animeId) return
  await navigateTo(`/anime/${animeId}`)
}

/**
 * Ouvre favorite anime page.
 *
 * @param animeId - Valeur utilisée par le traitement « open favorite anime page ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
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

/**
 * Ouvre activity anime page.
 *
 * @param animeId - Valeur utilisée par le traitement « open activity anime page ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
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

/**
 * Calcule la valeur « anime href ».
 *
 * @param animeId - Valeur utilisée par le traitement « anime href ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function animeHref(animeId?: number | null): string {
  return animeId ? `/anime/${animeId}` : '#'
}

/**
 * Traite anime link click.
 *
 * @param event - Valeur utilisée par le traitement « handle anime link click ».
 * @param animeId - Valeur utilisée par le traitement « handle anime link click ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function handleAnimeLinkClick(event: MouseEvent, animeId?: number | null) {
  if (!animeId) {
    event.preventDefault()
    return
  }
  if (!shouldHandleClientNavigation(event)) return
  event.preventDefault()
  void openFavoriteAnimePage(animeId)
}

/**
 * Traite activity anime link click.
 *
 * @param event - Valeur utilisée par le traitement « handle activity anime link click ».
 * @param animeId - Valeur utilisée par le traitement « handle activity anime link click ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function handleActivityAnimeLinkClick(event: MouseEvent, animeId?: number | null) {
  if (!animeId) {
    event.preventDefault()
    return
  }
  if (!shouldHandleClientNavigation(event)) return
  event.preventDefault()
  void openActivityAnimePage(animeId)
}

/**
 * Calcule la valeur « should handle client navigation ».
 *
 * @param event - Valeur utilisée par le traitement « should handle client navigation ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function shouldHandleClientNavigation(event: MouseEvent): boolean {
  // Laisse le navigateur gérer ctrl/cmd/shift-click, clic milieu, etc.
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/**
 * Attend for paint.
 *
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function waitForPaint(): Promise<void> {
  if (!import.meta.client) return Promise.resolve()
  // Attend un frame pour mesurer les tags une fois les styles appliques.
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/**
 * Calcule la valeur « favorite anime cover src ».
 *
 * @param anime - Valeur utilisée par le traitement « favorite anime cover src ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function favoriteAnimeCoverSrc(anime: any): string {
  return getAnilistCoverSrc(anime?.coverImage as AnilistCoverImage | null, 'card')
}

/**
 * Calcule la valeur « favorite anime cover src set ».
 *
 * @param anime - Valeur utilisée par le traitement « favorite anime cover src set ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function favoriteAnimeCoverSrcSet(anime: any): string | undefined {
  return getAnilistCoverSrcSet(anime?.coverImage as AnilistCoverImage | null, 'card')
}

/**
 * Retourne favorite character name.
 *
 * @param character - Valeur utilisée par le traitement « get favorite character name ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function getFavoriteCharacterName(character: any): string {
  return character?.name?.full ?? character?.name?.userPreferred ?? 'Personnage inconnu'
}

/**
 * Calcule la valeur « activity cover src ».
 *
 * @param activity - Valeur utilisée par le traitement « activity cover src ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function activityCoverSrc(activity: any): string {
  return getAnilistCoverSrc(activity?.media?.coverImage as AnilistCoverImage | null, 'thumb')
}

/**
 * Calcule la valeur « activity cover src set ».
 *
 * @param activity - Valeur utilisée par le traitement « activity cover src set ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
function activityCoverSrcSet(activity: any): string | undefined {
  return getAnilistCoverSrcSet(activity?.media?.coverImage as AnilistCoverImage | null, 'thumb')
}

const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
const authUserId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
const authUsername = computed(() => String(authRecord.value.anilist_username ?? ''))
// Clé de cache locale: change si l'utilisateur lie un autre compte AniList.
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
  // Les marqueurs s'adaptent au volume de la liste pour éviter une barre bloquée à 100.
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

/**
 * Définit genre measure ref.
 *
 * @param genreName - Valeur utilisée par le traitement « set genre measure ref ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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
/**
 * Calcule visible genres.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
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

/**
 * Traite genre resize.
 *
 * @returns Aucune valeur.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const handleGenreResize = () => {
  computeVisibleGenres()
}

/**
 * Réinitialise navigation states.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const resetNavigationStates = () => {
  navigatingFavoriteAnimeId.value = null
  navigatingActivityAnimeId.value = null
}

/**
 * Synchronise profile page data.
 *
 * @param options - Valeur utilisée par le traitement « sync profile page data ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
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
    // Les stats/favoris passent par le store; l'activité est paginée séparément par la page.
    await profileStore.loadProfile(Boolean(options.forceProfile))

    if (options.forceActivity || !activityItems.value.length) {
      await resetActivityList()
    }

    await computeVisibleGenres()
  } finally {
    profileSyncPending.value = false
  }
}

/**
 * Traite page show.
 *
 * @param event - Valeur utilisée par le traitement « handle page show ».
 * @returns Une promesse résolue une fois le traitement terminé.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const handlePageShow = async (event: PageTransitionEvent) => {
  resetNavigationStates()

  // Quand la page revient du bfcache, les données visuelles peuvent avoir besoin d'une resynchro.
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
  // Changement de compte AniList: on force stats et activité pour ne pas mélanger deux profils.
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

<style scoped src="~/assets/css/pages/profilePage.css"></style>

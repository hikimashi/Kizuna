<template>
  <div class="anime-list-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="page">
      <aside class="sidebar">
        <label class="filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model.trim="searchTerm" type="text" placeholder="Filtrer">
        </label>

        <div>
          <div class="sidebar-section">Listes</div>
          <div class="list-links">
            <button
              v-for="item in listFilterItems"
              :key="item.key"
              class="list-link"
              :class="{ active: activeFilter === item.key }"
              type="button"
              @click="activeFilter = item.key"
            >
              {{ item.label }}
              <span class="list-count">{{ item.count }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="sidebar-section">Tri</div>
          <select v-model="sortBy" class="sort-select">
            <option value="title">Titre</option>
            <option value="score">Note</option>
            <option value="progress">Progression</option>
            <option value="updatedAt">Dernière mise à jour</option>
            <option value="startDate">Date de début</option>
          </select>
        </div>
      </aside>

      <section class="main">
        <div class="view-bar">
          <button class="view-btn" :class="{ active: viewMode === 'grid' }" type="button" title="Grille" @click="viewMode = 'grid'">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg>
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'list' }" type="button" title="Liste" @click="viewMode = 'list'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M9 6h13M9 12h13M9 18h13M4 6h.01M4 12h.01M4 18h.01" /></svg>
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'compact' }" type="button" title="Compacte" @click="viewMode = 'compact'">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" /></svg>
          </button>
        </div>

        <section v-if="selectedEntryId" class="editor-panel">
          <div class="editor-panel-media">
            <div class="editor-panel-thumb">
              <img
                v-if="selectedEntryCoverSrc"
                :src="selectedEntryCoverSrc"
                :srcset="selectedEntryCoverSrcSet"
                :alt="selectedEntryTitle"
                loading="lazy"
                decoding="async"
              >
              <div v-else class="anime-card-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              </div>
            </div>
            <div class="editor-panel-copy">
              <div class="editor-panel-label">Modifier l'entrée AniList</div>
              <div class="editor-panel-title">{{ selectedEntryTitle }}</div>
              <div class="editor-panel-subtitle">
                Progression {{ editProgress || '0' }} / {{ selectedEntryEpisodes ?? '?' }}
              </div>
            </div>
          </div>

          <div class="editor-panel-fields">
            <label class="editor-field">
              <span>Statut</span>
              <select v-model="editStatus" class="editor-input">
                <option v-for="status in STATUS_ORDER" :key="status" :value="status">
                  {{ STATUS_LABELS[status] }}
                </option>
              </select>
            </label>

            <label class="editor-field">
              <span>Progression</span>
              <input
                v-model="editProgress"
                class="editor-input"
                type="number"
                min="0"
                :max="selectedEntryEpisodes ?? undefined"
                inputmode="numeric"
              >
            </label>

            <label class="editor-field">
              <span>Note</span>
              <input
                v-model="editScore"
                class="editor-input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Sans note"
                inputmode="decimal"
              >
            </label>
          </div>

          <div class="editor-panel-actions">
            <button class="editor-btn editor-btn-muted" type="button" @click="closeEntryEditor">
              Annuler
            </button>
            <button class="editor-btn editor-btn-danger" type="button" :disabled="isDeletingEntry" @click="deleteSelectedEntry">
              {{ isDeletingEntry ? 'Suppression...' : 'Supprimer' }}
            </button>
            <button class="editor-btn editor-btn-primary" type="button" :disabled="isSavingEntry" @click="saveSelectedEntry">
              {{ isSavingEntry ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </section>

        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          Chargement de la liste...
        </div>

        <div v-else-if="errorMessage" class="error-state">
          {{ errorMessage }}
        </div>

        <div v-else-if="visibleSections.length === 0" class="empty-state">
          Aucun anime trouvé pour ce filtre.
        </div>

        <div v-else class="content" :class="`view-${viewMode}`">
          <div v-for="section in visibleSections" :key="section.key" class="anime-section">
            <div class="section-title">
              {{ section.label }}
              <span class="section-count">{{ section.items.length }}</span>
            </div>
            <div class="anime-grid">
              <article
                v-for="entry in section.items"
                :key="entry.id"
                class="anime-card"
                :class="{ 'is-selected': selectedEntryId === entry.id }"
                tabindex="0"
                role="button"
                @click="openEntryEditor(entry, section.key)"
                @keydown.enter.prevent="openEntryEditor(entry, section.key)"
                @keydown.space.prevent="openEntryEditor(entry, section.key)"
              >
                <img
                  v-if="coverImageSrc(entry)"
                  :src="coverImageSrc(entry)"
                  :srcset="coverImageSrcSet(entry)"
                  :alt="displayTitle(entry)"
                  loading="lazy"
                  decoding="async"
                >
                <div v-else class="anime-card-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                </div>
                <div class="status-dot" :class="statusDotClass(section.key)"></div>
                <div class="anime-card-score">{{ formatScore(entry.score) }}</div>
                <div class="anime-card-overlay">
                  <div class="anime-card-title" :title="displayTitle(entry)">{{ displayTitle(entry) }}</div>
                  <div class="anime-card-progress">{{ entry.progress }} / {{ entry.media.episodes ?? '?' }}</div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, unref } from 'vue'
import { useAlertStore } from '~/composables/useAlertStore'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage, type AnilistCoverVariant } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSync } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useToastStore } from '~/composables/useToastStore'

type ListStatusKey = 'CURRENT' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING'
type FilterKey = 'ALL' | ListStatusKey
type ViewMode = 'grid' | 'list' | 'compact'
type SortKey = 'title' | 'score' | 'progress' | 'updatedAt' | 'startDate'

type MediaListEntry = {
  id: number
  score: number
  progress: number
  updatedAt: number
  startedAt?: {
    year?: number | null
    month?: number | null
    day?: number | null
  } | null
  completedAt?: {
    year?: number | null
    month?: number | null
    day?: number | null
  } | null
  media: {
    id?: number | null
    episodes?: number | null
    title: {
      romaji?: string | null
      english?: string | null
      native?: string | null
    }
    coverImage?: AnilistCoverImage | null
  }
}

const STATUS_LABELS: Record<ListStatusKey, string> = {
  CURRENT: 'En cours',
  COMPLETED: 'Terminé',
  PAUSED: 'En pause',
  DROPPED: 'Abandonné',
  PLANNING: 'Prévu'
}

const STATUS_ORDER: ListStatusKey[] = ['CURRENT', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING']

const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const anilistSync = useAnilistSync()
const toastStore = useToastStore()
const alertStore = useAlertStore()

const isLoading = ref(true)
const errorMessage = ref('')
const viewMode = ref<ViewMode>('grid')
const activeFilter = ref<FilterKey>('ALL')
const sortBy = ref<SortKey>('title')
const searchTerm = ref('')
const selectedEntryId = ref<number | null>(null)
const selectedEntryTitle = ref('')
const selectedEntryCover = ref<AnilistCoverImage | null>(null)
const selectedEntryEpisodes = ref<number | null>(null)
const editStatus = ref<ListStatusKey>('CURRENT')
const editProgress = ref('0')
const editScore = ref('')
const isSavingEntry = ref(false)
const isDeletingEntry = ref(false)

const rawSections = ref<Record<ListStatusKey, MediaListEntry[]>>({
  CURRENT: [],
  COMPLETED: [],
  PAUSED: [],
  DROPPED: [],
  PLANNING: []
})

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))
const username = computed(() => String(authRecord.value.anilist_username ?? ''))
const profileTabs = [
  { key: 'anime-list', label: 'Liste d\'anime', to: '/animeList', active: true },
  { key: 'favorites', label: 'Favoris', to: '/favorites' },
  { key: 'friends', label: 'Amis', to: '/friends' },
  { key: 'shared-lists', label: 'Listes partagées', to: '/sharedLists' }
]

const displayTitle = (entry: MediaListEntry) =>
  entry.media.title.romaji || entry.media.title.english || entry.media.title.native || 'Titre inconnu'

const currentCoverVariant = computed<AnilistCoverVariant>(() =>
  viewMode.value === 'grid' ? 'card' : 'thumb'
)

const coverImageSrc = (entry: MediaListEntry) =>
  getAnilistCoverSrc(entry.media.coverImage, currentCoverVariant.value) || undefined

const coverImageSrcSet = (entry: MediaListEntry) =>
  getAnilistCoverSrcSet(entry.media.coverImage, currentCoverVariant.value)

const normalizeDate = (entry: MediaListEntry): number => {
  const y = entry.startedAt?.year ?? 0
  const m = entry.startedAt?.month ?? 0
  const d = entry.startedAt?.day ?? 0
  return y * 10000 + m * 100 + d
}

const formatScore = (score: number) => {
  if (!score) return '-'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const statusDotClass = (status: ListStatusKey) => {
  if (status === 'CURRENT') return 'dot-watching'
  if (status === 'COMPLETED') return 'dot-completed'
  if (status === 'PAUSED') return 'dot-paused'
  if (status === 'DROPPED') return 'dot-dropped'
  return 'dot-planned'
}

const listFilterItems = computed(() => {
  const allCount = STATUS_ORDER.reduce((sum, key) => sum + rawSections.value[key].length, 0)
  return [
    { key: 'ALL' as FilterKey, label: 'Toutes', count: allCount },
    ...STATUS_ORDER.map((key) => ({
      key: key as FilterKey,
      label: STATUS_LABELS[key],
      count: rawSections.value[key].length
    }))
  ]
})

const sortedAndFilteredSections = computed(() => {
  const needle = searchTerm.value.toLowerCase()
  const sorter = (a: MediaListEntry, b: MediaListEntry) => {
    if (sortBy.value === 'title') return displayTitle(a).localeCompare(displayTitle(b))
    if (sortBy.value === 'score') return (b.score || 0) - (a.score || 0)
    if (sortBy.value === 'progress') return (b.progress || 0) - (a.progress || 0)
    if (sortBy.value === 'startDate') return normalizeDate(b) - normalizeDate(a)
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  }

  return STATUS_ORDER.map((status) => {
    const baseItems = rawSections.value[status] ?? []
    const filtered = baseItems.filter((entry) => {
      if (!needle) return true
      return displayTitle(entry).toLowerCase().includes(needle)
    })
    return {
      key: status,
      label: STATUS_LABELS[status],
      items: [...filtered].sort(sorter)
    }
  })
})

const visibleSections = computed(() => {
  if (activeFilter.value === 'ALL') {
    return sortedAndFilteredSections.value.filter((section) => section.items.length > 0)
  }
  const selected = sortedAndFilteredSections.value.find((section) => section.key === activeFilter.value)
  if (!selected || selected.items.length === 0) return []
  return [selected]
})

const openEntryEditor = (entry: MediaListEntry, status: ListStatusKey) => {
  selectedEntryId.value = entry.id
  selectedEntryTitle.value = displayTitle(entry)
  selectedEntryCover.value = entry.media.coverImage || null
  selectedEntryEpisodes.value = entry.media.episodes ?? null
  editStatus.value = status
  editProgress.value = String(entry.progress ?? 0)
  editScore.value = entry.score ? String(entry.score) : ''
}

const selectedEntryCoverSrc = computed(() =>
  getAnilistCoverSrc(selectedEntryCover.value, 'thumb')
)

const selectedEntryCoverSrcSet = computed(() =>
  getAnilistCoverSrcSet(selectedEntryCover.value, 'thumb')
)

const closeEntryEditor = () => {
  selectedEntryId.value = null
  selectedEntryTitle.value = ''
  selectedEntryCover.value = null
  selectedEntryEpisodes.value = null
  editStatus.value = 'CURRENT'
  editProgress.value = '0'
  editScore.value = ''
}

const saveSelectedEntry = async () => {
  if (!selectedEntryId.value || isSavingEntry.value) return

  try {
    isSavingEntry.value = true
    await anilistSync.saveEntry({
      entryId: selectedEntryId.value,
      status: editStatus.value,
      progress: editProgress.value === '' ? 0 : Number(editProgress.value),
      score: editScore.value === '' ? null : Number(editScore.value)
    })
    await fetchAnimeList()
    toastStore.openToast({ type: 'success', message: "L'entrée AniList a été mise à jour." })
    closeEntryEditor()
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || "Impossible de mettre à jour l'entrée AniList." })
  } finally {
    isSavingEntry.value = false
  }
}

const deleteSelectedEntry = async () => {
  if (!selectedEntryId.value || isDeletingEntry.value) return

  const confirmed = await alertStore.openAlert({
    type: 'warning',
    message: `Supprimer "${selectedEntryTitle.value}" de votre liste AniList ?`
  })
  if (!confirmed) return

  try {
    isDeletingEntry.value = true
    await anilistSync.deleteEntry(selectedEntryId.value)
    await fetchAnimeList()
    toastStore.openToast({ type: 'success', message: "L'entrée AniList a été supprimée." })
    closeEntryEditor()
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || "Impossible de supprimer l'entrée AniList." })
  } finally {
    isDeletingEntry.value = false
  }
}

const fetchAnimeList = async () => {
  if (!token.value || !username.value) {
    errorMessage.value = 'Compte AniList non lié. Reconnectez-le dans les paramètres.'
    isLoading.value = false
    return
  }

  const query = `
    query ($userName: String) {
      MediaListCollection(userName: $userName, type: ANIME, sort: UPDATED_TIME_DESC) {
        lists {
          status
          entries {
            id
            score
            progress
            updatedAt
            startedAt {
              year
              month
              day
            }
            completedAt {
              year
              month
              day
            }
            media {
              id
              episodes
              title {
                romaji
                english
                native
              }
              coverImage {
                medium
                large
                extraLarge
              }
            }
          }
        }
      }
    }
  `

  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await anilistGraphql.request<any>(
      query,
      { userName: username.value },
      { token: token.value, cacheTtlMs: 30_000 }
    )

    if (response?.errors?.length) {
      throw new Error(response.errors[0]?.message || 'Impossible de charger la liste.')
    }

    const nextSections: Record<ListStatusKey, MediaListEntry[]> = {
      CURRENT: [],
      COMPLETED: [],
      PAUSED: [],
      DROPPED: [],
      PLANNING: []
    }

    const lists = response?.data?.MediaListCollection?.lists ?? []
    for (const list of lists) {
      const key = list?.status as ListStatusKey
      if (!STATUS_ORDER.includes(key)) continue
      const entries = Array.isArray(list.entries) ? list.entries : []
      nextSections[key].push(...entries)
    }

    rawSections.value = nextSections
  } catch (error: any) {
    errorMessage.value = error?.message || "Impossible de charger la liste d'animes."
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAnimeList)
</script>

<style scoped src="~/assets/css/pages/animeList.css"></style>

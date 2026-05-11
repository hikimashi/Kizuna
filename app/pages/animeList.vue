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
            <option value="updatedAt">Derniere mise a jour</option>
            <option value="startDate">Date de debut</option>
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

        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          Chargement de la liste...
        </div>

        <div v-else-if="errorMessage" class="error-state">
          {{ errorMessage }}
        </div>

        <div v-else-if="visibleSections.length === 0" class="empty-state">
          Aucun anime trouve pour ce filtre.
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

    <Teleport to="body">
      <div
        v-if="isEditorModalOpen"
        class="anime-editor-modal-layer"
        @click.self="closeEntryEditor"
      >
        <div class="anime-editor-modal" role="dialog" aria-modal="true" aria-labelledby="anime-editor-title">
          <div class="anime-editor-head">
            <div class="anime-editor-media">
              <div class="anime-editor-thumb">
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
              <div class="anime-editor-copy">
                <div class="anime-editor-kicker">Modifier l'entree AniList</div>
                <h2 id="anime-editor-title" class="anime-editor-title">{{ selectedEntryTitle }}</h2>
                <div class="anime-editor-subtitle">
                  Progression {{ editProgress || '0' }} / {{ selectedEntryEpisodes ?? '?' }}
                </div>
              </div>
            </div>
            <button class="anime-editor-close" type="button" aria-label="Fermer" @click="closeEntryEditor">
              X
            </button>
          </div>

          <div class="anime-editor-fields">
            <label class="anime-editor-field">
              <span>Statut</span>
              <select v-model="editStatus" class="anime-editor-input">
                <option v-for="status in STATUS_ORDER" :key="status" :value="status">
                  {{ STATUS_LABELS[status] }}
                </option>
              </select>
            </label>

            <label class="anime-editor-field">
              <span>Progression</span>
              <input
                v-model="editProgress"
                class="anime-editor-input"
                type="number"
                min="0"
                :max="selectedEntryEpisodes ?? undefined"
                inputmode="numeric"
              >
            </label>

            <label class="anime-editor-field">
              <span>Note</span>
              <input
                v-model="editScore"
                class="anime-editor-input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Sans note"
                inputmode="decimal"
              >
            </label>
          </div>

          <div class="anime-editor-quick-actions">
            <button class="editor-btn editor-btn-blue" type="button" @click="openSelectedAnimeInfo">
              Voir la fiche anime
            </button>
            <button
              class="editor-btn editor-btn-blue"
              type="button"
              :disabled="isSharedListsLoading || isAddingToSharedList"
              @click="toggleSharedListPicker"
            >
              {{ showSharedListPicker ? 'Fermer les listes' : 'Ajouter a une liste' }}
            </button>
          </div>

          <div v-if="showSharedListPicker" class="anime-editor-list-picker">
            <div v-if="isSharedListsLoading" class="anime-editor-list-picker-state">
              Chargement des listes...
            </div>
            <div v-else-if="sharedListOptions.length === 0" class="anime-editor-list-picker-state">
              Aucune liste partagee disponible.
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

          <div class="anime-editor-actions">
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
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useAlertStore } from '~/composables/useAlertStore'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage, type AnilistCoverVariant } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSync } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useSharedLists, type SharedListSummary } from '~/composables/useSharedLists'
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
  COMPLETED: 'Termine',
  PAUSED: 'En pause',
  DROPPED: 'Abandonne',
  PLANNING: 'Prevu'
}

const STATUS_ORDER: ListStatusKey[] = ['CURRENT', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING']

const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const anilistSync = useAnilistSync()
const toastStore = useToastStore()
const alertStore = useAlertStore()
const sharedListsStore = useSharedLists()

const isLoading = ref(true)
const errorMessage = ref('')
const viewMode = ref<ViewMode>('grid')
const activeFilter = ref<FilterKey>('ALL')
const sortBy = ref<SortKey>('title')
const searchTerm = ref('')
const selectedEntryId = ref<number | null>(null)
const selectedEntryMediaId = ref(0)
const selectedEntryTitle = ref('')
const selectedEntryCover = ref<AnilistCoverImage | null>(null)
const selectedEntryEpisodes = ref<number | null>(null)
const editStatus = ref<ListStatusKey>('CURRENT')
const editProgress = ref('0')
const editScore = ref('')
const isSavingEntry = ref(false)
const isDeletingEntry = ref(false)
const isSharedListsLoading = ref(false)
const isAddingToSharedList = ref(false)
const sharedListError = ref('')
const showSharedListPicker = ref(false)
const sharedLists = ref<SharedListSummary[]>([])

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
  { key: 'shared-lists', label: 'Listes partagees', to: '/sharedLists' }
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

const isEditorModalOpen = computed(() => selectedEntryId.value !== null)

const selectedEntryCoverSrc = computed(() =>
  getAnilistCoverSrc(selectedEntryCover.value, 'thumb')
)

const selectedEntryCoverSrcSet = computed(() =>
  getAnilistCoverSrcSet(selectedEntryCover.value, 'thumb')
)

const sharedListOptions = computed(() =>
  sharedLists.value.filter(list => list.isOwner || list.isMember)
)

const ensureSharedListsLoaded = async () => {
  if (isSharedListsLoading.value) return
  if (sharedLists.value.length > 0) return

  try {
    isSharedListsLoading.value = true
    sharedListError.value = ''
    sharedLists.value = await sharedListsStore.loadSummaries()
  } catch (error: any) {
    sharedLists.value = []
    sharedListError.value = error?.message || 'Impossible de charger vos listes partagees.'
  } finally {
    isSharedListsLoading.value = false
  }
}

const openEntryEditor = (entry: MediaListEntry, status: ListStatusKey) => {
  selectedEntryId.value = entry.id
  selectedEntryMediaId.value = Number(entry.media.id || 0)
  selectedEntryTitle.value = displayTitle(entry)
  selectedEntryCover.value = entry.media.coverImage || null
  selectedEntryEpisodes.value = entry.media.episodes ?? null
  editStatus.value = status
  editProgress.value = String(entry.progress ?? 0)
  editScore.value = entry.score ? String(entry.score) : ''
  sharedListError.value = ''
  showSharedListPicker.value = false
}

const closeEntryEditor = () => {
  selectedEntryId.value = null
  selectedEntryMediaId.value = 0
  selectedEntryTitle.value = ''
  selectedEntryCover.value = null
  selectedEntryEpisodes.value = null
  editStatus.value = 'CURRENT'
  editProgress.value = '0'
  editScore.value = ''
  showSharedListPicker.value = false
  sharedListError.value = ''
}

const openSelectedAnimeInfo = () => {
  if (!selectedEntryMediaId.value) return
  navigateTo(`/anime/${selectedEntryMediaId.value}`)
}

const toggleSharedListPicker = async () => {
  if (showSharedListPicker.value) {
    showSharedListPicker.value = false
    return
  }
  await ensureSharedListsLoaded()
  showSharedListPicker.value = true
}

const addSelectedAnimeToSharedList = async (listId: string) => {
  if (!selectedEntryMediaId.value || !listId || isAddingToSharedList.value) return

  const progress = editProgress.value === '' ? 0 : Number(editProgress.value)
  const score = editScore.value === '' ? 0 : Number(editScore.value)

  try {
    isAddingToSharedList.value = true
    sharedListError.value = ''
    await sharedListsStore.addAnimeToList(listId, {
      mediaId: selectedEntryMediaId.value,
      title: selectedEntryTitle.value,
      fetchLink: `/anime/${selectedEntryMediaId.value}`,
      status: editStatus.value,
      progress: Number.isFinite(progress) ? progress : 0,
      score: Number.isFinite(score) ? score : 0
    })
    toastStore.openToast({ type: 'success', message: "L'anime a ete ajoute a la liste partagee." })
    showSharedListPicker.value = false
  } catch (error: any) {
    sharedListError.value = error?.message || "Impossible d'ajouter cet anime a la liste partagee."
  } finally {
    isAddingToSharedList.value = false
  }
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
    toastStore.openToast({ type: 'success', message: "L'entree AniList a ete mise a jour." })
    closeEntryEditor()
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || "Impossible de mettre a jour l'entree AniList." })
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
    toastStore.openToast({ type: 'success', message: "L'entree AniList a ete supprimee." })
    closeEntryEditor()
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || "Impossible de supprimer l'entree AniList." })
  } finally {
    isDeletingEntry.value = false
  }
}

watch([editStatus, selectedEntryEpisodes], () => {
  if (editStatus.value !== 'COMPLETED') return
  const episodes = Number(selectedEntryEpisodes.value || 0) || 0
  if (!episodes) return
  editProgress.value = String(episodes)
})

const handleEditorKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isEditorModalOpen.value) return
  closeEntryEditor()
}

const fetchAnimeList = async () => {
  if (!token.value || !username.value) {
    errorMessage.value = 'Compte AniList non lie. Reconnectez-le dans les parametres.'
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
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleEditorKeydown)
  }
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleEditorKeydown)
  }
})
</script>

<style scoped src="~/assets/css/pages/animeList.css"></style>
<style scoped>
.anime-editor-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(7, 12, 20, 0.72);
  backdrop-filter: blur(14px);
}

.anime-editor-modal {
  width: min(760px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(13, 18, 31, 0.98) 0%, rgba(8, 12, 22, 0.98) 100%);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
  padding: 24px;
}

.anime-editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.anime-editor-media {
  display: flex;
  gap: 18px;
  min-width: 0;
}

.anime-editor-thumb {
  width: 92px;
  height: 128px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  flex: 0 0 auto;
}

.anime-editor-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anime-editor-copy {
  min-width: 0;
}

.anime-editor-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(173, 216, 255, 0.72);
  margin-bottom: 8px;
}

.anime-editor-title {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.15;
  color: #f8fbff;
}

.anime-editor-subtitle {
  margin-top: 10px;
  color: rgba(224, 233, 245, 0.78);
}

.anime-editor-close {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
  cursor: pointer;
  flex: 0 0 auto;
}

.anime-editor-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.anime-editor-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(232, 239, 248, 0.92);
}

.anime-editor-input {
  width: 100%;
  min-height: 46px;
  appearance: none;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(19, 28, 44, 0.92);
  color: #f8fbff;
  padding: 0 14px;
}

select.anime-editor-input option {
  background: #0f1724;
  color: #f8fbff;
}

.anime-editor-quick-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.anime-editor-inline-error {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.24);
  color: #ffd7d7;
}

.anime-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.editor-btn-blue {
  background: linear-gradient(135deg, #3db4f2 0%, #1d8fe1 100%);
  color: #04111d;
}

.anime-editor-list-picker {
  margin-top: 16px;
}

.anime-editor-list-picker-state {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(232, 239, 248, 0.82);
}

.anime-editor-list-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.anime-editor-list-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid rgba(61, 180, 242, 0.24);
  border-radius: 16px;
  background: rgba(61, 180, 242, 0.12);
  color: #f8fbff;
  text-align: left;
  cursor: pointer;
}

.anime-editor-list-option-title {
  font-weight: 700;
}

.anime-editor-list-option-meta {
  color: rgba(224, 233, 245, 0.76);
  font-size: 0.92rem;
}

@media (max-width: 720px) {
  .anime-editor-modal-layer {
    padding: 12px;
  }

  .anime-editor-modal {
    padding: 18px;
    border-radius: 22px;
  }

  .anime-editor-media,
  .anime-editor-quick-actions,
  .anime-editor-actions {
    flex-direction: column;
  }

  .anime-editor-fields {
    grid-template-columns: 1fr;
  }

  .anime-editor-list-grid {
    grid-template-columns: 1fr;
  }

  .anime-editor-close {
    width: 36px;
    height: 36px;
  }
}
</style>

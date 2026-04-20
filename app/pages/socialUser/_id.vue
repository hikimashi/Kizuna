<template>
  <div class="anime-list-page friend-profile-page">
    <section class="banner-wrap" :class="{ 'has-image': Boolean(bannerUrl) }">
      <img v-if="bannerUrl" :src="bannerUrl" alt="" class="banner-image">
      <div class="banner-content">
        <div class="banner-avatar">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="friendName || 'AniList avatar'">
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="8.5" r="4" />
            <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <div class="banner-meta">
          <div class="banner-username">{{ friendName || 'Friend' }}</div>
          <div class="banner-joined">Joined {{ joinedDisplay }}</div>
        </div>
      </div>
    </section>

    <div class="sub-tabs-bar">
      <div class="sub-tabs">
        <button class="sub-tab active" type="button">{{ friendName || 'Friend' }} Anime List</button>
        <NuxtLink class="sub-tab" :to="`/social/compare/${$route.params.id}`">Compare List</NuxtLink>
        <button class="sub-tab" type="button" disabled>Favorites</button>
        <button class="sub-tab" type="button" disabled>Friends</button>
        <button class="sub-tab" type="button" disabled>Shared Lists</button>
      </div>
    </div>

    <div class="page">
      <aside class="sidebar">
        <label class="filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model.trim="searchTerm" type="text" placeholder="Filter">
        </label>

        <div>
          <div class="sidebar-section">Lists</div>
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
          <div class="sidebar-section">Sort</div>
          <select v-model="sortBy" class="sort-select">
            <option value="title">Title</option>
            <option value="score">Score</option>
            <option value="progress">Progress</option>
            <option value="updatedAt">Last updated</option>
            <option value="startDate">Start date</option>
          </select>
        </div>
      </aside>

      <section class="main">
        <div class="view-bar">
          <div class="compare-box">
            <button class="compare-btn" type="button" @click="goToCompare">
              Compare list
            </button>
          </div>
          <button class="view-btn" :class="{ active: viewMode === 'grid' }" type="button" title="Grid" @click="viewMode = 'grid'">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg>
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'list' }" type="button" title="List" @click="viewMode = 'list'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M9 6h13M9 12h13M9 18h13M4 6h.01M4 12h.01M4 18h.01" /></svg>
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'compact' }" type="button" title="Compact" @click="viewMode = 'compact'">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" /></svg>
          </button>
        </div>

        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          Loading list...
        </div>

        <div v-else-if="errorMessage" class="error-state">
          {{ errorMessage }}
        </div>

        <div v-else-if="visibleSections.length === 0" class="empty-state">
          No anime found for this filter.
        </div>

        <div v-else class="content" :class="`view-${viewMode}`">
          <div v-for="section in visibleSections" :key="section.key" class="anime-section">
            <div class="section-title">
              {{ section.label }}
              <span class="section-count">{{ section.items.length }}</span>
            </div>
            <div class="anime-grid">
              <article v-for="entry in section.items" :key="entry.id" class="anime-card">
                <img v-if="coverImageSrc(entry)" :src="coverImageSrc(entry)" :alt="displayTitle(entry)">
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
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

// Cette page affiche la liste anime publique d'un autre utilisateur AniList.
// Elle reprend une logique proche de la liste perso, mais en lecture seule.

definePageMeta({
  path: '/social/user/:id'
})

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
    id: number
    episodes?: number | null
    title: {
      romaji?: string | null
      english?: string | null
      native?: string | null
    }
    coverImage?: {
      medium?: string | null
      large?: string | null
    } | null
  }
}

const STATUS_LABELS: Record<ListStatusKey, string> = {
  CURRENT: 'Watching',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
  DROPPED: 'Dropped',
  PLANNING: 'Planned'
}

const STATUS_ORDER: ListStatusKey[] = ['CURRENT', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING']

const route = useRoute()
const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()

const isLoading = ref(true)
const errorMessage = ref('')
const viewMode = ref<ViewMode>('grid')
const activeFilter = ref<FilterKey>('ALL')
const sortBy = ref<SortKey>('title')
const searchTerm = ref('')

const friendName = ref('')
const avatarUrl = ref('')
const bannerUrl = ref('')
const friendJoinedAt = ref<number | null>(null)

const rawSections = ref<Record<ListStatusKey, MediaListEntry[]>>({
  CURRENT: [],
  COMPLETED: [],
  PAUSED: [],
  DROPPED: [],
  PLANNING: []
})

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))
const friendUserId = computed(() => Number(route.params.id ?? 0))

const displayTitle = (entry: MediaListEntry) =>
  entry.media.title.romaji || entry.media.title.english || entry.media.title.native || 'Unknown title'

const coverImageSrc = (entry: MediaListEntry) =>
  entry.media.coverImage?.large || entry.media.coverImage?.medium || undefined

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

const formatJoined = (timestamp?: number | null) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

const joinedDisplay = computed(() => formatJoined(friendJoinedAt.value))

const statusDotClass = (status: ListStatusKey) => {
  if (status === 'CURRENT') return 'dot-watching'
  if (status === 'COMPLETED') return 'dot-completed'
  if (status === 'PAUSED') return 'dot-paused'
  if (status === 'DROPPED') return 'dot-dropped'
  return 'dot-planned'
}

const listFilterItems = computed(() => {
  // Compteurs de la sidebar, derives directement des sections chargees.
  const allCount = STATUS_ORDER.reduce((sum, key) => sum + rawSections.value[key].length, 0)
  return [
    { key: 'ALL' as FilterKey, label: 'All', count: allCount },
    ...STATUS_ORDER.map((key) => ({
      key: key as FilterKey,
      label: STATUS_LABELS[key],
      count: rawSections.value[key].length
    }))
  ]
})

const sortedAndFilteredSections = computed(() => {
  const needle = searchTerm.value.toLowerCase()
  // On applique le filtre texte puis le tri selectionne.
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

const mapListsToSections = (lists: any[]) => {
  // AniList renvoie des groupes par statut ; on les convertit vers notre structure locale.
  const nextSections: Record<ListStatusKey, MediaListEntry[]> = {
    CURRENT: [],
    COMPLETED: [],
    PAUSED: [],
    DROPPED: [],
    PLANNING: []
  }

  for (const list of lists ?? []) {
    const key = list?.status as ListStatusKey
    if (!STATUS_ORDER.includes(key)) continue
    const entries = Array.isArray(list.entries) ? list.entries : []
    nextSections[key].push(...entries)
  }

  return nextSections
}

const fetchFriendProfileAndList = async () => {
  // Charge en parallele :
  // - le profil de l'ami,
  // - sa liste anime complete.
  if (!friendUserId.value) {
    errorMessage.value = 'Invalid friend profile.'
    isLoading.value = false
    return
  }

  const profileQuery = `
    query ($userId: Int) {
      User(id: $userId) {
        id
        name
        createdAt
        avatar { medium large }
        bannerImage
      }
    }
  `

  const listQuery = `
    query ($userId: Int) {
      MediaListCollection(userId: $userId, type: ANIME, sort: UPDATED_TIME_DESC) {
        lists {
          status
          entries {
            id
            score
            progress
            updatedAt
            startedAt { year month day }
            media {
              id
              episodes
              title { romaji english native }
              coverImage { medium large }
            }
          }
        }
      }
    }
  `

  try {
    isLoading.value = true
    errorMessage.value = ''

    const [profileRes, listRes] = await Promise.all([
      anilistGraphql.request<any>(profileQuery, { userId: friendUserId.value }, { token: token.value, skipCache: true }),
      anilistGraphql.request<any>(listQuery, { userId: friendUserId.value }, { token: token.value, skipCache: true })
    ])

    if (profileRes?.errors?.length) throw new Error(profileRes.errors[0]?.message || 'Unable to load friend profile')
    if (listRes?.errors?.length) throw new Error(listRes.errors[0]?.message || 'Unable to load friend list')

    const user = profileRes?.data?.User
    friendName.value = user?.name || 'Friend'
    avatarUrl.value = user?.avatar?.large || user?.avatar?.medium || ''
    bannerUrl.value = user?.bannerImage || ''
    friendJoinedAt.value = Number(user?.createdAt || 0) || null

    const lists = listRes?.data?.MediaListCollection?.lists ?? []
    rawSections.value = mapListsToSections(lists)
  } catch (error: any) {
    errorMessage.value = error?.message || 'Unable to load friend anime list.'
  } finally {
    isLoading.value = false
  }
}

const goToCompare = () => {
  // Navigation rapide vers la comparaison avec ce profil.
  if (!friendUserId.value) return
  navigateTo(`/social/compare/${friendUserId.value}`)
}

onMounted(fetchFriendProfileAndList)
</script>

<style scoped src="~/assets/css/pages/animeList.css"></style>

<style scoped>
.friend-profile-page .banner-wrap {
  width: 100%;
  height: clamp(230px, 28vw, 340px);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20, 30, 50, 0.95) 0%, rgba(10, 18, 35, 0.98) 100%);
}

.friend-profile-page .banner-image {
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

.friend-profile-page .banner-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 70% 50%, rgba(61, 180, 242, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 40% 60% at 30% 60%, rgba(146, 86, 243, 0.15) 0%, transparent 60%);
}

.friend-profile-page .banner-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255, 255, 255, 0.012) 20px, rgba(255, 255, 255, 0.012) 21px);
}

.friend-profile-page .banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(5, 10, 20, 0.12) 0%,
    rgba(8, 12, 22, 0.34) 75%,
    rgba(8, 12, 22, 0.5) 100%
  );
}

.friend-profile-page .banner-wrap.has-image::after {
  display: none;
}

.friend-profile-page .banner-content {
  position: absolute;
  bottom: 0;
  left: clamp(16px, 2.4vw, 40px);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 18px;
}

.friend-profile-page .banner-meta {
  transform: translateY(-16px);
}

.friend-profile-page .banner-avatar {
  position: relative;
  left: auto;
  bottom: auto;
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
  z-index: 2;
}

.friend-profile-page .banner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.friend-profile-page .banner-avatar svg {
  width: 46px;
  height: 46px;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1.2;
}

.friend-profile-page .banner-username {
  font-family: 'Overpass', sans-serif;
  font-size: clamp(30px, 3.6vw, 46px);
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
  margin-bottom: 0;
}

.friend-profile-page .banner-joined {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.3px;
  transform: translateY(-12px);
}

.compare-box {
  margin-right: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.compare-btn {
  height: 30px;
  border-radius: 5px;
  border: 1px solid rgba(61, 180, 242, 0.35);
  background: rgba(61, 180, 242, 0.12);
  color: #3db4f2;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
}

.compare-btn:hover:not(:disabled) {
  background: rgba(61, 180, 242, 0.22);
}

.compare-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

[data-theme="winter"] .compare-btn {
  background: rgba(61, 180, 242, 0.2);
  border-color: rgba(61, 180, 242, 0.42);
  color: #1f88cb;
}

@media (max-width: 700px) {
  .friend-profile-page .banner-wrap {
    height: 220px;
  }

  .friend-profile-page .banner-content {
    gap: 14px;
  }

  .friend-profile-page .banner-avatar {
    left: auto;
    bottom: auto;
    width: 102px;
    height: 102px;
  }

  .friend-profile-page .banner-username {
    font-size: clamp(24px, 6vw, 32px);
    margin-bottom: 4px;
  }

  .friend-profile-page .banner-joined {
    font-size: 13px;
  }
}

[data-theme="winter"] .friend-profile-page .banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(8, 12, 22, 0.2) 0%,
    rgba(8, 12, 22, 0.45) 75%,
    rgba(8, 12, 22, 0.58) 100%
  );
}

[data-theme="winter"] .friend-profile-page .banner-username {
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.42);
}
</style>

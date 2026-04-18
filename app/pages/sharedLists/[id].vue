<template>
  <div class="shared-list-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="shared-list-shell">
      <nav class="shared-breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/profilePage">Profile</NuxtLink>
        <span>/</span>
        <NuxtLink to="/sharedLists">Shared Lists</NuxtLink>
        <span>/</span>
        <span>{{ detail?.title || 'Shared group' }}</span>
      </nav>

      <div v-if="isLoading" class="status-card">
        Loading group...
      </div>

      <div v-else-if="loadError" class="status-card error">
        {{ loadError }}
      </div>

      <template v-else-if="detail">
        <section class="group-hero">
          <div class="hero-overlay"></div>

          <div class="hero-top">
            <button class="back-btn" type="button" @click="navigateTo('/sharedLists')">
              <span aria-hidden="true">‹</span>
              Back to Shared Groups
            </button>

            <div class="hero-actions">
              <template v-if="detail.isOwner">
                <template v-if="isEditingMeta">
                  <select v-model="editPrivacy" class="meta-select">
                    <option value="friends">Friends only</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                  <button class="ghost-btn" type="button" @click="cancelMetaEdit">Cancel</button>
                  <button class="primary-btn" type="button" :disabled="isSavingMeta" @click="saveMeta">
                    {{ isSavingMeta ? 'Saving...' : 'Save' }}
                  </button>
                </template>
                <template v-else>
                  <button class="ghost-btn" type="button" @click="startMetaEdit">Edit group</button>
                  <button class="danger-btn" type="button" :disabled="isDeleting" @click="deleteGroup">
                    {{ isDeleting ? 'Deleting...' : 'Delete group' }}
                  </button>
                </template>
              </template>

              <template v-else>
                <button class="danger-btn" type="button" :disabled="isLeaving" @click="leaveGroup">
                  {{ isLeaving ? 'Leaving...' : 'Leave group' }}
                </button>
              </template>
            </div>
          </div>

          <div class="hero-head">
            <div class="group-cover" :style="{ background: coverGradient }">
              <span>{{ coverLabel }}</span>
            </div>

            <div class="group-copy">
              <div class="group-title-row">
                <template v-if="detail.isOwner && isEditingMeta">
                  <input v-model.trim="editName" class="title-input" maxlength="20" />
                </template>
                <template v-else>
                  <h1>{{ detail.title }}</h1>
                </template>
              </div>

              <div class="group-meta">
                <span class="group-badge" :class="editPrivacy === 'private' ? 'private' : ''">
                  {{ privacyLabel(editPrivacy) }}
                </span>
                <span>{{ detail.memberCount }} member<span v-if="detail.memberCount > 1">s</span></span>
                <span>{{ detail.animeCount }} anime</span>
                <span>{{ detail.updatedLabel }}</span>
                <span class="role-accent">{{ detail.isOwner ? 'Owner' : 'Member' }}</span>
              </div>

              <p class="group-description">
                Owned by {{ detail.ownerName }}. {{ detail.animeCount }} anime currently in the group list.
              </p>
            </div>
          </div>
        </section>

        <div v-if="actionError" class="status-card error inline-error">{{ actionError }}</div>

        <section class="tabs-wrap">
          <div class="tabs-nav">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              type="button"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </section>

        <section v-if="activeTab === 'anime'" class="content-section">
          <div class="toolbar">
            <div class="toolbar-left">
              <input v-model.trim="animeQuery" type="text" class="search-box" placeholder="Search anime..." />
              <select v-model="animeSortBy" class="sort-select">
                <option value="title">Sort by: Title</option>
                <option value="score">Sort by: Score</option>
                <option value="progress">Sort by: Progress</option>
                <option value="updatedAt">Sort by: Updated</option>
              </select>
            </div>

            <div class="toolbar-right">
              <button
                v-if="canManageAnime"
                class="primary-action-btn"
                type="button"
                @click="isAnimePickerOpen = !isAnimePickerOpen"
              >
                {{ isAnimePickerOpen ? 'Close add panel' : 'Add anime' }}
              </button>

              <div class="stats-bar">
                <div class="stat-card">
                  <div class="stat-value">{{ detail.animeCount }}</div>
                  <div class="stat-label">Anime</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ detail.memberCount }}</div>
                  <div class="stat-label">Members</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ visibleAnimeCount }}</div>
                  <div class="stat-label">Visible</div>
                </div>
              </div>
            </div>
          </div>

          <div class="list-filters">
            <button
              v-for="item in animeFilterItems"
              :key="item.key"
              class="list-filter"
              :class="{ active: activeAnimeFilter === item.key }"
              type="button"
              @click="activeAnimeFilter = item.key"
            >
              {{ item.label }}
              <span class="list-filter-count">{{ item.count }}</span>
            </button>
          </div>

          <div v-if="canManageAnime && isAnimePickerOpen" class="panel-card add-anime-panel">
            <div class="panel-head">
              <div>
                <h2 class="section-title">Add anime</h2>
                <p class="panel-copy">Search AniList and add a title directly to this group.</p>
              </div>
            </div>

            <input
              v-model.trim="animeSearchTerm"
              type="text"
              class="search-box full"
              placeholder="Search AniList anime"
              @input="handleAnimeSearchInput"
            />

            <div v-if="isSearchingAnime" class="search-status">Searching AniList...</div>
            <div v-else-if="animeSearchTerm.length >= 2 && !animeResults.length" class="search-status">No anime found.</div>

            <div v-if="animeResults.length" class="anime-search-results">
              <article
                v-for="item in animeResults"
                :key="item.mediaId"
                class="anime-search-item"
              >
                <div class="anime-search-cover">
                  <img v-if="item.cover" :src="item.cover" :alt="item.title" />
                  <span v-else>{{ animeCoverLabel(item.title) }}</span>
                </div>

                <div class="anime-search-copy">
                  <div class="anime-search-name">{{ item.title }}</div>
                  <div class="anime-search-secondary">
                    {{ item.formatLabel }}
                    <span v-if="item.seasonYear"> - {{ item.seasonYear }}</span>
                    <span> - AniList #{{ item.mediaId }}</span>
                  </div>
                </div>

                <button
                  class="search-result-action"
                  :class="{ 'is-disabled': item.alreadyAdded }"
                  type="button"
                  :disabled="item.alreadyAdded || pendingAnimeMediaId === String(item.mediaId)"
                  @click="addAnime(item)"
                >
                  {{ item.alreadyAdded ? 'Added' : pendingAnimeMediaId === String(item.mediaId) ? 'Adding...' : 'Add' }}
                </button>
              </article>
            </div>
          </div>

          <div v-if="canManageAnime && selectedAnimeEntry" class="editor-panel">
            <div class="editor-panel-media">
              <div class="editor-panel-thumb">
                <img
                  v-if="selectedAnimeCoverSrc"
                  :src="selectedAnimeCoverSrc"
                  :srcset="selectedAnimeCoverSrcSet"
                  :alt="selectedAnimeEntry.title"
                >
                <div v-else class="anime-card-placeholder">
                  <span>{{ animeCoverLabel(selectedAnimeEntry.title) }}</span>
                </div>
              </div>

              <div class="editor-panel-copy">
                <div class="editor-panel-label">Edit shared entry</div>
                <div class="editor-panel-title">{{ selectedAnimeEntry.title }}</div>
                <div class="editor-panel-subtitle">
                  Progress {{ editAnimeProgress || '0' }} / {{ selectedAnimeEpisodes ?? '?' }}
                </div>
              </div>
            </div>

            <div class="editor-panel-fields">
              <label class="editor-field">
                <span>Status</span>
                <select v-model="editAnimeStatus" class="editor-input">
                  <option v-for="status in STATUS_ORDER" :key="status" :value="status">
                    {{ STATUS_LABELS[status] }}
                  </option>
                </select>
              </label>

              <label class="editor-field">
                <span>Progress</span>
                <input
                  v-model="editAnimeProgress"
                  class="editor-input"
                  type="number"
                  min="0"
                  :max="selectedAnimeEpisodes ?? undefined"
                  inputmode="numeric"
                >
              </label>

              <label class="editor-field">
                <span>Score</span>
                <input
                  v-model="editAnimeScore"
                  class="editor-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="No score"
                  inputmode="decimal"
                >
              </label>
            </div>

            <div class="editor-panel-actions">
              <button class="editor-btn editor-btn-muted" type="button" @click="closeAnimeEditor">
                Cancel
              </button>
              <button class="editor-btn editor-btn-danger" type="button" :disabled="isDeletingAnime" @click="deleteAnimeEntry">
                {{ isDeletingAnime ? 'Deleting...' : 'Delete' }}
              </button>
              <button class="editor-btn editor-btn-primary" type="button" :disabled="isSavingAnime" @click="saveAnimeEntry">
                {{ isSavingAnime ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </div>

          <div v-if="!visibleAnimeSections.length" class="empty-state">
            <div class="empty-state-title">No anime match this search.</div>
            <div class="empty-state-text">
              {{ canManageAnime ? 'Try another title or use Add anime.' : 'Only the owner can add anime right now.' }}
            </div>
          </div>

          <div v-else class="anime-grid">
            <article
              v-for="(entry, index) in visibleAnimeEntries"
              :key="entry.relationId"
              class="anime-card"
              :class="{ 'is-selected': selectedAnimeRelationId === entry.relationId }"
              tabindex="0"
              role="button"
              @click="openAnimeEditor(entry)"
              @keydown.enter.prevent="openAnimeEditor(entry)"
              @keydown.space.prevent="openAnimeEditor(entry)"
            >
              <img
                v-if="entryCoverSrc(entry)"
                class="anime-cover-image"
                :src="entryCoverSrc(entry)"
                :srcset="entryCoverSrcSet(entry)"
                :alt="entry.title"
              >
              <div v-else class="anime-cover" :style="{ background: animeCoverGradient(index) }">
                <span>{{ animeCoverLabel(entry.title) }}</span>
              </div>

              <div class="status-dot" :class="statusDotClass(entry.status)"></div>
              <div class="anime-card-score">{{ formatAnimeScore(entry.score) }}</div>

              <div class="anime-info">
                <div class="anime-title">{{ entry.title }}</div>
                <div class="anime-meta">
                  <span>{{ STATUS_LABELS[entry.status] }}</span>
                  <span v-if="entry.mediaId">AniList #{{ entry.mediaId }}</span>
                </div>
                <div class="anime-status" :class="statusPillClass(entry.status)">
                  {{ STATUS_LABELS[entry.status] }}
                </div>
                <div class="anime-progress">
                  {{ entry.progress }} / {{ entryEpisodes(entry) ?? '?' }} episodes
                </div>
                <div class="anime-score">
                  <span>{{ memberName(entry.addedByUserId || '') }}</span>
                  <span v-if="entry.createdAt">· {{ formatDateLabel(entry.createdAt) }}</span>
                </div>
                <a v-if="entry.fetchLink" class="entry-link" :href="entry.fetchLink" target="_blank" rel="noreferrer">
                  Open source
                </a>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'members'" class="content-section">
          <div v-if="detail.membersVisibilityLimited" class="status-card limited-note">
            PocketBase still restricts the full roster for non-owners. You may see a partial list here.
          </div>

          <div class="members-grid">
            <article v-for="member in detail.members" :key="member.id" class="member-card">
              <div class="member-avatar" :style="{ background: member.color }">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                <span v-else>{{ member.initials }}</span>
              </div>

              <div class="member-info">
                <div class="member-name">
                  {{ member.name }}
                  <span v-if="member.isCurrentUser" class="member-self">(you)</span>
                </div>
                <div class="member-role">
                  Joined {{ member.joinedAt ? formatDateLabel(member.joinedAt) : 'recently' }}
                </div>
              </div>

              <div class="member-badge" :class="{ owner: member.role === 'owner' }">
                {{ member.role === 'owner' ? 'Owner' : 'Member' }}
              </div>

              <button
                v-if="detail.isOwner && member.role !== 'owner' && member.membershipId"
                class="remove-btn"
                type="button"
                :disabled="pendingMembershipActionId === member.membershipId"
                @click="removeMember(member.membershipId)"
              >
                {{ pendingMembershipActionId === member.membershipId ? 'Removing...' : 'Remove' }}
              </button>
            </article>
          </div>
        </section>

        <section v-else class="content-section">
          <div class="settings-grid">
            <div class="panel-card">
              <h2 class="section-title">Add member</h2>
              <div v-if="detail.isOwner" class="invite-box">
                <input
                  v-model.trim="memberQuery"
                  type="text"
                  class="search-box full"
                  placeholder="Search AniList username"
                  @input="handleSearchInput"
                />

                <div v-if="isSearchingUsers" class="search-status">Searching users...</div>
                <div v-else-if="memberQuery.length >= 2 && !userResults.length" class="search-status">No matching user found.</div>

                <div v-if="userResults.length" class="search-results">
                  <button
                    v-for="user in userResults"
                    :key="user.id"
                    class="search-result"
                    type="button"
                    :disabled="pendingAddUserId === user.id"
                    @click="addMember(user.id)"
                  >
                    <span class="member-avatar small" :style="{ background: user.color }">
                      <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                      <span v-else>{{ user.initials }}</span>
                    </span>
                    <span class="search-name">{{ user.name }}</span>
                    <span class="search-action">{{ pendingAddUserId === user.id ? 'Adding...' : 'Add' }}</span>
                  </button>
                </div>
              </div>

              <div v-else class="empty-state compact">
                <div class="empty-state-text">Only the owner can add or remove members.</div>
              </div>
            </div>

            <div class="panel-card">
              <h2 class="section-title">Group info</h2>
              <div class="info-list">
                <div class="info-row">
                  <span>Created</span>
                  <strong>{{ formatDateLabel(detail.createdAt) }}</strong>
                </div>
                <div class="info-row">
                  <span>Privacy</span>
                  <strong>{{ privacyLabel(detail.privacy) }}</strong>
                </div>
                <div class="info-row">
                  <span>Owner</span>
                  <strong>{{ detail.ownerName }}</strong>
                </div>
                <div class="info-row">
                  <span>Anime count</span>
                  <strong>{{ detail.animeCount }}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import {
  useSharedLists,
  type SharedListAnimeEntry,
  type SharedListAnimeStatus,
  type SharedListDetail,
  type SharedListPrivacy
} from '~/composables/useSharedLists'

definePageMeta({ middleware: ['auth'] })

type DetailTab = 'anime' | 'members' | 'settings'
type AnimeSortKey = 'title' | 'score' | 'progress' | 'updatedAt'
type AnimeFilterKey = 'ALL' | SharedListAnimeStatus
type AniListGraphqlResponse<T> = { data?: T; errors?: Array<{ message?: string | null }> | null }
type AniListSearchMedia = {
  id?: number | null
  seasonYear?: number | null
  format?: string | null
  title?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  } | null
  coverImage?: {
    large?: string | null
    medium?: string | null
  } | null
}
type AnimeSearchResult = {
  mediaId: number
  title: string
  cover?: string
  seasonYear?: number
  formatLabel: string
  fetchLink: string
  alreadyAdded: boolean
}
type SharedAnimeMedia = {
  id?: number | null
  episodes?: number | null
  title?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  } | null
  coverImage?: AnilistCoverImage | null
}

const STATUS_LABELS: Record<SharedListAnimeStatus, string> = {
  PLANNING: 'Plan to watch',
  CURRENT: 'Watching',
  PAUSED: 'Paused',
  DROPPED: 'Dropped',
  REPEATING: 'Rewatching',
  COMPLETED: 'Completed'
}

const STATUS_ORDER: SharedListAnimeStatus[] = ['PLANNING', 'CURRENT', 'PAUSED', 'DROPPED', 'REPEATING', 'COMPLETED']

const route = useRoute()
const anilistGraphql = useAnilistGraphql()
const profileTabs = [
  { key: 'anime-list', label: 'Anime List', to: '/animeList' },
  { key: 'favorites', label: 'Favorites', to: '/favorites' },
  { key: 'friends', label: 'Friends', to: '/friends' },
  { key: 'shared-lists', label: 'Shared Lists', to: '/sharedLists', active: true }
]

const {
  currentUserId,
  formatDateLabel,
  loadDetail,
  updateSharedList,
  addMemberToList,
  addAnimeToList,
  updateAnimeListEntry,
  removeAnimeFromList,
  removeMembership,
  deleteSharedList,
  ensureOwnerMembership,
  searchUsers
} = useSharedLists()

const isLoading = ref(true)
const isSavingMeta = ref(false)
const isDeleting = ref(false)
const isLeaving = ref(false)
const isSearchingUsers = ref(false)
const isSearchingAnime = ref(false)
const isAnimePickerOpen = ref(false)
const isSavingAnime = ref(false)
const isDeletingAnime = ref(false)
const loadError = ref('')
const actionError = ref('')
const isEditingMeta = ref(false)
const pendingAddUserId = ref('')
const pendingMembershipActionId = ref('')
const pendingAnimeMediaId = ref('')
const detail = ref<SharedListDetail | null>(null)
const animeMediaMap = ref<Record<number, SharedAnimeMedia>>({})
const editName = ref('')
const editPrivacy = ref<SharedListPrivacy>('friends')
const memberQuery = ref('')
const animeQuery = ref('')
const animeSearchTerm = ref('')
const animeSortBy = ref<AnimeSortKey>('title')
const activeAnimeFilter = ref<AnimeFilterKey>('ALL')
const selectedAnimeRelationId = ref('')
const editAnimeStatus = ref<SharedListAnimeStatus>('PLANNING')
const editAnimeProgress = ref('0')
const editAnimeScore = ref('')
const activeTab = ref<DetailTab>('anime')
const userResults = ref<Array<{ id: string; name: string; avatar?: string; initials: string; color: string }>>([])
const animeResults = ref<AnimeSearchResult[]>([])

const listId = computed(() => String(route.params.id || ''))
const canManageAnime = computed(() => Boolean(detail.value?.isOwner))
const existingAnimeIds = computed(() => new Set((detail.value?.animeEntries || []).map(entry => Number(entry.mediaId || 0)).filter(Boolean)))

const tabs = [
  { key: 'anime' as DetailTab, label: 'Anime List' },
  { key: 'members' as DetailTab, label: 'Members' },
  { key: 'settings' as DetailTab, label: 'Settings' }
]

const coverGradient = computed(() => {
  const gradients = [
    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    'linear-gradient(135deg, #3db4f2 0%, #2e8bc0 100%)',
    'linear-gradient(135deg, #9256f3 0%, #7c3aed 100%)'
  ]
  const title = String(detail.value?.title || '')
  let score = 0
  for (const char of title) score += char.charCodeAt(0)
  return gradients[score % gradients.length] || gradients[0]
})

const coverLabel = computed(() => String(detail.value?.title || 'SL').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'SL')

const rawAnimeSections = computed<Record<SharedListAnimeStatus, SharedListAnimeEntry[]>>(() => {
  const sections = {
    PLANNING: [],
    CURRENT: [],
    PAUSED: [],
    DROPPED: [],
    REPEATING: [],
    COMPLETED: []
  } as Record<SharedListAnimeStatus, SharedListAnimeEntry[]>

  for (const entry of detail.value?.animeEntries || []) {
    const key = STATUS_ORDER.includes(entry.status) ? entry.status : 'PLANNING'
    sections[key].push(entry)
  }

  return sections
})

const animeFilterItems = computed(() => {
  const allCount = STATUS_ORDER.reduce((sum, key) => sum + rawAnimeSections.value[key].length, 0)
  return [
    { key: 'ALL' as AnimeFilterKey, label: 'All', count: allCount },
    ...STATUS_ORDER.map((key) => ({
      key: key as AnimeFilterKey,
      label: STATUS_LABELS[key],
      count: rawAnimeSections.value[key].length
    }))
  ]
})

const visibleAnimeEntries = computed(() => {
  const needle = animeQuery.value.trim().toLowerCase()
  const source = activeAnimeFilter.value === 'ALL'
    ? STATUS_ORDER.flatMap(status => rawAnimeSections.value[status])
    : rawAnimeSections.value[activeAnimeFilter.value]

  const filtered = source.filter((entry) => {
    if (!needle) return true
    return entry.title.toLowerCase().includes(needle)
  })

  return [...filtered].sort((a, b) => {
    if (animeSortBy.value === 'title') return a.title.localeCompare(b.title)
    if (animeSortBy.value === 'score') return (b.score || 0) - (a.score || 0)
    if (animeSortBy.value === 'progress') return (b.progress || 0) - (a.progress || 0)
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  })
})

const visibleAnimeCount = computed(() => visibleAnimeEntries.value.length)
const visibleAnimeSections = computed(() => visibleAnimeCount.value ? [{ key: 'visible', items: visibleAnimeEntries.value }] : [])

const selectedAnimeEntry = computed(() =>
  detail.value?.animeEntries.find(entry => entry.relationId === selectedAnimeRelationId.value) || null
)

const selectedAnimeMedia = computed(() => {
  const mediaId = Number(selectedAnimeEntry.value?.mediaId || 0)
  return mediaId ? animeMediaMap.value[mediaId] || null : null
})

const selectedAnimeEpisodes = computed(() => selectedAnimeMedia.value?.episodes ?? null)
const selectedAnimeCoverSrc = computed(() => getAnilistCoverSrc(selectedAnimeMedia.value?.coverImage, 'thumb') || undefined)
const selectedAnimeCoverSrcSet = computed(() => getAnilistCoverSrcSet(selectedAnimeMedia.value?.coverImage, 'thumb'))

const loadAnimeMedia = async (entries: SharedListAnimeEntry[]) => {
  const ids = Array.from(new Set(entries.map(entry => Number(entry.mediaId || 0)).filter(Boolean)))
  if (!ids.length) {
    animeMediaMap.value = {}
    return
  }

  try {
    const response = await anilistGraphql.request<AniListGraphqlResponse<{
      Page?: {
        media?: SharedAnimeMedia[] | null
      } | null
    }>>(
      `
        query ($ids: [Int]) {
          Page(page: 1, perPage: 50) {
            media(id_in: $ids, type: ANIME) {
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
      `,
      { ids },
      { cacheTtlMs: 60_000 }
    )

    if (response?.errors?.length) {
      animeMediaMap.value = {}
      return
    }

    const media = Array.isArray(response?.data?.Page?.media) ? response.data.Page.media : []
    animeMediaMap.value = Object.fromEntries(
      media
        .map(item => [Number(item.id || 0), item] as const)
        .filter(([id]) => id > 0)
    )
  } catch {
    animeMediaMap.value = {}
  }
}

const loadPage = async () => {
  if (!listId.value) return

  isLoading.value = true
  loadError.value = ''
  actionError.value = ''

  try {
    let result = await loadDetail(listId.value)

    if (result.isOwner && !result.ownMembershipId) {
      await ensureOwnerMembership(listId.value)
      result = await loadDetail(listId.value)
    }

    detail.value = result
    editName.value = result.title
    editPrivacy.value = result.privacy
    await loadAnimeMedia(result.animeEntries)
    if (animeResults.value.length) {
      const existingIds = new Set(result.animeEntries.map(entry => Number(entry.mediaId || 0)).filter(Boolean))
      animeResults.value = animeResults.value.map(item => ({
        ...item,
        alreadyAdded: existingIds.has(item.mediaId)
      }))
    }
  } catch (error: any) {
    detail.value = null
    animeMediaMap.value = {}
    loadError.value = error?.message || 'Unable to load this shared group.'
  } finally {
    isLoading.value = false
  }
}

const privacyLabel = (privacy: SharedListPrivacy) => privacy === 'private' ? 'Private' : privacy === 'friends' ? 'Friends Only' : 'Public'

const startMetaEdit = () => {
  if (!detail.value) return
  editName.value = detail.value.title
  editPrivacy.value = detail.value.privacy
  isEditingMeta.value = true
}

const cancelMetaEdit = () => {
  if (!detail.value) return
  editName.value = detail.value.title
  editPrivacy.value = detail.value.privacy
  isEditingMeta.value = false
  actionError.value = ''
}

const saveMeta = async () => {
  if (!detail.value) return

  isSavingMeta.value = true
  actionError.value = ''

  try {
    await updateSharedList(detail.value.id, {
      name: editName.value,
      privacy: editPrivacy.value
    })
    isEditingMeta.value = false
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to update this group.'
  } finally {
    isSavingMeta.value = false
  }
}

let memberSearchTimer: ReturnType<typeof setTimeout> | null = null
let animeSearchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearchInput = () => {
  if (!detail.value) return
  if (memberSearchTimer) clearTimeout(memberSearchTimer)

  if (memberQuery.value.trim().length < 2) {
    userResults.value = []
    isSearchingUsers.value = false
    return
  }

  memberSearchTimer = setTimeout(async () => {
    if (!detail.value) return
    isSearchingUsers.value = true

    try {
      userResults.value = await searchUsers(
        memberQuery.value,
        detail.value.members.map(member => member.id)
      )
    } catch {
      userResults.value = []
    } finally {
      isSearchingUsers.value = false
    }
  }, 200)
}

const addMember = async (userId: string) => {
  if (!detail.value) return

  pendingAddUserId.value = userId
  actionError.value = ''

  try {
    await addMemberToList(detail.value.id, userId)
    memberQuery.value = ''
    userResults.value = []
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to add this member.'
  } finally {
    pendingAddUserId.value = ''
  }
}

const formatAnimeSearchTitle = (media: AniListSearchMedia) => {
  return String(media.title?.romaji || media.title?.english || media.title?.native || '').trim() || `AniList #${media.id || 0}`
}

const formatMediaFormat = (value?: string | null) => {
  const label = String(value || '').trim().toLowerCase()
  if (!label) return 'Anime'
  return label
    .split('_')
    .map(part => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '')
    .join(' ')
}

const searchAnime = async (query: string) => {
  const response = await anilistGraphql.request<AniListGraphqlResponse<{
    Page?: {
      media?: AniListSearchMedia[] | null
    } | null
  }>>(
    `
      query ($search: String) {
        Page(page: 1, perPage: 8) {
          media(search: $search, type: ANIME, isAdult: false) {
            id
            seasonYear
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
          }
        }
      }
    `,
    { search: query },
    { cacheTtlMs: 60_000 }
  )

  if (response?.errors?.length) {
    throw new Error(response.errors[0]?.message || 'Unable to search AniList.')
  }

  const items = Array.isArray(response?.data?.Page?.media) ? response.data.Page.media : []
  return items
    .map((media) => {
      const mediaId = Number(media.id || 0)
      return {
        mediaId,
        title: formatAnimeSearchTitle(media),
        cover: String(media.coverImage?.large || media.coverImage?.medium || '').trim() || undefined,
        seasonYear: Number(media.seasonYear || 0) || undefined,
        formatLabel: formatMediaFormat(media.format),
        fetchLink: `https://anilist.co/anime/${mediaId}`,
        alreadyAdded: existingAnimeIds.value.has(mediaId)
      } satisfies AnimeSearchResult
    })
    .filter(item => item.mediaId > 0)
}

const handleAnimeSearchInput = () => {
  if (animeSearchTimer) clearTimeout(animeSearchTimer)

  if (animeSearchTerm.value.trim().length < 2) {
    animeResults.value = []
    isSearchingAnime.value = false
    return
  }

  animeSearchTimer = setTimeout(async () => {
    isSearchingAnime.value = true

    try {
      animeResults.value = await searchAnime(animeSearchTerm.value)
    } catch (error: any) {
      animeResults.value = []
      actionError.value = error?.message || 'Unable to search AniList.'
    } finally {
      isSearchingAnime.value = false
    }
  }, 220)
}

const addAnime = async (item: AnimeSearchResult) => {
  if (!detail.value) return
  if (!canManageAnime.value) {
    actionError.value = 'Only the owner can add anime to this shared list.'
    return
  }

  pendingAnimeMediaId.value = String(item.mediaId)
  actionError.value = ''

  try {
    await addAnimeToList(detail.value.id, {
      mediaId: item.mediaId,
      title: item.title,
      fetchLink: item.fetchLink
    })
    animeSearchTerm.value = ''
    animeResults.value = []
    isAnimePickerOpen.value = false
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to add this anime.'
  } finally {
    pendingAnimeMediaId.value = ''
  }
}

const formatAnimeScore = (score: number) => {
  if (!score) return '-'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const statusDotClass = (status: SharedListAnimeStatus) => {
  if (status === 'CURRENT') return 'dot-watching'
  if (status === 'COMPLETED') return 'dot-completed'
  if (status === 'PAUSED') return 'dot-paused'
  if (status === 'DROPPED') return 'dot-dropped'
  if (status === 'REPEATING') return 'dot-rewatching'
  return 'dot-planned'
}

const statusPillClass = (status: SharedListAnimeStatus) => {
  if (status === 'CURRENT') return 'status-watching'
  if (status === 'COMPLETED') return 'status-completed'
  if (status === 'PAUSED') return 'status-paused'
  if (status === 'DROPPED') return 'status-dropped'
  if (status === 'REPEATING') return 'status-rewatching'
  return 'status-planning'
}

const entryCoverSrc = (entry: SharedListAnimeEntry) =>
  getAnilistCoverSrc(animeMediaMap.value[Number(entry.mediaId || 0)]?.coverImage, 'card') || undefined

const entryCoverSrcSet = (entry: SharedListAnimeEntry) =>
  getAnilistCoverSrcSet(animeMediaMap.value[Number(entry.mediaId || 0)]?.coverImage, 'card')

const entryEpisodes = (entry: SharedListAnimeEntry) =>
  animeMediaMap.value[Number(entry.mediaId || 0)]?.episodes ?? null

const openAnimeEditor = (entry: SharedListAnimeEntry) => {
  if (!canManageAnime.value) return
  selectedAnimeRelationId.value = entry.relationId
  editAnimeStatus.value = entry.status
  editAnimeProgress.value = String(entry.progress ?? 0)
  editAnimeScore.value = entry.score ? String(entry.score) : ''
}

const closeAnimeEditor = () => {
  selectedAnimeRelationId.value = ''
  editAnimeStatus.value = 'PLANNING'
  editAnimeProgress.value = '0'
  editAnimeScore.value = ''
}

const saveAnimeEntry = async () => {
  if (!selectedAnimeEntry.value) return
  if (!canManageAnime.value) {
    actionError.value = 'Only the owner can edit anime entries in this shared list.'
    return
  }

  isSavingAnime.value = true
  actionError.value = ''

  try {
    const nextProgress = Number(editAnimeProgress.value)
    const nextScore = Number(editAnimeScore.value)
    await updateAnimeListEntry(selectedAnimeEntry.value.relationId, {
      status: editAnimeStatus.value,
      progress: editAnimeProgress.value === '' || !Number.isFinite(nextProgress) ? 0 : nextProgress,
      score: editAnimeScore.value === '' || !Number.isFinite(nextScore) ? 0 : nextScore
    })
    await loadPage()
    closeAnimeEditor()
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to update this anime entry.'
  } finally {
    isSavingAnime.value = false
  }
}

const deleteAnimeEntry = async () => {
  if (!selectedAnimeEntry.value) return
  if (!canManageAnime.value) {
    actionError.value = 'Only the owner can remove anime from this shared list.'
    return
  }
  if (typeof window !== 'undefined' && !window.confirm(`Delete "${selectedAnimeEntry.value.title}" from this shared list?`)) {
    return
  }

  isDeletingAnime.value = true
  actionError.value = ''

  try {
    await removeAnimeFromList(selectedAnimeEntry.value.relationId)
    await loadPage()
    closeAnimeEditor()
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to delete this anime entry.'
  } finally {
    isDeletingAnime.value = false
  }
}

const removeMember = async (membershipId: string) => {
  pendingMembershipActionId.value = membershipId
  actionError.value = ''

  try {
    await removeMembership(membershipId)
    await loadPage()
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to remove this member.'
  } finally {
    pendingMembershipActionId.value = ''
  }
}

const leaveGroup = async () => {
  if (!detail.value?.ownMembershipId) {
    actionError.value = 'Your membership record could not be found.'
    return
  }

  isLeaving.value = true
  actionError.value = ''

  try {
    await removeMembership(detail.value.ownMembershipId)
    await navigateTo('/sharedLists')
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to leave this group.'
  } finally {
    isLeaving.value = false
  }
}

const deleteGroup = async () => {
  if (!detail.value) return

  isDeleting.value = true
  actionError.value = ''

  try {
    await deleteSharedList(detail.value.id)
    await navigateTo('/sharedLists')
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to delete this group.'
  } finally {
    isDeleting.value = false
  }
}

const memberName = (memberId: string) => {
  if (!memberId) return 'Unknown'
  const match = detail.value?.members.find(member => member.id === memberId)
  return match?.name || `User ${memberId.slice(0, 4)}`
}

const animeCoverGradient = (index: number) => {
  const gradients = [
    'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #ec4899 100%)',
    'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
  ]
  return gradients[index % gradients.length] || gradients[0]
}

const animeCoverLabel = (title: string) => title.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'AN'

const animeStatusLabel = (index: number) => {
  const labels = ['Completed', 'Watching', 'Planning', 'Paused']
  return labels[index % labels.length] || labels[0]
}

const animeStatusClass = (index: number) => {
  const key = index % 4
  return {
    'status-completed': key === 0,
    'status-watching': key === 1,
    'status-planning': key === 2,
    'status-paused': key === 3
  }
}

watch(listId, () => {
  isEditingMeta.value = false
  memberQuery.value = ''
  animeQuery.value = ''
  animeSearchTerm.value = ''
  animeSortBy.value = 'title'
  activeAnimeFilter.value = 'ALL'
  userResults.value = []
  animeResults.value = []
  isAnimePickerOpen.value = false
  closeAnimeEditor()
  activeTab.value = 'anime'
  loadPage()
})

onMounted(loadPage)
</script>

<style scoped>
.shared-list-page {
  min-height: 100vh;
  color: var(--kz-text-primary);
  background:
    radial-gradient(circle at top, rgba(61,180,242,.08), transparent 38%),
    linear-gradient(180deg, rgba(4,10,22,.92) 0%, transparent 24%),
    transparent;
}

.shared-list-shell {
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 28px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.shared-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--kz-text-dim);
}

.shared-breadcrumb a {
  color: inherit;
  text-decoration: none;
}

.group-hero {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--kz-border);
  background:
    linear-gradient(135deg, rgba(30,58,138,.75) 0%, rgba(124,58,237,.68) 100%),
    linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0));
  padding: 24px;
  color: #fff;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(11,22,34,.72) 100%);
  pointer-events: none;
}

.hero-top,
.hero-head {
  position: relative;
  z-index: 1;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn,
.ghost-btn,
.danger-btn,
.primary-btn,
.filter-btn,
.meta-select {
  min-height: 38px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Overpass', sans-serif;
}

.back-btn,
.ghost-btn,
.danger-btn,
.primary-btn,
.filter-btn {
  cursor: pointer;
}

.back-btn {
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.1);
  color: #fff;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover,
.ghost-btn:hover {
  background: rgba(255,255,255,.16);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ghost-btn {
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  color: #fff;
  padding: 0 14px;
}

.danger-btn {
  border: 1px solid rgba(248,113,113,.25);
  background: rgba(248,113,113,.14);
  color: #fff;
  padding: 0 14px;
}

.primary-btn {
  border: 1px solid rgba(61,180,242,.35);
  background: rgba(61,180,242,.18);
  color: #fff;
  padding: 0 14px;
}

.meta-select {
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  color: #fff;
  padding: 0 12px;
}

.hero-head {
  display: flex;
  align-items: center;
  gap: 20px;
}

.group-cover {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .12em;
  flex-shrink: 0;
}

.group-copy {
  min-width: 0;
}

.group-title-row h1 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.title-input {
  width: min(100%, 420px);
  min-height: 46px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(255,255,255,.08);
  color: #fff;
  padding: 0 14px;
  font-size: 26px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  font-size: 14px;
  color: rgba(255,255,255,.8);
}

.group-badge {
  background: #4cca5a;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.group-badge.private {
  background: #f79a63;
}

.role-accent {
  color: #f79a63;
  font-weight: 600;
}

.group-description {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(255,255,255,.72);
}

.tabs-wrap {
  border-bottom: 1px solid rgba(160,177,197,.15);
}

.tabs-nav {
  display: flex;
  gap: 34px;
}

.tab-btn {
  padding: 18px 0;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--kz-text-dim);
  font-size: 15px;
  font-weight: 600;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--kz-accent);
  border-bottom-color: var(--kz-accent);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.search-box {
  width: 300px;
  min-height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(160,177,197,.15);
  background: var(--kz-card-bg);
  color: var(--kz-text-primary);
  padding: 0 14px;
  font-size: 14px;
  font-family: 'Overpass', sans-serif;
}

.search-box.full {
  width: 100%;
}

.search-box:focus,
.title-input:focus,
.meta-select:focus {
  outline: none;
}

.filter-btn {
  border: 1px solid rgba(160,177,197,.15);
  background: var(--kz-card-bg);
  color: var(--kz-text-secondary);
  padding: 0 18px;
}

.sort-select {
  min-height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(160,177,197,.15);
  background: var(--kz-card-bg);
  color: var(--kz-text-secondary);
  padding: 0 36px 0 14px;
  font-size: 13px;
  font-family: 'Overpass', sans-serif;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23748899' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.sort-select:focus {
  outline: none;
}

.primary-action-btn {
  min-height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(61,180,242,.28);
  background: rgba(61,180,242,.12);
  color: var(--kz-accent);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
}

.primary-action-btn:hover {
  border-color: rgba(61,180,242,.4);
  background: rgba(61,180,242,.18);
}

.list-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.list-filter {
  min-height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(160,177,197,.15);
  background: var(--kz-card-bg);
  color: var(--kz-text-dim);
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
}

.list-filter.active {
  border-color: rgba(61,180,242,.28);
  background: rgba(61,180,242,.1);
  color: var(--kz-accent);
}

.list-filter-count {
  color: inherit;
  opacity: .8;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 14px;
  width: min(420px, 100%);
}

.stat-card,
.panel-card {
  background: var(--kz-card-bg);
  border: 1px solid rgba(160,177,197,.08);
  border-radius: 8px;
}

.stat-card {
  padding: 18px;
  text-align: center;
}

.add-anime-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-copy {
  margin: -8px 0 0;
  font-size: 12px;
  color: var(--kz-text-dim);
}

.editor-panel {
  background: var(--kz-card-bg);
  border: 1px solid rgba(160,177,197,.08);
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-panel-media {
  display: flex;
  align-items: center;
  gap: 14px;
}

.editor-panel-thumb {
  width: 72px;
  height: 98px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255,255,255,.03);
}

.editor-panel-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anime-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(61,180,242,.26), rgba(146,86,243,.26));
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .12em;
}

.editor-panel-copy {
  min-width: 0;
}

.editor-panel-label {
  font-size: 11px;
  color: var(--kz-text-dim);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.editor-panel-title {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.editor-panel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--kz-text-secondary);
}

.editor-panel-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--kz-text-dim);
}

.editor-input {
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(160,177,197,.15);
  background: rgba(255,255,255,.03);
  color: var(--kz-text-primary);
  padding: 0 12px;
  font-size: 13px;
  font-family: 'Overpass', sans-serif;
}

.editor-input:focus {
  outline: none;
}

.editor-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.editor-btn {
  min-height: 38px;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
}

.editor-btn-muted {
  border: 1px solid rgba(160,177,197,.15);
  background: transparent;
  color: var(--kz-text-secondary);
}

.editor-btn-danger {
  border: 1px solid rgba(248,113,113,.25);
  background: rgba(248,113,113,.12);
  color: #f87171;
}

.editor-btn-primary {
  border: 1px solid rgba(61,180,242,.28);
  background: rgba(61,180,242,.12);
  color: var(--kz-accent);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--kz-accent);
}

.stat-label {
  margin-top: 4px;
  font-size: 11px;
  color: var(--kz-text-dim);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.anime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.anime-card {
  background: var(--kz-card-bg);
  border: 1px solid rgba(160,177,197,.08);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.anime-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,.38);
}

.anime-card.is-selected {
  border-color: rgba(61,180,242,.32);
  box-shadow: 0 0 0 1px rgba(61,180,242,.18), 0 8px 24px rgba(0,0,0,.38);
}

.anime-cover-image {
  width: 100%;
  height: 215px;
  object-fit: cover;
  display: block;
}

.anime-cover {
  width: 100%;
  height: 215px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,.94);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .12em;
}

.anime-info {
  padding: 12px;
}

.anime-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--kz-text-primary);
  margin-bottom: 8px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.anime-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--kz-text-dim);
}

.anime-progress {
  margin-top: 8px;
  font-size: 12px;
  color: var(--kz-text-secondary);
}

.anime-status {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-completed {
  background: rgba(76,202,90,.15);
  color: #4cca5a;
}

.status-watching {
  background: rgba(146,86,243,.15);
  color: #9256f3;
}

.status-planning {
  background: rgba(2,169,255,.15);
  color: #02a9ff;
}

.status-paused {
  background: rgba(247,121,164,.15);
  color: #f779a4;
}

.status-dropped {
  background: rgba(248,113,113,.14);
  color: #f87171;
}

.status-rewatching {
  background: rgba(168,85,247,.16);
  color: #c084fc;
}

.status-dot {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 0 3px rgba(11,22,34,.56);
}

.dot-planned { background: #02a9ff; }
.dot-watching { background: #9256f3; }
.dot-paused { background: #f779a4; }
.dot-dropped { background: #f87171; }
.dot-rewatching { background: #c084fc; }
.dot-completed { background: #4cca5a; }

.anime-card-score {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 34px;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(11,22,34,.82);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.anime-score {
  margin-top: 8px;
  font-size: 12px;
  color: var(--kz-text-secondary);
}

.entry-link {
  display: inline-flex;
  margin-top: 8px;
  color: var(--kz-accent);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}

.members-grid,
.search-results,
.settings-grid {
  display: grid;
  gap: 15px;
}

.members-grid {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.member-card {
  background: var(--kz-card-bg);
  border: 1px solid rgba(160,177,197,.08);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: background .16s ease, transform .16s ease;
}

.member-card:hover {
  background: rgba(255,255,255,.025);
  transform: translateX(4px);
}

.member-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.member-avatar.small {
  width: 34px;
  height: 34px;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--kz-text-primary);
}

.member-self {
  color: var(--kz-accent);
}

.member-role {
  margin-top: 4px;
  font-size: 11px;
  color: var(--kz-text-dim);
}

.member-badge {
  background: rgba(247,154,99,.15);
  color: #f79a63;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
}

.member-badge.owner {
  background: rgba(247,154,99,.2);
}

.remove-btn {
  border: 0;
  background: transparent;
  color: #f87171;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.panel-card {
  padding: 20px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.invite-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-status,
.empty-state-text {
  font-size: 14px;
  color: var(--kz-text-dim);
}

.search-result {
  width: 100%;
  border: 1px solid rgba(160,177,197,.08);
  background: rgba(255,255,255,.02);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  cursor: pointer;
}

.anime-search-results {
  display: grid;
  gap: 10px;
}

.anime-search-item {
  border: 1px solid rgba(160,177,197,.08);
  background: rgba(255,255,255,.02);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.anime-search-cover {
  width: 46px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(61,180,242,.3), rgba(146,86,243,.3));
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.anime-search-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anime-search-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.anime-search-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.anime-search-secondary {
  font-size: 11px;
  color: var(--kz-text-dim);
}

.search-result-action {
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(61,180,242,.24);
  background: rgba(61,180,242,.12);
  color: var(--kz-accent);
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Overpass', sans-serif;
  cursor: pointer;
  flex-shrink: 0;
}

.search-result-action.is-disabled,
.search-result-action:disabled {
  border-color: rgba(160,177,197,.1);
  background: rgba(255,255,255,.04);
  color: var(--kz-text-dim);
  cursor: default;
}

.search-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--kz-text-primary);
}

.search-action {
  font-size: 11px;
  font-weight: 700;
  color: var(--kz-accent);
}

.info-list {
  display: grid;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--kz-text-dim);
  font-size: 13px;
}

.info-row strong {
  color: var(--kz-text-primary);
}

.empty-state {
  text-align: center;
  padding: 54px 20px;
  border-radius: 8px;
  border: 1px dashed rgba(255,255,255,.08);
  background: rgba(255,255,255,.02);
}

.empty-state.compact {
  padding: 20px;
}

.empty-state-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--kz-text-primary);
  margin-bottom: 10px;
}

.status-card {
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid var(--kz-border);
  background: var(--kz-card-bg);
  color: var(--kz-text-secondary);
  font-size: 12px;
}

.status-card.error {
  color: #f87171;
  border-color: rgba(248,113,113,.25);
  background: rgba(248,113,113,.05);
}

.limited-note {
  background: rgba(251,191,36,.06);
  border-color: rgba(251,191,36,.18);
  color: #f5c14d;
}

.inline-error {
  margin-top: -2px;
}

[data-theme='winter'] .shared-list-page {
  background:
    radial-gradient(circle at top, rgba(61,180,242,.12), transparent 40%),
    linear-gradient(180deg, rgba(222,236,248,.9) 0%, transparent 28%),
    transparent;
}

[data-theme='winter'] .group-hero,
[data-theme='winter'] .stat-card,
[data-theme='winter'] .anime-card,
[data-theme='winter'] .member-card,
[data-theme='winter'] .panel-card,
[data-theme='winter'] .status-card,
[data-theme='winter'] .search-box,
[data-theme='winter'] .filter-btn {
  border-color: rgba(23,52,78,.14);
}

@media (max-width: 1024px) {
  .stats-bar {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
  }
}

@media (max-width: 820px) {
  .shared-list-shell {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero-top,
  .hero-head,
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .group-cover {
    width: 88px;
    height: 88px;
  }

  .stats-bar {
    width: 100%;
  }

  .toolbar-right {
    width: 100%;
    flex-direction: column;
  }

  .editor-panel-media,
  .editor-panel-fields {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .shared-list-shell {
    padding: 18px 12px 56px;
  }

  .tabs-nav {
    gap: 20px;
    overflow-x: auto;
  }

  .anime-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .stats-bar {
    grid-template-columns: 1fr;
  }

  .anime-search-item {
    align-items: flex-start;
  }

  .editor-panel-actions {
    flex-direction: column-reverse;
  }
}
</style>

<template>
  <div class="anime-list-page friend-profile-page">
    <section class="banner-wrap" :class="{ 'has-image': Boolean(bannerUrl) }">
      <img v-if="bannerUrl" :src="bannerUrl" alt="" class="banner-image">
      <div class="banner-content">
        <div class="banner-avatar">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="friendName || 'Avatar AniList'">
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
          <div class="banner-username">{{ friendName || 'Ami' }}</div>
          <div class="banner-joined">Inscrit {{ joinedDisplay }}</div>
        </div>
      </div>
      <div v-if="showFollowButton" class="banner-follow-action">
        <button
          class="banner-follow-btn"
          :class="{ following: isFollowingFriend }"
          type="button"
          :disabled="isFollowBusy"
          @click="toggleFollowFromBanner"
        >
          {{ isFollowBusy ? 'Mise a jour...' : isFollowingFriend ? 'Ne plus suivre' : 'Suivre' }}
        </button>
      </div>
    </section>

    <div class="sub-tabs-bar">
      <div class="sub-tabs">
        <NuxtLink class="sub-tab" :class="{ active: activeTab === 'anime-list' }" :to="profileTabRoute('anime-list')">
          {{ friendName || 'Ami' }} Liste d'animes
        </NuxtLink>
        <NuxtLink v-if="!isOwnProfile" class="sub-tab" :to="`/social/compare/${friendUserId}`">Comparer les listes</NuxtLink>
        <NuxtLink class="sub-tab" :class="{ active: activeTab === 'favorites' }" :to="profileTabRoute('favorites')">
          Favoris
        </NuxtLink>
        <NuxtLink class="sub-tab" :class="{ active: activeTab === 'friends' }" :to="profileTabRoute('friends')">
          Amis
        </NuxtLink>
        <NuxtLink class="sub-tab" :class="{ active: activeTab === 'shared-lists' }" :to="profileTabRoute('shared-lists')">
          Listes partagées
        </NuxtLink>
      </div>
    </div>

    <div v-if="activeTab === 'anime-list'" class="page">
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

        <div v-else-if="visibleAnimeSections.length === 0" class="empty-state">
          Aucun anime trouvé pour ce filtre.
        </div>

        <div v-else class="content" :class="`view-${viewMode}`">
          <div v-for="section in visibleAnimeSections" :key="section.key" class="anime-section">
            <div class="section-title">
              {{ section.label }}
              <span class="section-count">{{ section.items.length }}</span>
            </div>
            <div class="anime-grid">
              <article
                v-for="entry in section.items"
                :key="entry.id"
                class="anime-card"
                role="link"
                tabindex="0"
                @click="openAnimeDetails(entry.media.id)"
                @keydown.enter.prevent="openAnimeDetails(entry.media.id)"
                @keydown.space.prevent="openAnimeDetails(entry.media.id)"
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

    <div v-else class="page friend-extra-page">
      <section class="friend-extra-main">
        <div v-if="activeTab === 'favorites'" class="friend-section-panel">
          <div class="friend-section-header">
            <div>
              <div class="friend-section-kicker">Favoris AniList</div>
              <h2 class="friend-section-title">{{ friendName || 'Ami' }} Favoris</h2>
              <p class="friend-section-copy">Animes et personnages favoris recuperes directement depuis ce profil AniList.</p>
            </div>
            <div class="friend-inline-tabs">
              <button class="friend-inline-tab" :class="{ active: favoriteTab === 'anime' }" type="button" @click="favoriteTab = 'anime'">
                Anime ({{ favoriteAnimeItems.length }})
              </button>
              <button class="friend-inline-tab" :class="{ active: favoriteTab === 'characters' }" type="button" @click="favoriteTab = 'characters'">
                Personnages ({{ favoriteCharacterItems.length }})
              </button>
            </div>
          </div>

          <div v-if="favoritesLoading" class="loading">
            <div class="spinner"></div>
            Chargement des favoris...
          </div>

          <div v-else-if="favoritesError" class="error-state">
            {{ favoritesError }}
          </div>

          <div v-else-if="activeFavoriteItems.length === 0" class="empty-state">
            Aucun favori trouvé pour ce profil.
          </div>

          <div v-else class="friend-favorites-grid">
            <article v-for="item in activeFavoriteItems" :key="`${item.kind}-${item.id}`" class="friend-favorite-card">
              <a
                class="friend-favorite-link"
                :class="{ disabled: item.kind !== 'anime' && !item.siteUrl, 'is-loading': item.kind === 'anime' && navigatingFavoriteAnimeId === item.id }"
                :href="favoriteHref(item)"
                :target="item.kind === 'anime' ? undefined : '_blank'"
                :rel="item.kind === 'anime' ? undefined : 'noopener noreferrer'"
                @click="handleFavoriteItemClick($event, item)"
              >
                <div class="friend-favorite-media">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :srcset="item.imageSrcSet"
                    :alt="item.title"
                    loading="lazy"
                    decoding="async"
                  >
                  <div v-else class="friend-favorite-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  </div>
                  <div v-if="item.kind === 'anime' && navigatingFavoriteAnimeId === item.id" class="friend-favorite-loader">
                    <div class="spinner small"></div>
                    <span>Ouverture...</span>
                  </div>
                </div>
                <div class="friend-favorite-body">
                  <div class="friend-favorite-title">{{ item.title }}</div>
                  <div class="friend-favorite-subtitle">{{ item.subtitle }}</div>
                </div>
              </a>
            </article>
          </div>
        </div>

        <div v-else-if="activeTab === 'friends'" class="friend-section-panel">
          <div class="friend-section-header">
            <div>
              <div class="friend-section-kicker">Social AniList</div>
              <h2 class="friend-section-title">{{ friendName || 'Ami' }} Amis</h2>
              <p class="friend-section-copy">Suivis mutuels sur AniList, avec les compteurs sociaux publics de ce profil.</p>
            </div>
            <div class="friend-stat-row">
              <div class="friend-stat-chip">
                <span class="friend-stat-value">{{ targetFollowingCount }}</span>
                <span class="friend-stat-label">Suit</span>
              </div>
              <div class="friend-stat-chip">
                <span class="friend-stat-value">{{ targetFollowersCount }}</span>
                <span class="friend-stat-label">Abonnes</span>
              </div>
              <div class="friend-stat-chip">
                <span class="friend-stat-value">{{ targetFriendUsers.length }}</span>
                <span class="friend-stat-label">Amis</span>
              </div>
            </div>
          </div>

          <div v-if="friendSocialLoading" class="loading">
            <div class="spinner"></div>
            Chargement des amis...
          </div>

          <div v-else-if="friendSocialError" class="error-state">
            {{ friendSocialError }}
          </div>

          <div v-else-if="targetFriendUsers.length === 0" class="empty-state">
            Aucun suivi mutuel trouvé sur ce profil AniList.
          </div>

          <div v-else class="friend-user-grid">
            <article v-for="user in targetFriendUsers" :key="user.id" class="friend-user-card">
              <div class="friend-user-banner">
                <img v-if="user.banner" :src="user.banner" alt="" />
              </div>
              <div class="friend-user-body">
                <div class="friend-user-profile">
                  <div class="friend-user-avatar">
                    <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="1.2" width="24" height="24">
                      <circle cx="12" cy="8.5" r="4" />
                      <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <div class="friend-user-copy">
                    <div class="friend-user-name">{{ user.username }}</div>
                    <div class="friend-user-meta">Inscrit {{ user.joined }}</div>
                  </div>
                </div>

                <div class="friend-user-stats">
                  <div class="friend-user-stat">
                    <span class="friend-user-stat-value">{{ user.animeCount }}</span>
                    <span class="friend-user-stat-label">Anime</span>
                  </div>
                  <div class="friend-user-stat">
                    <span class="friend-user-stat-value">{{ user.score.toFixed(1) }}</span>
                    <span class="friend-user-stat-label">Note</span>
                  </div>
                </div>

                <div class="friend-user-actions">
                  <button class="friend-ghost-btn" type="button" @click="openFriendProfile(user.id)">
                    Voir le profil
                  </button>
                  <button
                    v-if="canToggleFollowUser(user.id)"
                    class="friend-primary-btn"
                    :class="{ following: isViewerFollowing(user.id) }"
                    type="button"
                    :disabled="isViewerFollowBusy(user.id)"
                    @click="toggleViewerFollow(user.id)"
                  >
                    {{ isViewerFollowBusy(user.id) ? 'Mise a jour...' : isViewerFollowing(user.id) ? 'Suivi' : 'Suivre' }}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div v-else class="friend-section-panel">
          <div class="friend-section-header">
            <div>
              <div class="friend-section-kicker">Listes partagées PocketBase</div>
              <h2 class="friend-section-title">{{ friendName || 'Ami' }} Listes partagées</h2>
              <p class="friend-section-copy">Les listes publiques sont visibles par tous, celles reservees aux amis par les amis, et les privees uniquement par les membres.</p>
            </div>
            <div class="friend-stat-row">
              <div class="friend-stat-chip">
                <span class="friend-stat-value">{{ targetSharedLists.length }}</span>
                <span class="friend-stat-label">Listes visibles</span>
              </div>
            </div>
          </div>

          <div v-if="sharedListsLoading" class="loading">
            <div class="spinner"></div>
            Chargement des listes partagées...
          </div>

          <div v-else-if="sharedListsError" class="error-state">
            {{ sharedListsError }}
          </div>

          <div v-else-if="targetSharedLists.length === 0" class="empty-state">
            Aucune liste partagée n'est visible pour ce profil pour le moment.
          </div>

          <div v-else class="friend-shared-grid">
            <article v-for="list in targetSharedLists" :key="list.id" class="friend-shared-card">
              <div class="friend-shared-banner">
                <img :src="sharedListBannerSrc(list)" :alt="`Banniere ${list.title}`" />
                <div class="friend-shared-chip-row">
                  <span class="friend-shared-chip" :class="privacyChipClass(list.privacy)">{{ privacyLabel(list.privacy) }}</span>
                  <span class="friend-shared-chip role">{{ targetSharedListRole(list) }}</span>
                </div>
              </div>

              <button class="friend-shared-body" type="button" @click="openSharedList(list.id)">
                <div class="friend-shared-thumb">
                  <img :src="sharedListImageSrc(list)" :alt="list.title" />
                </div>
                <div class="friend-shared-content">
                  <div class="friend-shared-title-row">
                    <div class="friend-shared-title">{{ list.title }}</div>
                  </div>
                  <div class="friend-shared-meta">Propriété de {{ list.ownerName }}</div>
                  <div class="friend-shared-desc">{{ sharedListDescription(list) }}</div>
                  <div class="friend-shared-stats">
                    <span>{{ sharedListMembersLabel(list) }}</span>
                    <span>{{ list.updatedLabel }}</span>
                  </div>
                  <div class="friend-shared-members">
                    <div class="friend-shared-member-stack">
                      <div
                        v-for="member in list.members.slice(0, 4)"
                        :key="`${list.id}-member-${member.id}`"
                        class="friend-shared-member"
                        :class="{ 'has-avatar': !!member.avatar }"
                        :style="memberAvatarStyle(member)"
                      >
                        <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                        <span v-else>{{ member.initials }}</span>
                      </div>
                    </div>
                    <span v-if="!list.membersVisibilityLimited && list.memberCount > 4" class="friend-shared-more">+{{ list.memberCount - 4 }}</span>
                  </div>
                </div>
              </button>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage, type AnilistCoverVariant } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSocialStore, type SocialUser } from '~/composables/useAnilistSocialStore'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useSharedLists, type SharedListMember, type SharedListSummary } from '~/composables/useSharedLists'

definePageMeta({
  path: '/social/user/:id'
})

type FriendPageTab = 'anime-list' | 'favorites' | 'friends' | 'shared-lists'
type FavoriteTab = 'anime' | 'characters'
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
    coverImage?: AnilistCoverImage | null
  }
}

type FavoriteCard = {
  id: number
  kind: FavoriteTab
  title: string
  subtitle: string
  image: string
  imageSrcSet?: string
  siteUrl: string
}

type AniListUserNode = {
  id: number
  name: string
  createdAt?: number
  avatar?: { medium?: string | null; large?: string | null } | null
  bannerImage?: string | null
  statistics?: { anime?: { count?: number | null; meanScore?: number | null } | null } | null
}

type PocketbaseUserRecord = {
  id: string
  anilist_user_id?: string | number
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
            coverImage { medium large extraLarge }
          }
        }
      }
    }
  }
`

const favoriteAnimePageQuery = `
  query ($userId: Int, $page: Int, $perPage: Int) {
    User(id: $userId) {
      favourites {
        anime(page: $page, perPage: $perPage) {
          pageInfo { currentPage hasNextPage }
          nodes {
            id
            title { romaji english native }
            coverImage { medium large extraLarge }
            seasonYear
            format
            meanScore
            siteUrl
          }
        }
      }
    }
  }
`

const favoriteCharacterPageQuery = `
  query ($userId: Int, $page: Int, $perPage: Int) {
    User(id: $userId) {
      favourites {
        characters(page: $page, perPage: $perPage) {
          pageInfo { currentPage hasNextPage }
          nodes {
            id
            name { full userPreferred native }
            image { medium large }
            favourites
            siteUrl
          }
        }
      }
    }
  }
`

const followingQuery = `
  query ($userId: Int!, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      following(userId: $userId) {
        id
        name
        createdAt
        avatar { medium large }
        bannerImage
        statistics {
          anime {
            count
            meanScore
          }
        }
      }
    }
  }
`

const followersQuery = `
  query ($userId: Int!, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      followers(userId: $userId) {
        id
        name
        createdAt
        avatar { medium large }
        bannerImage
        statistics {
          anime {
            count
            meanScore
          }
        }
      }
    }
  }
`

const STATUS_LABELS: Record<ListStatusKey, string> = {
  CURRENT: 'En cours',
  COMPLETED: 'Termine',
  PAUSED: 'En pause',
  DROPPED: 'Abandonne',
  PLANNING: 'A voir'
}

const STATUS_ORDER: ListStatusKey[] = ['CURRENT', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING']
const SOCIAL_PALETTE = ['#4F378A', '#9256F3', '#F77F00', '#06D6A0', '#D62828', '#4361EE', '#FF6B9D', '#FFBE0B', '#6A0572', '#1DD3B0']
const DEFAULT_SHARED_LIST_BANNER = '/img/banner.webp'
const DEFAULT_SHARED_LIST_IMAGE = '/img/user.webp'

const route = useRoute()
const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const socialStore = useAnilistSocialStore()
const sharedListsStore = useSharedLists()
const { followingUsers, friendUsers, followPendingIds } = storeToRefs(socialStore)

const favoriteTab = ref<FavoriteTab>('anime')

const isLoading = ref(true)
const errorMessage = ref('')
const viewMode = ref<ViewMode>('grid')
const activeFilter = ref<FilterKey>('ALL')
const sortBy = ref<SortKey>('title')
const searchTerm = ref('')

const favoritesLoading = ref(false)
const favoritesLoaded = ref(false)
const favoritesError = ref('')
const navigatingFavoriteAnimeId = ref<number | null>(null)
const favoriteAnimeItems = ref<FavoriteCard[]>([])
const favoriteCharacterItems = ref<FavoriteCard[]>([])

const friendSocialLoading = ref(false)
const friendSocialLoaded = ref(false)
const friendSocialError = ref('')
const targetFollowingCount = ref(0)
const targetFollowersCount = ref(0)
const targetFriendUsers = ref<SocialUser[]>([])

const sharedListsLoading = ref(false)
const sharedListsLoaded = ref(false)
const sharedListsError = ref('')
const targetPocketbaseUserId = ref('')
const targetSharedLists = ref<SharedListSummary[]>([])

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
const currentAniListUserId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
const currentPocketbaseUserId = computed(() => String(authRecord.value.id || ''))
const friendUserId = computed(() => Number(route.params.id ?? 0))
const isOwnProfile = computed(() => currentAniListUserId.value > 0 && currentAniListUserId.value === friendUserId.value)
const isTargetFriend = computed(() => friendUsers.value.some(user => user.id === friendUserId.value))
const showFollowButton = computed(() => Boolean(token.value) && friendUserId.value > 0 && !isOwnProfile.value)
const isFollowingFriend = computed(() => followingUsers.value.some(user => user.id === friendUserId.value))
const isFollowBusy = computed(() => followPendingIds.value.includes(friendUserId.value))

const displayTitle = (entry: MediaListEntry) =>
  entry.media.title.romaji || entry.media.title.english || entry.media.title.native || 'Titre inconnu'

const currentCoverVariant = computed<AnilistCoverVariant>(() =>
  viewMode.value === 'grid' ? 'card' : 'thumb'
)

const normalizeFriendTab = (value: unknown): FriendPageTab => {
  const normalized = String(Array.isArray(value) ? value[0] : (value || '')).trim().toLowerCase()
  if (normalized === 'favorites') return 'favorites'
  if (normalized === 'friends') return 'friends'
  if (normalized === 'shared-lists') return 'shared-lists'
  return 'anime-list'
}

const activeTab = computed<FriendPageTab>(() => normalizeFriendTab(route.query.tab))

const activeFavoriteItems = computed(() =>
  favoriteTab.value === 'anime' ? favoriteAnimeItems.value : favoriteCharacterItems.value
)

const joinedDisplay = computed(() => formatJoined(friendJoinedAt.value))

const coverImageSrc = (entry: MediaListEntry) =>
  getAnilistCoverSrc(entry.media.coverImage, currentCoverVariant.value) || undefined

const coverImageSrcSet = (entry: MediaListEntry) =>
  getAnilistCoverSrcSet(entry.media.coverImage, currentCoverVariant.value)

const extractAniListError = (response: any) => Array.isArray(response?.errors)
  ? response.errors.map((error: any) => String(error?.message || '')).filter(Boolean).join(' | ')
  : ''

const requestAniList = async (query: string, variables: Record<string, any>, cacheTtlMs = 60_000) => {
  const run = async (requestToken: string) => {
    return await anilistGraphql.request<any>(query, variables, { token: requestToken, cacheTtlMs })
  }

  let response = await run(token.value)
  let errorMessage = extractAniListError(response)

  if (!errorMessage) return response

  const lowered = errorMessage.toLowerCase()
  const shouldRetryWithoutToken = Boolean(token.value) && (
    lowered.includes('token')
    || lowered.includes('unauthorized')
    || lowered.includes('invalid')
  )

  if (shouldRetryWithoutToken) {
    response = await run('')
    errorMessage = extractAniListError(response)
    if (!errorMessage) return response
  }

  throw new Error(errorMessage || 'La requete AniList a echoue.')
}

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
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
}

const formatSocialJoined = (timestamp?: number) => {
  if (!timestamp) return 'Inconnu'
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date)
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
    { key: 'ALL' as FilterKey, label: 'Tout', count: allCount },
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

const visibleAnimeSections = computed(() => {
  if (activeFilter.value === 'ALL') {
    return sortedAndFilteredSections.value.filter((section) => section.items.length > 0)
  }
  const selected = sortedAndFilteredSections.value.find((section) => section.key === activeFilter.value)
  if (!selected || selected.items.length === 0) return []
  return [selected]
})

const mapListsToSections = (lists: any[]) => {
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

const normalizeAnimeFavorite = (node: any): FavoriteCard => {
  const title = node?.title?.romaji || node?.title?.english || node?.title?.native || 'Titre inconnu'
  const format = node?.format ? String(node.format).replaceAll('_', ' ') : 'ANIME'
  const year = node?.seasonYear ? String(node.seasonYear) : ''
  const score = node?.meanScore ? `${Number(node.meanScore)}%` : 'Pas de note'

  return {
    id: Number(node?.id ?? 0),
    kind: 'anime',
    title,
    subtitle: [format, year, score].filter(Boolean).join(' - '),
    image: getAnilistCoverSrc(node?.coverImage as AnilistCoverImage | null, 'card') || '',
    imageSrcSet: getAnilistCoverSrcSet(node?.coverImage as AnilistCoverImage | null, 'card') || undefined,
    siteUrl: String(node?.siteUrl || '')
  }
}

const normalizeCharacterFavorite = (node: any): FavoriteCard => {
  const title = node?.name?.userPreferred || node?.name?.full || node?.name?.native || 'Personnage inconnu'
  const favCount = Number(node?.favourites ?? 0)

  return {
    id: Number(node?.id ?? 0),
    kind: 'characters',
    title,
    subtitle: favCount ? `${favCount.toLocaleString('fr-FR')} favoris` : 'Personnage',
    image: String(node?.image?.large || node?.image?.medium || ''),
    siteUrl: String(node?.siteUrl || '')
  }
}

const favoriteHref = (item: FavoriteCard) => item.kind === 'anime' ? `/anime/${item.id}` : (item.siteUrl || '#')

const shouldHandleClientNavigation = (event: MouseEvent) =>
  event.button === 0
  && !event.defaultPrevented
  && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)

const openFavoriteAnime = async (animeId: number) => {
  if (!animeId || navigatingFavoriteAnimeId.value === animeId) return
  navigatingFavoriteAnimeId.value = animeId
  try {
    await navigateTo(`/anime/${animeId}`)
  } finally {
    navigatingFavoriteAnimeId.value = null
  }
}

const handleFavoriteItemClick = (event: MouseEvent, item: FavoriteCard) => {
  if (item.kind === 'anime') {
    if (!item.id) {
      event.preventDefault()
      return
    }
    if (!shouldHandleClientNavigation(event)) return
    event.preventDefault()
    void openFavoriteAnime(item.id)
    return
  }

  if (!item.siteUrl) {
    event.preventDefault()
  }
}

const mapSocialUser = (user: AniListUserNode): SocialUser => ({
  id: Number(user.id),
  username: user.name || 'Inconnu',
  joined: formatSocialJoined(user.createdAt),
  animeCount: Number(user.statistics?.anime?.count ?? 0),
  score: Number(user.statistics?.anime?.meanScore ?? 0),
  following: false,
  isFollower: false,
  isFriend: false,
  avatar: user.avatar?.large || user.avatar?.medium || undefined,
  banner: user.bannerImage || undefined,
  avatarColor: SOCIAL_PALETTE[Math.abs(Number(user.id) || 0) % SOCIAL_PALETTE.length] || '#4F378A'
})

const isViewerFollowing = (userId: number) => followingUsers.value.some(user => user.id === userId)
const isViewerFollowBusy = (userId: number) => followPendingIds.value.includes(userId)
const canToggleFollowUser = (userId: number) => Boolean(token.value) && userId > 0 && userId !== currentAniListUserId.value

const memberAvatarStyle = (member: Pick<SharedListMember, 'avatar' | 'color'>) =>
  member.avatar ? undefined : { background: member.color }

const privacyLabel = (privacy: SharedListSummary['privacy']) =>
  privacy === 'private' ? 'Privee' : privacy === 'friends' ? 'Amis uniquement' : 'Publique'

const privacyChipClass = (privacy: SharedListSummary['privacy']) => ({
  'privacy-private': privacy === 'private',
  'privacy-friends': privacy === 'friends',
  'privacy-public': privacy === 'public'
})

const sharedListBannerSrc = (list: SharedListSummary) => String(list.bannerUrl || '').trim() || DEFAULT_SHARED_LIST_BANNER
const sharedListImageSrc = (list: SharedListSummary) => String(list.imageUrl || '').trim() || DEFAULT_SHARED_LIST_IMAGE
const targetSharedListRole = (list: SharedListSummary) => list.ownerId === targetPocketbaseUserId.value ? 'Proprietaire' : 'Membre'
const sharedListDescription = (list: SharedListSummary) =>
  list.animeVisibilityLimited
    ? 'Les entrées anime sont masquées pour ce niveau de visibilité.'
    : `${list.animeCount} anime actuellement dans cette liste partagée.`
const sharedListMembersLabel = (list: SharedListSummary) =>
  list.membersVisibilityLimited
    ? 'Membres masqués'
    : `${list.memberCount} membre${list.memberCount > 1 ? 's' : ''}`
const profileTabRoute = (tab: FriendPageTab) => ({
  path: `/social/user/${friendUserId.value}`,
  query: tab === 'anime-list' ? {} : { tab }
})

const resetAnimeState = () => {
  isLoading.value = true
  errorMessage.value = ''
  viewMode.value = 'grid'
  activeFilter.value = 'ALL'
  sortBy.value = 'title'
  searchTerm.value = ''
  rawSections.value = {
    CURRENT: [],
    COMPLETED: [],
    PAUSED: [],
    DROPPED: [],
    PLANNING: []
  }
}

const resetExtraState = () => {
  favoriteTab.value = 'anime'
  favoritesLoading.value = false
  favoritesLoaded.value = false
  favoritesError.value = ''
  navigatingFavoriteAnimeId.value = null
  favoriteAnimeItems.value = []
  favoriteCharacterItems.value = []

  friendSocialLoading.value = false
  friendSocialLoaded.value = false
  friendSocialError.value = ''
  targetFollowingCount.value = 0
  targetFollowersCount.value = 0
  targetFriendUsers.value = []

  sharedListsLoading.value = false
  sharedListsLoaded.value = false
  sharedListsError.value = ''
  targetPocketbaseUserId.value = ''
  targetSharedLists.value = []
}

const resetProfileHeader = () => {
  friendName.value = ''
  avatarUrl.value = ''
  bannerUrl.value = ''
  friendJoinedAt.value = null
}

const fetchFriendProfileAndList = async () => {
  const requestedUserId = friendUserId.value

  if (!requestedUserId) {
    errorMessage.value = 'Profil ami invalide.'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const [profileRes, listRes] = await Promise.all([
      requestAniList(profileQuery, { userId: requestedUserId }, 60_000),
      requestAniList(listQuery, { userId: requestedUserId }, 60_000)
    ])

    if (requestedUserId !== friendUserId.value) return

    const user = profileRes?.data?.User
    friendName.value = user?.name || 'Ami'
    avatarUrl.value = user?.avatar?.large || user?.avatar?.medium || ''
    bannerUrl.value = user?.bannerImage || ''
    friendJoinedAt.value = Number(user?.createdAt || 0) || null

    const lists = listRes?.data?.MediaListCollection?.lists ?? []
    rawSections.value = mapListsToSections(lists)
  } catch (error: any) {
    if (requestedUserId !== friendUserId.value) return
    errorMessage.value = error?.message || 'Impossible de charger la liste d\'animes de cet ami.'
  } finally {
    if (requestedUserId === friendUserId.value) {
      isLoading.value = false
    }
  }
}

const fetchAllFavoriteNodes = async (field: FavoriteTab) => {
  const requestedUserId = friendUserId.value
  const query = field === 'anime' ? favoriteAnimePageQuery : favoriteCharacterPageQuery
  const responseField = field === 'anime' ? 'anime' : 'characters'
  const all: any[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage && page <= 100) {
    const response = await requestAniList(query, { userId: requestedUserId, page, perPage: 50 }, 120_000)
    if (requestedUserId !== friendUserId.value) return []

    const connection = response?.data?.User?.favourites?.[responseField]
    const nodes = Array.isArray(connection?.nodes) ? connection.nodes : []
    const pageInfo = connection?.pageInfo
    all.push(...nodes)
    hasNextPage = Boolean(pageInfo?.hasNextPage)
    page = Number(pageInfo?.currentPage ?? page) + 1
  }

  return all
}

const loadTargetFavorites = async (force = false) => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return
  if (favoritesLoading.value || (favoritesLoaded.value && !force)) return

  favoritesLoading.value = true
  favoritesError.value = ''

  try {
    const [animeNodes, characterNodes] = await Promise.all([
      fetchAllFavoriteNodes('anime'),
      fetchAllFavoriteNodes('characters')
    ])

    if (requestedUserId !== friendUserId.value) return

    favoriteAnimeItems.value = animeNodes.map(normalizeAnimeFavorite)
    favoriteCharacterItems.value = characterNodes.map(normalizeCharacterFavorite)
    favoritesLoaded.value = true
  } catch (error: any) {
    if (requestedUserId !== friendUserId.value) return
    favoritesError.value = error?.message || 'Impossible de charger les favoris.'
  } finally {
    if (requestedUserId === friendUserId.value) {
      favoritesLoading.value = false
    }
  }
}

const fetchPagedTargetUsers = async (query: string, field: 'following' | 'followers') => {
  const requestedUserId = friendUserId.value
  const all: AniListUserNode[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage && page <= 100) {
    const response = await requestAniList(query, { userId: requestedUserId, page, perPage: 50 }, 60_000)
    if (requestedUserId !== friendUserId.value) return []

    const pageNode = response?.data?.Page
    const chunk = (pageNode?.[field] ?? []) as AniListUserNode[]
    all.push(...chunk)
    hasNextPage = Boolean(pageNode?.pageInfo?.hasNextPage)
    page += 1
  }

  return all
}

const loadTargetFriends = async (force = false) => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return
  if (friendSocialLoading.value || (friendSocialLoaded.value && !force)) return

  friendSocialLoading.value = true
  friendSocialError.value = ''

  try {
    const [followingResult, followersResult] = await Promise.allSettled([
      fetchPagedTargetUsers(followingQuery, 'following'),
      fetchPagedTargetUsers(followersQuery, 'followers')
    ])

    if (requestedUserId !== friendUserId.value) return

    const followingRaw = followingResult.status === 'fulfilled' ? followingResult.value : []
    const followersRaw = followersResult.status === 'fulfilled' ? followersResult.value : []

    if (followingResult.status === 'rejected' && followersResult.status === 'rejected') {
      const details = [followingResult.reason?.message, followersResult.reason?.message].filter(Boolean).join(' | ')
      throw new Error(details || 'Les données sociales AniList sont indisponibles.')
    }

    targetFollowingCount.value = followingRaw.length
    targetFollowersCount.value = followersRaw.length

    const followersIds = new Set(followersRaw.map(user => Number(user.id)))
    targetFriendUsers.value = followingRaw
      .filter(user => followersIds.has(Number(user.id)))
      .map((user) => {
        const mapped = mapSocialUser(user)
        mapped.following = true
        mapped.isFollower = true
        mapped.isFriend = true
        return mapped
      })

    friendSocialLoaded.value = true
  } catch (error: any) {
    if (requestedUserId !== friendUserId.value) return
    friendSocialError.value = error?.message || 'Impossible de charger les amis AniList.'
  } finally {
    if (requestedUserId === friendUserId.value) {
      friendSocialLoading.value = false
    }
  }
}

const resolveTargetPocketbaseUserId = async () => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return ''

  const result = await pocketbaseStore.pb.collection('user').getList<PocketbaseUserRecord>(1, 1, {
    filter: `anilist_user_id=${requestedUserId}`,
    requestKey: null
  })

  if (requestedUserId !== friendUserId.value) return ''
  return String(result.items[0]?.id || '')
}

const loadTargetSharedLists = async (force = false) => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return
  if (sharedListsLoading.value || (sharedListsLoaded.value && !force)) return

  sharedListsLoading.value = true
  sharedListsError.value = ''

  try {
    if (!currentPocketbaseUserId.value) {
      sharedListsError.value = 'Connectez-vous pour voir les listes partagées.'
      sharedListsLoaded.value = true
      return
    }

    const targetUserRecordId = await resolveTargetPocketbaseUserId()
    if (requestedUserId !== friendUserId.value) return

    targetPocketbaseUserId.value = targetUserRecordId
    if (!targetUserRecordId) {
      targetSharedLists.value = []
      sharedListsLoaded.value = true
      return
    }

    const summaries = await sharedListsStore.loadProfileSummaries({
      targetUserId: targetUserRecordId,
      viewerIsFriend: isTargetFriend.value
    })
    if (requestedUserId !== friendUserId.value) return

    targetSharedLists.value = summaries
    sharedListsLoaded.value = true
  } catch (error: any) {
    if (requestedUserId !== friendUserId.value) return
    sharedListsError.value = error?.message || 'Impossible de charger les listes partagées.'
  } finally {
    if (requestedUserId === friendUserId.value) {
      sharedListsLoading.value = false
    }
  }
}

const ensureActiveTabData = async () => {
  if (activeTab.value === 'favorites') {
    await loadTargetFavorites()
    return
  }

  if (activeTab.value === 'friends') {
    await loadTargetFriends()
    return
  }

  if (activeTab.value === 'shared-lists') {
    await loadTargetSharedLists()
  }
}

const openFriendProfile = (targetId: number) => {
  const id = Number(targetId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/social/user/${id}`)
}

const openAnimeDetails = (animeId?: number | null) => {
  const id = Number(animeId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/anime/${id}`)
}

const openSharedList = (listId: string) => {
  if (!listId) return
  navigateTo(`/sharedLists/${listId}`)
}

const toggleFollowFromBanner = async () => {
  if (!showFollowButton.value || isFollowBusy.value) return

  try {
    await socialStore.toggleFollowUser(friendUserId.value)
  } catch (error: any) {
    errorMessage.value = error?.message || 'Impossible de mettre a jour le suivi AniList.'
  }
}

const toggleViewerFollow = async (targetId: number) => {
  if (!canToggleFollowUser(targetId) || isViewerFollowBusy(targetId)) return

  try {
    await socialStore.toggleFollowUser(targetId)
  } catch (error: any) {
    friendSocialError.value = error?.message || 'Impossible de mettre a jour le suivi AniList.'
  }
}

watch(activeTab, () => {
  void ensureActiveTabData()
})

watch(isTargetFriend, (next, previous) => {
  if (next === previous || activeTab.value !== 'shared-lists') return
  sharedListsLoaded.value = false
  void loadTargetSharedLists(true)
})

watch(friendUserId, async () => {
  resetAnimeState()
  resetExtraState()
  resetProfileHeader()

  const socialPromise = socialStore.loadSocial().catch(() => undefined)
  await Promise.all([
    fetchFriendProfileAndList(),
    socialPromise
  ])

  await ensureActiveTabData()
}, { immediate: true })
</script>

<style scoped src="~/assets/css/pages/animeList.css"></style>
<style scoped src="~/assets/css/pages/socialUser.css"></style>

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

.friend-profile-page .sub-tabs-bar {
  position: relative;
  z-index: 6;
}

.friend-profile-page .sub-tabs {
  position: relative;
  z-index: 1;
}

.friend-profile-page .sub-tab {
  cursor: pointer;
  position: relative;
  z-index: 1;
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

.friend-profile-page .banner-follow-action {
  position: absolute;
  right: clamp(16px, 2.4vw, 40px);
  bottom: 22px;
  z-index: 3;
}

.friend-profile-page .banner-follow-btn {
  min-width: 132px;
  height: 42px;
  border: 1px solid rgba(61, 180, 242, 0.45);
  border-radius: 999px;
  background: rgba(61, 180, 242, 0.14);
  color: #8edcff;
  font-size: 13px;
  font-weight: 800;
  font-family: 'Overpass', sans-serif;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.friend-profile-page .banner-follow-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(61, 180, 242, 0.24);
}

.friend-profile-page .banner-follow-btn.following {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ff9d9d;
}

.friend-profile-page .banner-follow-btn.following:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.24);
}

.friend-profile-page .banner-follow-btn:disabled {
  opacity: 0.72;
  cursor: default;
  transform: none;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .friend-profile-page .banner-follow-action {
    right: 16px;
    bottom: 16px;
  }

  .friend-profile-page .banner-meta {
    transform: none;
    padding-bottom: 12px;
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

  .friend-profile-page .banner-follow-btn {
    min-width: 118px;
    height: 38px;
    font-size: 12px;
  }

  .compare-box {
    width: 100%;
    flex-wrap: wrap;
  }

  .compare-btn {
    width: 100%;
    justify-content: center;
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

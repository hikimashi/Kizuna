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
          {{ isFollowBusy ? 'Mise à jour...' : isFollowingFriend ? 'Ne plus suivre' : 'Suivre' }}
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
              <p class="friend-section-copy">Animes et personnages favoris récupérés directement depuis ce profil AniList.</p>
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
                <span class="friend-stat-label">Abonnés</span>
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
                    {{ isViewerFollowBusy(user.id) ? 'Mise à jour...' : isViewerFollowing(user.id) ? 'Suivi' : 'Suivre' }}
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
              <p class="friend-section-copy">Les listes publiques sont visibles par tous, celles reservees aux amis par les amis, et les privées uniquement par les membres.</p>
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
                <img :src="sharedListBannerSrc(list)" :alt="`Bannière ${list.title}`" />
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
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


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
  COMPLETED: 'Terminé',
  PAUSED: 'En pause',
  DROPPED: 'Abandonné',
  PLANNING: 'À voir'
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
// Le bouton de suivi n'apparaît que pour un autre profil et avec un token AniList utilisable.
const showFollowButton = computed(() => Boolean(token.value) && friendUserId.value > 0 && !isOwnProfile.value)
const isFollowingFriend = computed(() => followingUsers.value.some(user => user.id === friendUserId.value))
const isFollowBusy = computed(() => followPendingIds.value.includes(friendUserId.value))

/**
 * Calcule la valeur « display title ».
 *
 * @param entry - Valeur utilisée par le traitement « display title ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const displayTitle = (entry: MediaListEntry) =>
  entry.media.title.romaji || entry.media.title.english || entry.media.title.native || 'Titre inconnu'

const currentCoverVariant = computed<AnilistCoverVariant>(() =>
  viewMode.value === 'grid' ? 'card' : 'thumb'
)

/**
 * Normalise friend tab.
 *
 * @param value - Valeur utilisée par le traitement « normalize friend tab ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeFriendTab = (value: unknown): FriendPageTab => {
  // La query peut arriver en string ou tableau selon le routeur; on garde un onglet par défaut stable.
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

/**
 * Calcule la valeur « cover image src ».
 *
 * @param entry - Valeur utilisée par le traitement « cover image src ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const coverImageSrc = (entry: MediaListEntry) =>
  getAnilistCoverSrc(entry.media.coverImage, currentCoverVariant.value) || undefined

/**
 * Calcule la valeur « cover image src set ».
 *
 * @param entry - Valeur utilisée par le traitement « cover image src set ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const coverImageSrcSet = (entry: MediaListEntry) =>
  getAnilistCoverSrcSet(entry.media.coverImage, currentCoverVariant.value)

/**
 * Calcule la valeur « extract ani list error ».
 *
 * @param response - Valeur utilisée par le traitement « extract ani list error ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const extractAniListError = (response: any) => Array.isArray(response?.errors)
  ? response.errors.map((error: any) => String(error?.message || '')).filter(Boolean).join(' | ')
  : ''

/**
 * Exécute ani list.
 *
 * @param query - Valeur utilisée par le traitement « request ani list ».
 * @param variables - Valeur utilisée par le traitement « request ani list ».
 * @param cacheTtlMs - Valeur utilisée par le traitement « request ani list ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects effectue des appels réseau ou persistants.
 */
const requestAniList = async (query: string, variables: Record<string, any>, cacheTtlMs = 60_000) => {
  /**
   * Calcule la valeur « run ».
   *
   * @param requestToken - Valeur utilisée par le traitement « run ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const run = async (requestToken: string) => {
    return await anilistGraphql.request<any>(query, variables, { token: requestToken, cacheTtlMs })
  }

  // Certaines pages publiques échouent avec un token invalide/expiré; on retente alors sans token.
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
    // Les profils publics doivent rester lisibles même si le token local est expiré.
    response = await run('')
    errorMessage = extractAniListError(response)
    if (!errorMessage) return response
  }

  throw new Error(errorMessage || 'La requête AniList a échoué.')
}

/**
 * Normalise date.
 *
 * @param entry - Valeur utilisée par le traitement « normalize date ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeDate = (entry: MediaListEntry): number => {
  const y = entry.startedAt?.year ?? 0
  const m = entry.startedAt?.month ?? 0
  const d = entry.startedAt?.day ?? 0
  return y * 10000 + m * 100 + d
}

/**
 * Formate score.
 *
 * @param score - Valeur utilisée par le traitement « format score ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const formatScore = (score: number) => {
  if (!score) return '-'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

/**
 * Formate joined.
 *
 * @param timestamp - Valeur utilisée par le traitement « format joined ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const formatJoined = (timestamp?: number | null) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
}

/**
 * Formate social joined.
 *
 * @param timestamp - Valeur utilisée par le traitement « format social joined ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const formatSocialJoined = (timestamp?: number) => {
  if (!timestamp) return 'Inconnu'
  const date = new Date(timestamp * 1000)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date)
}

/**
 * Calcule la valeur « status dot class ».
 *
 * @param status - Valeur utilisée par le traitement « status dot class ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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
  /**
   * Calcule la valeur « sorter ».
   *
   * @param a - Valeur utilisée par le traitement « sorter ».
   * @param b - Valeur utilisée par le traitement « sorter ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects modifie l'état réactif.
   */
  const sorter = (a: MediaListEntry, b: MediaListEntry) => {
    // Un seul comparateur pilote tous les modes de tri de la liste anime.
    if (sortBy.value === 'title') return displayTitle(a).localeCompare(displayTitle(b))
    if (sortBy.value === 'score') return (b.score || 0) - (a.score || 0)
    if (sortBy.value === 'progress') return (b.progress || 0) - (a.progress || 0)
    if (sortBy.value === 'startDate') return normalizeDate(b) - normalizeDate(a)
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  }

  return STATUS_ORDER.map((status) => {
    const baseItems = rawSections.value[status] ?? []
    const filtered = baseItems.filter((entry) => {
      // La recherche reste volontairement limitee au titre pour garder un comportement previsible.
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
    // En mode global, on masque les sections vides pour réduire le bruit visuel.
    return sortedAndFilteredSections.value.filter((section) => section.items.length > 0)
  }
  const selected = sortedAndFilteredSections.value.find((section) => section.key === activeFilter.value)
  if (!selected || selected.items.length === 0) return []
  return [selected]
})

/**
 * Convertit lists to sections.
 *
 * @param lists - Valeur utilisée par le traitement « map lists to sections ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects modifie l'état réactif.
 */
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
    // AniList peut renvoyer d'autres listes; seules celles supportees par l'UI sont conservees.
    if (!STATUS_ORDER.includes(key)) continue
    const entries = Array.isArray(list.entries) ? list.entries : []
    nextSections[key].push(...entries)
  }

  return nextSections
}

/**
 * Normalise anime favorite.
 *
 * @param node - Valeur utilisée par le traitement « normalize anime favorite ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeAnimeFavorite = (node: any): FavoriteCard => {
  const title = node?.title?.romaji || node?.title?.english || node?.title?.native || 'Titre inconnu'
  const format = node?.format ? String(node.format).replaceAll('_', ' ') : 'ANIME'
  const year = node?.seasonYear ? String(node.seasonYear) : ''
  const score = node?.meanScore ? `${Number(node.meanScore)}%` : 'Pas de note'

  return {
    // Le modele FavoriteCard unifie navigation interne anime et liens externes personnages.
    id: Number(node?.id ?? 0),
    kind: 'anime',
    title,
    subtitle: [format, year, score].filter(Boolean).join(' - '),
    image: getAnilistCoverSrc(node?.coverImage as AnilistCoverImage | null, 'card') || '',
    imageSrcSet: getAnilistCoverSrcSet(node?.coverImage as AnilistCoverImage | null, 'card') || undefined,
    siteUrl: String(node?.siteUrl || '')
  }
}

/**
 * Normalise character favorite.
 *
 * @param node - Valeur utilisée par le traitement « normalize character favorite ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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

/**
 * Calcule la valeur « favorite href ».
 *
 * @param item - Valeur utilisée par le traitement « favorite href ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const favoriteHref = (item: FavoriteCard) => item.kind === 'anime' ? `/anime/${item.id}` : (item.siteUrl || '#')

/**
 * Calcule la valeur « should handle client navigation ».
 *
 * @param event - Valeur utilisée par le traitement « should handle client navigation ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const shouldHandleClientNavigation = (event: MouseEvent) =>
  // Respecte les clics navigateur standards: nouvel onglet, nouvelle fenêtre, etc.
  event.button === 0
  && !event.defaultPrevented
  && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)

/**
 * Ouvre favorite anime.
 *
 * @param animeId - Valeur utilisée par le traitement « open favorite anime ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const openFavoriteAnime = async (animeId: number) => {
  if (!animeId || navigatingFavoriteAnimeId.value === animeId) return
  navigatingFavoriteAnimeId.value = animeId
  try {
    await navigateTo(`/anime/${animeId}`)
  } finally {
    navigatingFavoriteAnimeId.value = null
  }
}

/**
 * Traite favorite item click.
 *
 * @param event - Valeur utilisée par le traitement « handle favorite item click ».
 * @param item - Valeur utilisée par le traitement « handle favorite item click ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const handleFavoriteItemClick = (event: MouseEvent, item: FavoriteCard) => {
  if (item.kind === 'anime') {
    // Les favoris anime naviguent via Nuxt pour garder l'état SPA.
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

/**
 * Convertit social user.
 *
 * @param user - Valeur utilisée par le traitement « map social user ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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

/**
 * Indique si viewer following.
 *
 * @param userId - Valeur utilisée par le traitement « is viewer following ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const isViewerFollowing = (userId: number) => followingUsers.value.some(user => user.id === userId)
/**
 * Indique si viewer follow busy.
 *
 * @param userId - Valeur utilisée par le traitement « is viewer follow busy ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const isViewerFollowBusy = (userId: number) => followPendingIds.value.includes(userId)
/**
 * Calcule la valeur « can toggle follow user ».
 *
 * @param userId - Valeur utilisée par le traitement « can toggle follow user ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const canToggleFollowUser = (userId: number) => Boolean(token.value) && userId > 0 && userId !== currentAniListUserId.value

/**
 * Calcule la valeur « member avatar style ».
 *
 * @param member - Valeur utilisée par le traitement « member avatar style ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const memberAvatarStyle = (member: Pick<SharedListMember, 'avatar' | 'color'>) =>
  member.avatar ? undefined : { background: member.color }

/**
 * Calcule la valeur « privacy label ».
 *
 * @param privacy - Valeur utilisée par le traitement « privacy label ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const privacyLabel = (privacy: SharedListSummary['privacy']) =>
  privacy === 'private' ? 'Privée' : privacy === 'friends' ? 'Amis uniquement' : 'Publique'

/**
 * Calcule la valeur « privacy chip class ».
 *
 * @param privacy - Valeur utilisée par le traitement « privacy chip class ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const privacyChipClass = (privacy: SharedListSummary['privacy']) => ({
  'privacy-private': privacy === 'private',
  'privacy-friends': privacy === 'friends',
  'privacy-public': privacy === 'public'
})

/**
 * Calcule la valeur « shared list banner src ».
 *
 * @param list - Valeur utilisée par le traitement « shared list banner src ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const sharedListBannerSrc = (list: SharedListSummary) => String(list.bannerUrl || '').trim() || DEFAULT_SHARED_LIST_BANNER
/**
 * Calcule la valeur « shared list image src ».
 *
 * @param list - Valeur utilisée par le traitement « shared list image src ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const sharedListImageSrc = (list: SharedListSummary) => String(list.imageUrl || '').trim() || DEFAULT_SHARED_LIST_IMAGE
/**
 * Calcule la valeur « target shared list role ».
 *
 * @param list - Valeur utilisée par le traitement « target shared list role ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const targetSharedListRole = (list: SharedListSummary) => list.ownerId === targetPocketbaseUserId.value ? 'Proprietaire' : 'Membre'
/**
 * Calcule la valeur « shared list description ».
 *
 * @param list - Valeur utilisée par le traitement « shared list description ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const sharedListDescription = (list: SharedListSummary) =>
  list.animeVisibilityLimited
    ? 'Les entrées anime sont masquées pour ce niveau de visibilité.'
    : `${list.animeCount} anime actuellement dans cette liste partagée.`
/**
 * Calcule la valeur « shared list members label ».
 *
 * @param list - Valeur utilisée par le traitement « shared list members label ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const sharedListMembersLabel = (list: SharedListSummary) =>
  list.membersVisibilityLimited
    ? 'Membres masqués'
    : `${list.memberCount} membre${list.memberCount > 1 ? 's' : ''}`
/**
 * Calcule la valeur « profile tab route ».
 *
 * @param tab - Valeur utilisée par le traitement « profile tab route ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const profileTabRoute = (tab: FriendPageTab) => ({
  path: `/social/user/${friendUserId.value}`,
  query: tab === 'anime-list' ? {} : { tab }
})

/**
 * Réinitialise anime state.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const resetAnimeState = () => {
  // État principal de la liste anime, remis à zéro à chaque changement de profil.
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

/**
 * Réinitialise extra state.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const resetExtraState = () => {
  // Les onglets secondaires ont chacun leur cache/loader pour le chargement à la demande.
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

/**
 * Réinitialise profile header.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif.
 */
const resetProfileHeader = () => {
  friendName.value = ''
  avatarUrl.value = ''
  bannerUrl.value = ''
  friendJoinedAt.value = null
}

/**
 * Récupère friend profile and list.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const fetchFriendProfileAndList = async () => {
  const requestedUserId = friendUserId.value

  // Snapshot de route utilisé plus bas pour ignorer les réponses devenues obsolètes.
  if (!requestedUserId) {
    errorMessage.value = 'Profil ami invalide.'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    // Profil et liste anime sont independants; on les charge ensemble pour reduire le temps percu.
    const [profileRes, listRes] = await Promise.all([
      requestAniList(profileQuery, { userId: requestedUserId }, 60_000),
      requestAniList(listQuery, { userId: requestedUserId }, 60_000)
    ])

    // Si l'utilisateur change de profil avant la fin, on ignore la réponse devenue obsolète.
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

/**
 * Récupère all favorite nodes.
 *
 * @param field - Valeur utilisée par le traitement « fetch all favorite nodes ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const fetchAllFavoriteNodes = async (field: FavoriteTab) => {
  const requestedUserId = friendUserId.value
  const query = field === 'anime' ? favoriteAnimePageQuery : favoriteCharacterPageQuery
  const responseField = field === 'anime' ? 'anime' : 'characters'
  const all: any[] = []
  let page = 1
  let hasNextPage = true

  // AniList pagine les favoris; 100 pages servent de limite de sécurité.
  while (hasNextPage && page <= 100) {
    const response = await requestAniList(query, { userId: requestedUserId, page, perPage: 50 }, 120_000)
    // Si la route change pendant la pagination, on abandonne le résultat courant.
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

/**
 * Charge target favorites.
 *
 * @param force - Valeur utilisée par le traitement « load target favorites ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const loadTargetFavorites = async (force = false) => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return
  if (favoritesLoading.value || (favoritesLoaded.value && !force)) return

  favoritesLoading.value = true
  favoritesError.value = ''

  try {
    // Anime et personnages favoris sont charges en parallele, puis normalises separement.
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

/**
 * Récupère paged target users.
 *
 * @param query - Valeur utilisée par le traitement « fetch paged target users ».
 * @param field - Valeur utilisée par le traitement « fetch paged target users ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const fetchPagedTargetUsers = async (query: string, field: 'following' | 'followers') => {
  const requestedUserId = friendUserId.value
  const all: AniListUserNode[] = []
  let page = 1
  let hasNextPage = true

  // Charge toutes les pages follow/followers pour pouvoir calculer les amis mutuels.
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

/**
 * Charge target friends.
 *
 * @param force - Valeur utilisée par le traitement « load target friends ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const loadTargetFriends = async (force = false) => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return
  if (friendSocialLoading.value || (friendSocialLoaded.value && !force)) return

  friendSocialLoading.value = true
  friendSocialError.value = ''

  try {
    // allSettled garde une partie des données si followers ou following échoue seul.
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
    // Ami mutuel = présent à la fois dans les follows et les followers du profil cible.
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

/**
 * Résout target pocketbase user id.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects effectue des appels réseau ou persistants.
 */
const resolveTargetPocketbaseUserId = async () => {
  const requestedUserId = friendUserId.value
  if (!requestedUserId) return ''

  // Pont AniList -> PocketBase pour retrouver les listes partagees Kizuna du profil public.
  const result = await pocketbaseStore.pb.collection('user').getList<PocketbaseUserRecord>(1, 1, {
    filter: `anilist_user_id=${requestedUserId}`,
    requestKey: null
  })

  if (requestedUserId !== friendUserId.value) return ''
  return String(result.items[0]?.id || '')
}

/**
 * Charge target shared lists.
 *
 * @param force - Valeur utilisée par le traitement « load target shared lists ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
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
      // L'utilisateur existe sur AniList mais pas dans Kizuna.
      targetSharedLists.value = []
      sharedListsLoaded.value = true
      return
    }

    // Le paramètre viewerIsFriend ouvre les listes "amis" quand la relation AniList est mutuelle.
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

/**
 * Garantit active tab data.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const ensureActiveTabData = async () => {
  // Les onglets secondaires sont chargés à la demande pour ne pas saturer AniList au premier rendu.
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

/**
 * Ouvre friend profile.
 *
 * @param targetId - Valeur utilisée par le traitement « open friend profile ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const openFriendProfile = (targetId: number) => {
  const id = Number(targetId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/social/user/${id}`)
}

/**
 * Ouvre anime details.
 *
 * @param animeId - Valeur utilisée par le traitement « open anime details ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const openAnimeDetails = (animeId?: number | null) => {
  const id = Number(animeId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/anime/${id}`)
}

/**
 * Ouvre shared list.
 *
 * @param listId - Valeur utilisée par le traitement « open shared list ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const openSharedList = (listId: string) => {
  if (!listId) return
  navigateTo(`/sharedLists/${listId}`)
}

/**
 * Bascule follow from banner.
 *
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const toggleFollowFromBanner = async () => {
  if (!showFollowButton.value || isFollowBusy.value) return

  try {
    // Le store social gère le pending id et le basculement follow/unfollow AniList.
    await socialStore.toggleFollowUser(friendUserId.value)
  } catch (error: any) {
    errorMessage.value = error?.message || 'Impossible de mettre à jour le suivi AniList.'
  }
}

/**
 * Bascule viewer follow.
 *
 * @param targetId - Valeur utilisée par le traitement « toggle viewer follow ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects modifie l'état réactif.
 */
const toggleViewerFollow = async (targetId: number) => {
  if (!canToggleFollowUser(targetId) || isViewerFollowBusy(targetId)) return

  try {
    await socialStore.toggleFollowUser(targetId)
  } catch (error: any) {
    friendSocialError.value = error?.message || 'Impossible de mettre à jour le suivi AniList.'
  }
}

watch(activeTab, () => {
  // Les données d'onglet sont chargées au moment où l'utilisateur y accède.
  void ensureActiveTabData()
})

watch(isTargetFriend, (next, previous) => {
  if (next === previous || activeTab.value !== 'shared-lists') return
  // Devenir ami peut rendre visibles des listes supplementaires.
  sharedListsLoaded.value = false
  void loadTargetSharedLists(true)
})

watch(friendUserId, async () => {
  // Route dynamique: on repart d'un état vide avant de charger le nouveau profil.
  resetAnimeState()
  resetExtraState()
  resetProfileHeader()

  const socialPromise = socialStore.loadSocial().catch(() => undefined)
  // Profil et relations du viewer chargent en parallele pour calculer ensuite les droits sociaux.
  await Promise.all([
    fetchFriendProfileAndList(),
    socialPromise
  ])

  await ensureActiveTabData()
}, { immediate: true })
</script>

<style scoped src="~/assets/css/pages/animeList.css"></style>
<style scoped src="~/assets/css/pages/socialUser.css"></style>

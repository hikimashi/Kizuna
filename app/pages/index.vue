<template>
  <div class="kizuna-page">
    <template v-if="!hasAuthRecord">
      <section class="hero-section">
        <div class="hero-content">
          <div class="eyebrow-pill fade-up">
            <span class="pulsing-dot"></span>
            <span>Powered by AniList API</span>
          </div>

          <h1 class="hero-title fade-up">
            Your anime,<br />
            <em>shared</em> together.
          </h1>

          <p class="hero-subtitle fade-up">
            Kizuna connects your AniList profile with your friends. Build joint watchlists,
            track progress together, and discover what to watch next, as a group.
          </p>

          <div class="cta-buttons fade-up">
            <button @click="openLoginDrawer" class="btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hero-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
              Sign in
            </button>
            <button @click="scrollToFeatures" class="btn-secondary">
              Learn more
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div class="stats-row fade-up">
            <div class="stat-item">
              <span class="stat-label">POWERED BY</span>
              <span class="stat-value">AniList</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">SHARED LISTS</span>
              <span class="stat-value stat-infinity">∞</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">ALWAYS</span>
              <span class="stat-value">Free</span>
            </div>
          </div>
        </div>
      </section>

      <section ref="featuresSection" class="features-section">
        <div class="features-content">
          <span class="section-label">WHY KIZUNA</span>
          <h2 class="section-title">
            Everything you need to<br />
            <span>watch together</span>
          </h2>

          <div class="features-grid">
            <div
              v-for="(feature, index) in features"
              :key="index"
              :ref="(el) => setCardRef(el, index)"
              class="feature-card"
              :class="{ visible: featureVisible[index] }"
            >
              <div v-if="!featureVisible[index]" class="card-spinner">
                <div class="spinner-ring"></div>
              </div>
              <div v-else class="card-content">
                <div class="feature-icon">
                  <span v-html="feature.iconSvg"></span>
                </div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template v-else>
      <template v-if="isAniListLinked">
        <div class="dashboard-container">
          <div class="dashboard-grid">
            <div class="dashboard-panel">
              <h2 class="panel-title">Shared lists</h2>
              <div class="search-bar">
                <svg class="hamburger-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                </svg>
                <input v-model.trim="dashboardListSearch" type="text" placeholder="Search a list" />
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>

              <div v-if="dashboardListsLoading" class="dashboard-empty-state">
                Loading shared lists...
              </div>
              <div v-else-if="dashboardListsError" class="dashboard-empty-state dashboard-error-state">
                {{ dashboardListsError }}
              </div>
              <div v-else-if="filteredDashboardLists.length" class="lists-container">
                <NuxtLink v-for="list in filteredDashboardLists" :key="list.id" class="list-item" :to="`/sharedLists/${list.id}`">
                  <div class="list-item-banner" aria-hidden="true">
                    <img :src="dashboardListBannerSrc(list)" alt="" loading="lazy" decoding="async">
                    <div class="list-item-banner-overlay"></div>
                  </div>
                  <div class="list-item-thumb">
                    <img :src="dashboardListImageSrc(list)" :alt="`${list.title} image`" loading="lazy" decoding="async">
                  </div>
                  <div class="list-item-copy">
                    <span class="list-item-name">{{ list.title }}</span>
                    <span class="list-item-meta">{{ list.memberCount }} members &middot; {{ list.animeCount }} anime</span>
                    <span class="list-item-owner">Owned by {{ list.ownerName }}</span>
                  </div>
                </NuxtLink>
              </div>
              <div v-else class="dashboard-empty-state">
                No shared list found.
              </div>
            </div>

            <div class="dashboard-panel">
              <div class="panel-header">
                <h2 class="panel-title">Friends</h2>
                <button class="add-friend-btn" type="button" @click="openFollowModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>

              <div v-if="friendsLoading" class="dashboard-empty-state">
                Loading friends...
              </div>
              <div v-else-if="friendsError" class="dashboard-empty-state dashboard-error-state">
                {{ friendsError }}
              </div>
              <div v-else-if="dashboardFriends.length" class="friends-grid">
                <button
                  v-for="friend in dashboardFriends"
                  :key="friend.id"
                  class="friend-card"
                  type="button"
                  @click="openFriendProfile(friend.id)"
                >
                  <div class="friend-avatar" :style="friend.avatar ? undefined : { background: friend.avatarColor }">
                    <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.username">
                    <span v-else>{{ friendInitials(friend.username) }}</span>
                  </div>
                  <span class="friend-name">{{ friend.username }}</span>
                </button>
              </div>
              <div v-else class="dashboard-empty-state">
                No mutual friends yet.
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <section class="anilist-link-cta">
          <div class="anilist-link-card">
            <p class="anilist-link-label">AniList connection required</p>
            <h2>Link your AniList account to continue</h2>
            <p>
              Connect once to sync your profile, banner, and anime data before using the dashboard.
            </p>
            <button class="anilist-link-button" @click="connectAniList">
              Link AniList account
            </button>
          </div>
        </section>
      </template>
    </template>

    <Teleport to="body">
      <div v-if="isFollowModalOpen" class="follow-modal-layer" @click.self="closeFollowModal">
        <div class="follow-modal">
          <div class="follow-modal-head">
            <div>
              <p class="follow-modal-kicker">Find users</p>
              <h2>Search users to follow</h2>
            </div>
            <button class="follow-modal-close" type="button" @click="closeFollowModal">×</button>
          </div>

          <label class="follow-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              v-model.trim="followSearchQuery"
              type="text"
              placeholder="Search AniList username"
              @input="handleFollowSearch"
            >
          </label>

          <div v-if="isSearchingUsers" class="follow-search-state">
            Searching AniList users...
          </div>
          <div v-else-if="followSearchError" class="follow-search-state dashboard-error-state">
            {{ followSearchError }}
          </div>
          <div v-else-if="followSearchQuery.length >= 2 && !followSearchResults.length" class="follow-search-state">
            No matching user found.
          </div>

          <div v-if="followSearchResults.length" class="follow-results">
            <div
              v-for="user in followSearchResults"
              :key="user.id"
              class="follow-result-card"
              role="button"
              tabindex="0"
              @click="openUserFromSearch(user)"
              @keydown.enter.prevent="openUserFromSearch(user)"
              @keydown.space.prevent="openUserFromSearch(user)"
            >
              <div class="follow-result-main">
                <div class="follow-result-avatar" :style="user.avatar ? undefined : { background: user.color }">
                  <img v-if="user.avatar" :src="user.avatar" :alt="user.name">
                  <span v-else>{{ user.initials }}</span>
                </div>
                <div class="follow-result-copy">
                  <div class="follow-result-name">{{ user.name }}</div>
                  <div class="follow-result-subtitle">
                    {{ `AniList #${user.anilistUserId} · ${user.animeCount} anime · score ${user.meanScore || '-'}` }}
                  </div>
                  <div class="follow-result-badges">
                    <span v-if="isFollowBusy(user.anilistUserId)" class="follow-badge">Updating...</span>
                    <span v-if="user.alreadyFriend" class="follow-badge follow-badge-friend">Already friend</span>
                    <span v-else-if="user.inKizuna" class="follow-badge follow-badge-kizuna">On Kizuna</span>
                    <span v-else class="follow-badge">AniList only</span>
                  </div>
                </div>
              </div>

              <div class="follow-result-actions">
                <button
                  class="follow-action-btn follow-action-primary"
                  type="button"
                  :disabled="!user.anilistUserId || user.alreadyFriend || isFollowBusy(user.anilistUserId)"
                  @click.stop="followUserFromSearch(user)"
                >
                  {{ isFollowBusy(user.anilistUserId) ? 'Updating...' : user.alreadyFriend ? 'Friend added' : 'Follow' }}
                </button>
              </div>
            </div>
          </div>

          <p class="follow-modal-note">
            Search now comes from AniList directly. If the profile is already synced on Kizuna, it is marked in the result card.
          </p>
        </div>
      </div>
    </Teleport>

    <ScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useDrawersStore } from '~/composables/useDrawersStore'
import { useAnilistAuthStore } from '~/composables/useAnilistAuthStore'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useSharedLists, type SharedListSummary } from '~/composables/useSharedLists'
import { useAnilistSocialStore, type SocialUser } from '~/composables/useAnilistSocialStore'

const pocketbaseStore = usePocketbaseStore()
const drawerStore = useDrawersStore()
const anilistAuthStore = useAnilistAuthStore()
const anilistGraphql = useAnilistGraphql()
const sharedListsStore = useSharedLists()
const socialStore = useAnilistSocialStore()

const featuresSection = ref<HTMLElement | null>(null)
const dashboardListSearch = ref('')
const dashboardLists = ref<SharedListSummary[]>([])
const dashboardListsLoading = ref(false)
const dashboardListsError = ref('')
const isFollowModalOpen = ref(false)
const followSearchQuery = ref('')
const isSearchingUsers = ref(false)
const followSearchError = ref('')
const followSearchResults = ref<Array<{
  id: number
  name: string
  avatar?: string
  initials: string
  color: string
  anilistUserId: number
  animeCount: number
  meanScore: number
  inKizuna: boolean
  pocketbaseUserId?: string
  alreadyFriend: boolean
}>>([])
let followSearchTimer: ReturnType<typeof setTimeout> | null = null

const authRecord = computed(() => {
  const authRefOrRecord = pocketbaseStore.authRecord as any
  return (authRefOrRecord?.value ?? authRefOrRecord ?? {}) as Record<string, any>
})

const hasAuthRecord = computed(() => Boolean(authRecord.value?.id))
const currentUserId = computed(() => String(authRecord.value.id ?? ''))
const isAniListLinked = computed(() => Boolean(authRecord.value?.anilist_user_id && authRecord.value?.anilist_token))
const friendsLoading = computed(() => socialStore.isLoading)
const friendsError = computed(() => socialStore.loadError)
const dashboardFriends = computed<SocialUser[]>(() => socialStore.friendUsers.slice(0, 8))
const friendIds = computed(() => new Set(socialStore.friendUsers.map(friend => Number(friend.id))))
const pendingFollowIds = computed(() => new Set((socialStore.followPendingIds ?? []).map(id => Number(id))))

const filteredDashboardLists = computed(() => {
  const needle = dashboardListSearch.value.toLowerCase()
  const source = dashboardLists.value.slice(0, 12)
  if (!needle) return source.slice(0, 8)
  return source.filter((list) => `${list.title} ${list.ownerName}`.toLowerCase().includes(needle)).slice(0, 8)
})

const DEFAULT_SHARED_LIST_BANNER = '/img/banner.webp'
const DEFAULT_SHARED_LIST_IMAGE = '/img/user.webp'

const dashboardListBannerSrc = (list: SharedListSummary) => String(list.bannerUrl || '').trim() || DEFAULT_SHARED_LIST_BANNER
const dashboardListImageSrc = (list: SharedListSummary) => String(list.imageUrl || '').trim() || DEFAULT_SHARED_LIST_IMAGE

const cardEls: Record<number, HTMLElement> = {}
const featureVisible = reactive<Record<number, boolean>>({
  0: false, 1: false, 2: false, 3: false, 4: false, 5: false
})

function setCardRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) cardEls[index] = el
}

const features = [
  {
    title: 'Friends & Social',
    description: 'Follow your friends, see what they\'re watching, and compare your lists in real time.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>'
  },
  {
    title: 'Shared Lists',
    description: 'Create collaborative anime lists with your group. Add, remove, and vote on entries together.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>'
  },
  {
    title: 'Progress Tracking',
    description: 'Sync your AniList data automatically. Your watch progress is always up to date.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>'
  },
  {
    title: 'Browse & Discover',
    description: 'Explore the full AniList catalogue. Find your next obsession with smart recommendations.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>'
  },
  {
    title: 'Real-time Notifications',
    description: 'Get notified when friends update their lists, finish a series, or share something new.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>'
  },
  {
    title: 'AniList Native',
    description: 'No new account needed. Sign in directly with AniList — your data, your control.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
  }
]

const openLoginDrawer = () => {
  drawerStore.openDrawer('drawerLogin')
}

const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const connectAniList = async () => {
  await anilistAuthStore.loginWithAniListWithWarning()
}

const friendInitials = (value: string) => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'FR'
}

const openFriendProfile = (friendId: number) => {
  const id = Number(friendId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/social/user/${id}`)
}

const openFollowModal = () => {
  isFollowModalOpen.value = true
}

const closeFollowModal = () => {
  isFollowModalOpen.value = false
  followSearchQuery.value = ''
  followSearchError.value = ''
  followSearchResults.value = []
  isSearchingUsers.value = false
  if (followSearchTimer) {
    clearTimeout(followSearchTimer)
    followSearchTimer = null
  }
}

const searchAniListUsersQuery = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    users(search: $search) {
      id
      name
      avatar {
        medium
        large
      }
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

type AniListSearchUser = {
  id?: number
  name?: string
  avatar?: {
    medium?: string | null
    large?: string | null
  } | null
  statistics?: {
    anime?: {
      count?: number | null
      meanScore?: number | null
    } | null
  } | null
}

const buildHue = (value: string) => {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360
}

const fetchPocketBaseMatches = async (anilistIds: number[]) => {
  const uniqueIds = Array.from(new Set(anilistIds.filter(id => Number.isFinite(id) && id > 0)))
  if (!uniqueIds.length) return new Map<number, Record<string, any>>()

  const filter = uniqueIds.map(id => `anilist_user_id=${id}`).join(' || ')
  const users = await pocketbaseStore.pb.collection('user').getFullList<Record<string, any>>({
    filter
  })

  return new Map(
    users
      .map(user => [Number(user.anilist_user_id || 0), user] as const)
      .filter(([id]) => id > 0)
  )
}

const handleFollowSearch = () => {
  if (followSearchTimer) clearTimeout(followSearchTimer)

  if (followSearchQuery.value.trim().length < 2) {
    followSearchError.value = ''
    followSearchResults.value = []
    isSearchingUsers.value = false
    return
  }

  followSearchTimer = setTimeout(async () => {
    isSearchingUsers.value = true
    followSearchError.value = ''

    try {
      const payload = await anilistGraphql.request<any>(searchAniListUsersQuery, {
        search: followSearchQuery.value.trim(),
        page: 1,
        perPage: 8
      }, {
        cacheTtlMs: 30_000
      })
      const errorMessage = Array.isArray(payload?.errors)
        ? payload.errors.map((error: any) => String(error?.message || '')).filter(Boolean).join(' | ')
        : ''
      if (errorMessage) {
        throw new Error(errorMessage)
      }

      const rawUsers: AniListSearchUser[] = Array.isArray(payload?.data?.Page?.users) ? payload.data.Page.users : []
      const filteredUsers = rawUsers.filter((user: AniListSearchUser) => Number(user?.id || 0) !== Number(authRecord.value?.anilist_user_id || 0))
      const pocketbaseMatches = await fetchPocketBaseMatches(filteredUsers.map((user: AniListSearchUser) => Number(user?.id || 0)))

      followSearchResults.value = filteredUsers
        .map((user: AniListSearchUser) => {
          const anilistUserId = Number(user?.id || 0)
          const name = String(user?.name || 'Unknown user')
          const avatar = String(user?.avatar?.large || user?.avatar?.medium || '')
          const localUser = pocketbaseMatches.get(anilistUserId)
          const hue = buildHue(name)
          return {
            id: anilistUserId,
            name,
            avatar: avatar || undefined,
            initials: friendInitials(name),
            color: `hsl(${hue} 72% 52%)`,
            anilistUserId,
            animeCount: Number(user?.statistics?.anime?.count || 0),
            meanScore: Number(user?.statistics?.anime?.meanScore || 0),
            inKizuna: Boolean(localUser?.id && String(localUser.id) !== currentUserId.value),
            pocketbaseUserId: localUser?.id ? String(localUser.id) : undefined,
            alreadyFriend: friendIds.value.has(anilistUserId)
          }
        })
        .filter(user => user.anilistUserId > 0)
    } catch {
      followSearchError.value = 'Unable to search AniList users right now.'
      followSearchResults.value = []
    } finally {
      isSearchingUsers.value = false
    }
  }, 220)
}

const openUserFromSearch = (user: { anilistUserId: number }) => {
  if (!user.anilistUserId) return
  closeFollowModal()
  navigateTo(`/social/user/${user.anilistUserId}`)
}

const isFollowBusy = (userId: number) => pendingFollowIds.value.has(Number(userId))

const followUserFromSearch = async (user: { anilistUserId: number }) => {
  if (!user.anilistUserId) return
  if (isFollowBusy(user.anilistUserId)) return

  followSearchError.value = ''

  try {
    await socialStore.toggleFollowUser(user.anilistUserId)
    followSearchResults.value = followSearchResults.value.map((entry) =>
      entry.anilistUserId === user.anilistUserId
        ? { ...entry, alreadyFriend: true, inKizuna: true }
        : entry
    )
  } catch (error: any) {
    followSearchError.value = error?.message || 'Unable to update AniList follow right now.'
  }
}

const loadDashboardLists = async () => {
  if (!isAniListLinked.value) {
    dashboardLists.value = []
    dashboardListsError.value = ''
    dashboardListsLoading.value = false
    return
  }

  dashboardListsLoading.value = true
  dashboardListsError.value = ''

  try {
    dashboardLists.value = await sharedListsStore.loadSummaries()
  } catch (error: any) {
    dashboardLists.value = []
    dashboardListsError.value = error?.message || 'Unable to load shared lists.'
  } finally {
    dashboardListsLoading.value = false
  }
}

const loadDashboardSocial = async () => {
  if (!isAniListLinked.value) return
  await socialStore.loadSocial()
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = Object.keys(cardEls).find(
            (k) => cardEls[Number(k)] === entry.target
          )
          if (idx !== undefined) {
            setTimeout(() => {
              featureVisible[Number(idx)] = true
            }, Number(idx) * 120)
            observer?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, root: null, rootMargin: '0px 0px -30px 0px' }
    )

    Object.values(cardEls).forEach((el) => {
      if (el) observer?.observe(el)
    })
  })
})

onUnmounted(() => {
  observer?.disconnect()
  if (followSearchTimer) clearTimeout(followSearchTimer)
})

watch(isAniListLinked, async (linked) => {
  if (!linked) {
    dashboardLists.value = []
    socialStore.reset()
    closeFollowModal()
    return
  }

  await Promise.all([loadDashboardLists(), loadDashboardSocial()])
}, { immediate: true })
</script>

<style scoped src="~/assets/css/pages/index.css"></style>

<style scoped>
.dashboard-empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.dashboard-error-state {
  color: #fda4af;
}

.list-item-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item-name {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: #f7fbff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-meta {
  font-size: 12px;
  color: rgba(244, 249, 254, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-owner {
  font-size: 11px;
  color: rgba(244, 249, 254, 0.66);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-card {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.friend-card:hover {
  transform: translateY(-2px);
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.friend-avatar span {
  color: #fff;
  font-size: 18px;
  font-weight: 800;
}

.follow-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: color-mix(in srgb, var(--kz-page-navy) 28%, transparent);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.follow-modal {
  width: min(100%, 720px);
  max-height: min(82vh, 760px);
  overflow: auto;
  border-radius: 18px;
  border: 1px solid var(--border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--kz-card-bg) 96%, white 4%), color-mix(in srgb, var(--kz-card-bg) 100%, transparent)),
    color-mix(in srgb, var(--kz-card-bg) 92%, transparent);
  box-shadow: 0 24px 80px color-mix(in srgb, var(--kz-page-navy) 24%, transparent);
  padding: 24px;
}

.follow-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.follow-modal-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--teal);
}

.follow-modal-head h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.follow-modal-close {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--kz-soft-bg);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}

.follow-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--kz-card-input);
  padding: 0 14px;
}

.follow-search-box input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  font-family: var(--font-main);
}

.follow-search-box input::placeholder {
  color: var(--text-dim);
}

.follow-search-state {
  padding: 18px 4px 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.follow-results {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.follow-result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--kz-soft-bg);
  padding: 14px;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.follow-result-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--kz-accent) 28%, var(--border));
  background: var(--kz-soft-bg-hover);
}

.follow-result-card:focus-visible {
  outline: 2px solid rgba(61, 180, 242, 0.65);
  outline-offset: 2px;
}

.follow-result-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.follow-result-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.follow-result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.follow-result-avatar span {
  color: #fff;
  font-size: 17px;
  font-weight: 800;
}

.follow-result-copy {
  min-width: 0;
}

.follow-result-name {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-result-subtitle {
  color: var(--text-dim);
  font-size: 12px;
  margin-top: 4px;
}

.follow-result-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.follow-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--kz-hover-fill);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
}

.follow-badge-kizuna {
  background: rgba(61, 180, 242, 0.16);
  color: #87dbff;
}

.follow-badge-friend {
  background: rgba(34, 197, 94, 0.16);
  color: #8ef0a8;
}

.follow-result-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.follow-action-btn {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-main);
  cursor: pointer;
}

.follow-action-secondary {
  background: var(--kz-soft-bg);
  color: var(--text-primary);
}

.follow-action-primary {
  background: linear-gradient(135deg, var(--cyan), #5ac4ff);
  color: var(--navy);
  border-color: transparent;
}

.follow-action-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.follow-modal-note {
  margin: 18px 0 0;
  color: var(--text-dim);
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .follow-modal {
    padding: 18px;
  }

  .follow-modal-head h2 {
    font-size: 22px;
  }

  .follow-result-card {
    flex-direction: column;
    align-items: stretch;
  }

  .follow-result-actions {
    width: 100%;
  }

  .follow-action-btn {
    flex: 1;
  }
}
</style>

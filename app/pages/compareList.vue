<template>
  <div class="anime-list-page compare-page">
    <div class="profile-banner">
      <img v-if="bannerUrl" :src="bannerUrl" alt="" class="banner-image">
      <div class="banner-bg"></div>
      <div class="banner-texture"></div>
      <div class="banner-avatar">
        <img v-if="friendAvatar" :src="friendAvatar" :alt="friendName || 'avatar'">
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          stroke-width="1.2"
          width="38"
          height="38"
        >
          <circle cx="12" cy="8.5" r="4" />
          <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </div>
    </div>

    <div class="border-b border-[var(--kz-border)] bg-[color-mix(in_srgb,var(--kz-card-bg)_88%,transparent)] supports-[backdrop-filter]:backdrop-blur-sm">
      <div class="tabs tabs-bordered mx-auto flex-nowrap justify-start overflow-x-auto px-2 sm:px-3 md:justify-center">
        <NuxtLink class="tab h-auto min-h-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[11px] font-medium text-[var(--kz-text-secondary)] transition hover:text-[var(--kz-text-primary)] sm:px-4 sm:text-xs md:px-5" :to="profileTabRoute('anime-list')">Liste d'animes</NuxtLink>
        <NuxtLink class="tab tab-active h-auto min-h-0 whitespace-nowrap border-b-2 border-[var(--kz-accent)] px-3 py-3 text-[11px] font-semibold text-[var(--kz-accent)] transition sm:px-4 sm:text-xs md:px-5" :to="`/social/compare/${friendUserId}`">Comparaison</NuxtLink>
        <NuxtLink class="tab h-auto min-h-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[11px] font-medium text-[var(--kz-text-secondary)] transition hover:text-[var(--kz-text-primary)] sm:px-4 sm:text-xs md:px-5" :to="profileTabRoute('favorites')">Favoris</NuxtLink>
        <NuxtLink class="tab h-auto min-h-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[11px] font-medium text-[var(--kz-text-secondary)] transition hover:text-[var(--kz-text-primary)] sm:px-4 sm:text-xs md:px-5" :to="profileTabRoute('friends')">Amis</NuxtLink>
        <NuxtLink class="tab h-auto min-h-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[11px] font-medium text-[var(--kz-text-secondary)] transition hover:text-[var(--kz-text-primary)] sm:px-4 sm:text-xs md:px-5" :to="profileTabRoute('shared-lists')">Listes partagées</NuxtLink>
      </div>
    </div>

    <div class="page">
      <div class="compare-hero">
        <div class="hero-user">
          <div class="user-avatar">
            <img v-if="selfAvatar" :src="selfAvatar" :alt="selfName">
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" width="30" height="30">
              <circle cx="12" cy="8.5" r="4" />
              <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div class="user-name">{{ selfName }}</div>
          <div class="user-stat">{{ selfListCountLabel }} anime - moyenne {{ selfMeanScore }}</div>
        </div>

        <div class="vs-divider"></div>

        <div class="hero-center">
          <div class="compat-label">Compatibilite</div>
          <div class="compat-score">{{ compatibilityPercent }}<span>%</span></div>
          <div class="compat-bar"><div class="compat-fill" :style="{ width: compatBarWidth }"></div></div>
          <div class="compat-desc">{{ compatibilityLabel }}</div>
        </div>

        <div class="vs-divider"></div>

        <div class="hero-user right">
          <div class="user-avatar friend">
            <img v-if="friendAvatar" :src="friendAvatar" :alt="friendName">
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" width="30" height="30">
              <circle cx="12" cy="8.5" r="4" />
              <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div class="user-name">{{ friendName }}</div>
          <div class="user-stat">{{ friendListCountLabel }} anime - moyenne {{ friendMeanScore }}</div>
        </div>
      </div>

      <div class="quick-stats">
        <div class="qs-card shadow-sm">
          <div class="qs-label">Animes en commun</div>
          <div class="qs-value">{{ commonCountLabel }}</div>
          <div class="qs-sub">sur {{ selfListCountLabel }} / {{ friendListCountLabel }}</div>
        </div>
        <div class="qs-card shadow-sm">
          <div class="qs-label">Ecart moyen de note</div>
          <div class="qs-value" :style="avgScoreDiffColor">{{ avgScoreDiffLabel }}</div>
          <div class="qs-sub">{{ avgScoreDiffSub }}</div>
        </div>
        <div class="qs-card shadow-sm">
          <div class="qs-label">Seulement vous</div>
          <div class="qs-value">{{ onlySelfCountLabel }}</div>
          <div class="qs-sub">anime a recommander</div>
        </div>
        <div class="qs-card shadow-sm">
          <div class="qs-label">Seulement l'autre</div>
          <div class="qs-value">{{ onlyFriendCountLabel }}</div>
          <div class="qs-sub">anime a decouvrir</div>
        </div>
      </div>
      <div v-if="compareError" class="placeholder-panel" style="margin-bottom:14px;">
        {{ compareError }}
      </div>

      <div class="tabs">
        <button class="tab shadow-sm" :class="{ active: activeTab === 'shared' }" type="button" @click="activeTab = 'shared'">Communs ({{ sharedEntries.length }})</button>
        <button class="tab shadow-sm" :class="{ active: activeTab === 'genres' }" type="button" @click="activeTab = 'genres'">Genres</button>
        <button class="tab shadow-sm" :class="{ active: activeTab === 'only' }" type="button" @click="activeTab = 'only'">Seulement vous ({{ onlySelfEntries.length }})</button>
        <button class="tab shadow-sm" :class="{ active: activeTab === 'discover' }" type="button" @click="activeTab = 'discover'">A decouvrir ({{ onlyFriendEntries.length }})</button>
        <button class="tab shadow-sm" :class="{ active: activeTab === 'diff' }" type="button" @click="activeTab = 'diff'">Ecart de note</button>
      </div>

      <div v-if="isEntriesLoading" class="placeholder-panel">Chargement des données de comparaison...</div>

      <div v-else-if="activeTab === 'shared'">
        <div class="section-title">Animes que vous avez vus tous les deux</div>
        <div class="genre-legend">
          <div class="legend-item"><div class="legend-dot legend-me"></div>Votre note</div>
          <div class="legend-item"><div class="legend-dot legend-them"></div>Sa note</div>
        </div>
        <div v-if="sharedEntries.length === 0" class="placeholder-panel">Aucun anime en commun dans En cours/Terminé.</div>
        <div v-else class="shared-grid">
          <div v-for="item in sharedEntries" :key="item.mediaId" class="shared-card">
            <img
              v-if="item.coverSrc"
              :src="item.coverSrc"
              :srcset="item.coverSrcSet"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            >
            <div v-else class="shared-card-placeholder"></div>
            <div class="shared-card-overlay">
              <div class="shared-card-title" :title="item.title">{{ item.title }}</div>
              <div class="score-row">
                <span class="score-me">{{ formatScore(item.selfScore) }}</span>
                <span class="score-them">{{ formatScore(item.friendScore) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'genres'">
        <div class="section-title">Chevauchement des genres</div>
        <div class="genre-compare">
          <div class="genre-legend">
            <div class="legend-item"><div class="legend-dot legend-me"></div>Vous</div>
            <div class="legend-item"><div class="legend-dot legend-them"></div>{{ friendName }}</div>
          </div>
          <div v-if="genreRows.length === 0" class="placeholder-panel">Aucune donnee de genre.</div>
          <div v-else v-for="row in genreRows" :key="row.genre" class="genre-row">
            <div class="genre-name">{{ row.genre }}</div>
            <div class="genre-bars">
              <div class="gbar-wrap">
                <div class="gbar-track"><div class="gbar-fill gbar-me" :style="{ width: row.selfWidth }"></div></div>
                <span class="gbar-label label-me">{{ row.selfCount }}</span>
              </div>
              <div class="gbar-wrap">
                <div class="gbar-track"><div class="gbar-fill gbar-them" :style="{ width: row.friendWidth }"></div></div>
                <span class="gbar-label label-them">{{ row.friendCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'only'">
        <div class="section-title">Animes vus seulement par vous - a recommander</div>
        <div v-if="onlySelfEntries.length === 0" class="placeholder-panel">Aucun anime exclusif.</div>
        <div v-else class="only-list">
          <div v-for="item in onlySelfEntries" :key="item.mediaId" class="only-item">
            <div class="only-thumb">
              <img
                v-if="item.coverSrc"
                :src="item.coverSrc"
                :srcset="item.coverSrcSet"
                :alt="item.title"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="only-title" :title="item.title">{{ item.title }}</div>
            <div class="only-status">{{ item.statusLabel }}</div>
            <div class="only-score score-blue">{{ formatScore(item.score) }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'discover'">
        <div class="section-title">Animes vus seulement par l'autre - a decouvrir</div>
        <div v-if="onlyFriendEntries.length === 0" class="placeholder-panel">Aucun anime exclusif.</div>
        <div v-else class="only-list">
          <div v-for="item in onlyFriendEntries" :key="item.mediaId" class="only-item">
            <div class="only-thumb">
              <img
                v-if="item.coverSrc"
                :src="item.coverSrc"
                :srcset="item.coverSrcSet"
                :alt="item.title"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="only-title" :title="item.title">{{ item.title }}</div>
            <div class="only-status">{{ item.statusLabel }}</div>
            <div class="only-score score-purple">{{ formatScore(item.score) }}</div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="section-title">Plus grands ecarts de notes</div>
        <div v-if="scoreDiffRows.length === 0" class="placeholder-panel">Aucun chevauchement note pour le moment.</div>
        <div v-else class="diff-list">
          <div v-for="item in scoreDiffRows" :key="item.mediaId" class="diff-item">
            <div class="diff-thumb">
              <img
                v-if="item.coverSrc"
                :src="item.coverSrc"
                :srcset="item.coverSrcSet"
                :alt="item.title"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="diff-title" :title="item.title">{{ item.title }}</div>
            <div class="diff-scores">
              <span class="diff-score score-blue">{{ formatScore(item.selfScore) }}</span>
              <span class="diff-arrow">vs</span>
              <span class="diff-score score-purple">{{ formatScore(item.friendScore) }}</span>
            </div>
            <span class="diff-badge" :class="item.diff >= 0 ? 'diff-pos' : 'diff-neg'">
              {{ item.diff > 0 ? '+' : '' }}{{ item.diff.toFixed(1) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, unref } from 'vue'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

definePageMeta({
  path: '/social/compare/:id',
  ssr: false
})

const route = useRoute()
const anilistGraphql = useAnilistGraphql()
const pocketbaseStore = usePocketbaseStore()

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))
const friendUserId = computed(() => Number(route.params.id ?? 0))

const selfName = computed(() => String(authRecord.value.anilist_username || 'Vous'))
const selfAvatar = computed(() =>
  String(authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
)

const friendName = ref('Ami')
const friendAvatar = ref('')
const bannerUrl = ref('')
const selfMeanScore = ref('--')
const friendMeanScore = ref('--')
const compareError = ref('')
const isEntriesLoading = ref(false)
const hasEntriesLoaded = ref(false)
const activeTab = ref<'shared' | 'genres' | 'only' | 'discover' | 'diff'>('shared')

type CompareEntry = {
  mediaId: number
  title: string
  coverSrc: string
  coverSrcSet?: string
  score: number
  progress: number
  status: 'CURRENT' | 'COMPLETED'
  updatedAt: number
  genres: string[]
}

const selfEntries = ref<CompareEntry[]>([])
const friendEntries = ref<CompareEntry[]>([])

const profileTabRoute = (tab: 'anime-list' | 'favorites' | 'friends' | 'shared-lists') => ({
  path: `/social/user/${friendUserId.value}`,
  query: tab === 'anime-list' ? {} : { tab }
})

const formatScore = (score: number) => {
  if (!score) return '-'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const statusLabel = (status: 'CURRENT' | 'COMPLETED') => (status === 'CURRENT' ? 'En cours' : 'Terminé')

const selfMap = computed(() => {
  const map = new Map<number, CompareEntry>()
  for (const entry of selfEntries.value) map.set(entry.mediaId, entry)
  return map
})

const friendMap = computed(() => {
  const map = new Map<number, CompareEntry>()
  for (const entry of friendEntries.value) map.set(entry.mediaId, entry)
  return map
})

const compareCounts = computed(() => {
  const selfIds = new Set(selfEntries.value.map(entry => entry.mediaId))
  const friendIds = new Set(friendEntries.value.map(entry => entry.mediaId))

  let common = 0
  for (const mediaId of selfIds) {
    if (friendIds.has(mediaId)) common += 1
  }

  return {
    selfTotal: selfIds.size,
    friendTotal: friendIds.size,
    common,
    onlySelf: Math.max(selfIds.size - common, 0),
    onlyFriend: Math.max(friendIds.size - common, 0)
  }
})

const countLabel = (count: number) => {
  if (isEntriesLoading.value || !hasEntriesLoaded.value) return '--'
  return String(count)
}

const selfListCountLabel = computed(() => countLabel(compareCounts.value.selfTotal))
const friendListCountLabel = computed(() => countLabel(compareCounts.value.friendTotal))
const commonCountLabel = computed(() => countLabel(compareCounts.value.common))
const onlySelfCountLabel = computed(() => countLabel(compareCounts.value.onlySelf))
const onlyFriendCountLabel = computed(() => countLabel(compareCounts.value.onlyFriend))

const sharedEntries = computed(() => {
    const rows: Array<{
      mediaId: number
      title: string
      coverSrc: string
      coverSrcSet?: string
      selfScore: number
      friendScore: number
      selfGenres: string[]
    friendGenres: string[]
    updatedAt: number
  }> = []
  for (const entry of selfEntries.value) {
    const friendEntry = friendMap.value.get(entry.mediaId)
    if (!friendEntry) continue
    rows.push({
      mediaId: entry.mediaId,
      title: entry.title,
      coverSrc: entry.coverSrc,
      coverSrcSet: entry.coverSrcSet,
      selfScore: entry.score,
      friendScore: friendEntry.score,
      selfGenres: entry.genres,
      friendGenres: friendEntry.genres,
      updatedAt: Math.max(entry.updatedAt, friendEntry.updatedAt)
    })
  }
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)
})

const onlySelfEntries = computed(() =>
  selfEntries.value
    .filter((entry) => !friendMap.value.has(entry.mediaId))
    .map((entry) => ({ ...entry, statusLabel: statusLabel(entry.status) }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
)

const onlyFriendEntries = computed(() =>
  friendEntries.value
    .filter((entry) => !selfMap.value.has(entry.mediaId))
    .map((entry) => ({ ...entry, statusLabel: statusLabel(entry.status) }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
)

const scoreDiffRows = computed(() =>
  sharedEntries.value
    .filter((row) => row.selfScore > 0 && row.friendScore > 0)
    .map((row) => ({ ...row, diff: Number((row.selfScore - row.friendScore).toFixed(1)) }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
)

const genreRows = computed(() => {
  const selfGenreCounts = new Map<string, number>()
  const friendGenreCounts = new Map<string, number>()
  for (const row of sharedEntries.value) {
    for (const genre of row.selfGenres) selfGenreCounts.set(genre, (selfGenreCounts.get(genre) || 0) + 1)
    for (const genre of row.friendGenres) friendGenreCounts.set(genre, (friendGenreCounts.get(genre) || 0) + 1)
  }

  const allGenres = new Set<string>([...selfGenreCounts.keys(), ...friendGenreCounts.keys()])
  const rows = Array.from(allGenres)
    .map((genre) => ({
      genre,
      selfCount: selfGenreCounts.get(genre) || 0,
      friendCount: friendGenreCounts.get(genre) || 0
    }))
    .sort((a, b) => Math.max(b.selfCount, b.friendCount) - Math.max(a.selfCount, a.friendCount))
    .slice(0, 10)

  const maxSelf = Math.max(1, ...rows.map((r) => r.selfCount))
  const maxFriend = Math.max(1, ...rows.map((r) => r.friendCount))

  return rows.map((r) => ({
    ...r,
    selfWidth: `${Math.round((r.selfCount / maxSelf) * 100)}%`,
    friendWidth: `${Math.round((r.friendCount / maxFriend) * 100)}%`
  }))
})

const avgScoreDiffValue = computed(() => {
  const rows = scoreDiffRows.value
  if (!rows.length) return null
  const total = rows.reduce((sum, row) => sum + row.diff, 0)
  return Number((total / rows.length).toFixed(1))
})

const avgScoreDiffLabel = computed(() => {
  if (avgScoreDiffValue.value == null) return '--'
  return `${avgScoreDiffValue.value > 0 ? '+' : ''}${avgScoreDiffValue.value}`
})

const avgScoreDiffSub = computed(() => {
  if (avgScoreDiffValue.value == null) return '--'
  if (avgScoreDiffValue.value > 0) return 'vous notez plus haut'
  if (avgScoreDiffValue.value < 0) return "l'autre note plus haut"
  return 'meme moyenne'
})

const avgScoreDiffColor = computed(() => {
  if (avgScoreDiffValue.value == null) return ''
  if (avgScoreDiffValue.value > 0) return 'color:#4ade80;'
  if (avgScoreDiffValue.value < 0) return 'color:#ef4444;'
  return 'color:#3db4f2;'
})

const compatibilityPercent = computed(() => {
  const selfTotal = compareCounts.value.selfTotal
  const friendTotal = compareCounts.value.friendTotal
  const common = compareCounts.value.common
  const union = selfTotal + friendTotal - common
  if (union <= 0) return '--'
  return String(Math.round((common / union) * 100))
})

const compatBarWidth = computed(() => {
  const value = Number(compatibilityPercent.value)
  if (!Number.isFinite(value)) return '0%'
  return `${Math.max(0, Math.min(100, value))}%`
})

const compatibilityLabel = computed(() => {
  const value = Number(compatibilityPercent.value)
  if (!Number.isFinite(value)) return 'Chargement...'
  if (value >= 85) return 'Tres bon match'
  if (value >= 60) return 'Bon match'
  if (value >= 30) return 'Quelques points communs'
  return 'Peu de points communs'
})

const fetchSelfProfile = async () => {
  const selfUserId = Number(authRecord.value.anilist_user_id ?? 0)
  const selfUserName = String(authRecord.value.anilist_username ?? '')
  const viewerQuery = `
    query {
      Viewer {
        statistics {
          anime {
            count
            meanScore
          }
        }
      }
    }
  `
  const userQuery = `
    query ($userId: Int, $userName: String) {
      User(id: $userId, name: $userName) {
        statistics {
          anime {
            count
            meanScore
          }
        }
      }
    }
  `

  try {
    // Prefere Viewer quand un token existe, sinon bascule sur une requete User explicite.
    let response: any = null
    if (token.value) {
      response = await anilistGraphql.request<any>(
        viewerQuery,
        {},
        { token: token.value, cacheTtlMs: 60_000 }
      )
    } else if (selfUserId || selfUserName) {
      response = await anilistGraphql.request<any>(
        userQuery,
        { userId: selfUserId || null, userName: selfUserId ? null : selfUserName },
        { token: token.value, cacheTtlMs: 60_000 }
      )
    } else {
      return
    }

    const stats = response?.data?.Viewer?.statistics?.anime || response?.data?.User?.statistics?.anime
    if (!stats) return
    const rawMeanScore = Number(stats.meanScore ?? NaN)
    selfMeanScore.value = Number.isFinite(rawMeanScore) ? rawMeanScore.toFixed(1) : '--'
  } catch {
    // Garde les valeurs d'attente si la recuperation du profil echoue.
  }
}

const fetchFriendProfile = async () => {
  if (!friendUserId.value) return

  const query = `
    query ($userId: Int) {
      User(id: $userId) {
        name
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
  `

  try {
    const response = await anilistGraphql.request<any>(
      query,
      { userId: friendUserId.value },
      { token: token.value, cacheTtlMs: 60_000 }
    )
    const user = response?.data?.User
    if (!user) return
    friendName.value = String(user.name || 'Ami')
    friendAvatar.value = String(user.avatar?.large || user.avatar?.medium || '')
    bannerUrl.value = String(user.bannerImage || '')
    const animeStats = user.statistics?.anime
    const rawMeanScore = Number(animeStats?.meanScore ?? NaN)
    friendMeanScore.value = Number.isFinite(rawMeanScore) ? rawMeanScore.toFixed(1) : '--'
  } catch {
    // Garde les valeurs d'attente si la recuperation du profil echoue.
  }
}

const fetchCompareEntries = async () => {
  const selfUserId = Number(authRecord.value.anilist_user_id ?? 0)
  if (!selfUserId || !friendUserId.value) return

  const query = `
    query ($userId: Int) {
      MediaListCollection(userId: $userId, type: ANIME, status_in: [CURRENT, COMPLETED], sort: UPDATED_TIME_DESC) {
        lists {
          status
          entries {
            score
            progress
            updatedAt
            media {
              id
              genres
              title { romaji english native }
              coverImage { medium large extraLarge }
            }
          }
        }
      }
    }
  `

  const mapEntries = (response: any): CompareEntry[] => {
    const lists = Array.isArray(response?.data?.MediaListCollection?.lists) ? response.data.MediaListCollection.lists : []
    const result = new Map<number, CompareEntry>()
    for (const list of lists) {
      const status = String(list?.status || '')
      if (status !== 'CURRENT' && status !== 'COMPLETED') continue
      const entries = Array.isArray(list?.entries) ? list.entries : []
      for (const entry of entries) {
        const mediaId = Number(entry?.media?.id || 0)
        if (!mediaId) continue
        const title = String(entry?.media?.title?.romaji || entry?.media?.title?.english || entry?.media?.title?.native || 'Titre inconnu')
        const coverImage = (entry?.media?.coverImage || null) as AnilistCoverImage | null
        const normalized: CompareEntry = {
          mediaId,
          title,
          coverSrc: getAnilistCoverSrc(coverImage, 'card'),
          coverSrcSet: getAnilistCoverSrcSet(coverImage, 'card'),
          score: Number(entry?.score || 0),
          progress: Number(entry?.progress || 0),
          status: status as 'CURRENT' | 'COMPLETED',
          updatedAt: Number(entry?.updatedAt || 0),
          genres: Array.isArray(entry?.media?.genres) ? entry.media.genres.filter(Boolean) : []
        }

        const existing = result.get(mediaId)
        if (!existing || normalized.updatedAt > existing.updatedAt) result.set(mediaId, normalized)
      }
    }
    return Array.from(result.values())
  }

  try {
    isEntriesLoading.value = true
    hasEntriesLoaded.value = false
    compareError.value = ''
    const [selfRes, friendRes] = await Promise.all([
      anilistGraphql.request<any>(query, { userId: selfUserId }, { token: token.value, cacheTtlMs: 60_000 }),
      anilistGraphql.request<any>(query, { userId: friendUserId.value }, { token: token.value, cacheTtlMs: 60_000 })
    ])
    selfEntries.value = mapEntries(selfRes)
    friendEntries.value = mapEntries(friendRes)
  } catch (error) {
    console.error('[compareList] entries failed', error)
    compareError.value = error instanceof Error ? error.message : 'La comparaison a echoue.'
  } finally {
    isEntriesLoading.value = false
    hasEntriesLoaded.value = true
  }
}

onMounted(async () => {
  await Promise.all([fetchSelfProfile(), fetchFriendProfile(), fetchCompareEntries()])
})
</script>

<style scoped src="~/assets/css/pages/compareList.css"></style>
  

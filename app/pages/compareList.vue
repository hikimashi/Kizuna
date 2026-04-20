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

    <div class="sub-tabs-bar">
      <div class="sub-tabs">
        <NuxtLink class="sub-tab" :to="`/social/user/${$route.params.id}`">Anime List</NuxtLink>
        <NuxtLink class="sub-tab active" :to="`/social/compare/${$route.params.id}`">Compare List</NuxtLink>
        <button class="sub-tab" type="button" disabled>Favorites</button>
        <button class="sub-tab" type="button" disabled>Friends</button>
        <button class="sub-tab" type="button" disabled>Shared Lists</button>
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
          <div class="user-stat">{{ selfCount }} anime - {{ selfMeanScore }} avg</div>
        </div>

        <div class="vs-divider"></div>

        <div class="hero-center">
          <div class="compat-label">Compatibility</div>
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
          <div class="user-stat">{{ friendCount }} anime - {{ friendMeanScore }} avg</div>
        </div>
      </div>

      <div class="quick-stats">
        <div class="qs-card">
          <div class="qs-label">Anime in Common</div>
          <div class="qs-value">{{ commonCount }}</div>
          <div class="qs-sub">out of {{ selfCount }} / {{ friendCount }}</div>
        </div>
        <div class="qs-card">
          <div class="qs-label">Avg Score Diff</div>
          <div class="qs-value" :style="avgScoreDiffColor">{{ avgScoreDiffLabel }}</div>
          <div class="qs-sub">{{ avgScoreDiffSub }}</div>
        </div>
        <div class="qs-card">
          <div class="qs-label">Only You Watched</div>
          <div class="qs-value">{{ onlySelfCount }}</div>
          <div class="qs-sub">anime to recommend</div>
        </div>
        <div class="qs-card">
          <div class="qs-label">Only They Watched</div>
          <div class="qs-value">{{ onlyFriendCount }}</div>
          <div class="qs-sub">anime to discover</div>
        </div>
      </div>
      <div v-if="compareError" class="placeholder-panel" style="margin-bottom:14px;">
        {{ compareError }}
      </div>

      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'shared' }" type="button" @click="activeTab = 'shared'">Shared ({{ sharedEntries.length }})</button>
        <button class="tab" :class="{ active: activeTab === 'genres' }" type="button" @click="activeTab = 'genres'">Genres</button>
        <button class="tab" :class="{ active: activeTab === 'only' }" type="button" @click="activeTab = 'only'">Only Yours ({{ onlySelfEntries.length }})</button>
        <button class="tab" :class="{ active: activeTab === 'discover' }" type="button" @click="activeTab = 'discover'">Discover ({{ onlyFriendEntries.length }})</button>
        <button class="tab" :class="{ active: activeTab === 'diff' }" type="button" @click="activeTab = 'diff'">Score Diff</button>
      </div>

      <div v-if="isEntriesLoading" class="placeholder-panel">Loading compare data...</div>

      <div v-else-if="activeTab === 'shared'">
        <div class="section-title">Anime you both watched</div>
        <div class="genre-legend">
          <div class="legend-item"><div class="legend-dot legend-me"></div>Your score</div>
          <div class="legend-item"><div class="legend-dot legend-them"></div>Their score</div>
        </div>
        <div v-if="sharedEntries.length === 0" class="placeholder-panel">No shared anime in Watching/Completed.</div>
        <div v-else class="shared-grid">
          <div v-for="item in sharedEntries" :key="item.mediaId" class="shared-card">
            <img
              v-if="item.cover"
              :src="item.cover"
              :alt="item.title"
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
        <div class="section-title">Genre overlap</div>
        <div class="genre-compare">
          <div class="genre-legend">
            <div class="legend-item"><div class="legend-dot legend-me"></div>You</div>
            <div class="legend-item"><div class="legend-dot legend-them"></div>{{ friendName }}</div>
          </div>
          <div v-if="genreRows.length === 0" class="placeholder-panel">No genre data.</div>
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
        <div class="section-title">Anime only you've watched - recommend to them</div>
        <div v-if="onlySelfEntries.length === 0" class="placeholder-panel">No exclusive anime.</div>
        <div v-else class="only-list">
          <div v-for="item in onlySelfEntries" :key="item.mediaId" class="only-item">
            <div class="only-thumb">
              <img v-if="item.cover" :src="item.cover" :alt="item.title">
            </div>
            <div class="only-title" :title="item.title">{{ item.title }}</div>
            <div class="only-status">{{ item.statusLabel }}</div>
            <div class="only-score score-blue">{{ formatScore(item.score) }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'discover'">
        <div class="section-title">Anime only they've watched - discover new ones</div>
        <div v-if="onlyFriendEntries.length === 0" class="placeholder-panel">No exclusive anime.</div>
        <div v-else class="only-list">
          <div v-for="item in onlyFriendEntries" :key="item.mediaId" class="only-item">
            <div class="only-thumb">
              <img v-if="item.cover" :src="item.cover" :alt="item.title">
            </div>
            <div class="only-title" :title="item.title">{{ item.title }}</div>
            <div class="only-status">{{ item.statusLabel }}</div>
            <div class="only-score score-purple">{{ formatScore(item.score) }}</div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="section-title">Biggest score disagreements</div>
        <div v-if="scoreDiffRows.length === 0" class="placeholder-panel">No scored overlap yet.</div>
        <div v-else class="diff-list">
          <div v-for="item in scoreDiffRows" :key="item.mediaId" class="diff-item">
            <div class="diff-thumb">
              <img v-if="item.cover" :src="item.cover" :alt="item.title">
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
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

// Cette page compare l'utilisateur courant avec un profil AniList ami.
// Elle calcule les oeuvres communes, les exclusivites, les ecarts de score
// et une estimation simple de compatibilite.

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

const selfName = computed(() => String(authRecord.value.anilist_username || 'You'))
const selfAvatar = computed(() =>
  String(authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
)

const friendName = ref('Friend')
const friendAvatar = ref('')
const bannerUrl = ref('')
const selfCount = ref('--')
const selfMeanScore = ref('--')
const friendCount = ref('--')
const friendMeanScore = ref('--')
const commonCount = ref('--')
const onlySelfCount = ref('--')
const onlyFriendCount = ref('--')
const compareError = ref('')
const isEntriesLoading = ref(false)
const activeTab = ref<'shared' | 'genres' | 'only' | 'discover' | 'diff'>('shared')

type CompareEntry = {
  mediaId: number
  title: string
  cover: string
  score: number
  progress: number
  status: 'CURRENT' | 'COMPLETED'
  updatedAt: number
  genres: string[]
}

const selfEntries = ref<CompareEntry[]>([])
const friendEntries = ref<CompareEntry[]>([])

const formatScore = (score: number) => {
  if (!score) return '-'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const statusLabel = (status: 'CURRENT' | 'COMPLETED') => (status === 'CURRENT' ? 'Watching' : 'Completed')

const selfMap = computed(() => {
  // Map pratique pour retrouver rapidement une entree a partir de son mediaId.
  const map = new Map<number, CompareEntry>()
  for (const entry of selfEntries.value) map.set(entry.mediaId, entry)
  return map
})

const friendMap = computed(() => {
  const map = new Map<number, CompareEntry>()
  for (const entry of friendEntries.value) map.set(entry.mediaId, entry)
  return map
})

const sharedEntries = computed(() => {
  // Cette collection contient uniquement les animes presents chez les deux personnes.
  const rows: Array<{
    mediaId: number
    title: string
    cover: string
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
      cover: entry.cover,
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
  // On compte les genres a partir des animes en commun pour voir les recouvrements.
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
  if (avgScoreDiffValue.value > 0) return 'you rate higher'
  if (avgScoreDiffValue.value < 0) return 'they rate higher'
  return 'same average'
})

const avgScoreDiffColor = computed(() => {
  if (avgScoreDiffValue.value == null) return ''
  if (avgScoreDiffValue.value > 0) return 'color:#4ade80;'
  if (avgScoreDiffValue.value < 0) return 'color:#ef4444;'
  return 'color:#3db4f2;'
})

const compatibilityPercent = computed(() => {
  // Compatibilite = intersection / union.
  const selfTotal = Number(selfCount.value) || 0
  const friendTotal = Number(friendCount.value) || 0
  const common = Number(commonCount.value) || 0
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
  if (!Number.isFinite(value)) return 'Loading...'
  if (value >= 75) return 'Great match'
  if (value >= 50) return 'Good match'
  if (value >= 25) return 'Some overlap'
  return 'Low overlap'
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
    // On prefere Viewer si un token existe ; sinon on repasse par la requete User.
    let response: any = null
    if (token.value) {
      response = await anilistGraphql.request<any>(
        viewerQuery,
        {},
        { token: token.value, skipCache: true }
      )
    } else if (selfUserId || selfUserName) {
      response = await anilistGraphql.request<any>(
        userQuery,
        { userId: selfUserId || null, userName: selfUserId ? null : selfUserName },
        { token: token.value, skipCache: true }
      )
    } else {
      return
    }

    const stats = response?.data?.Viewer?.statistics?.anime || response?.data?.User?.statistics?.anime
    if (!stats) return
    selfCount.value = String(stats.count ?? '--')
    const rawMeanScore = Number(stats.meanScore ?? NaN)
    selfMeanScore.value = Number.isFinite(rawMeanScore) ? rawMeanScore.toFixed(1) : '--'
  } catch {
    // Keep static placeholders if profile fetch fails.
  }
}

const fetchFriendProfile = async () => {
  // Charge le bloc de presentation de l'ami : nom, avatar, banner et stats.
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
      { token: token.value, skipCache: true }
    )
    const user = response?.data?.User
    if (!user) return
    friendName.value = String(user.name || 'Friend')
    friendAvatar.value = String(user.avatar?.large || user.avatar?.medium || '')
    bannerUrl.value = String(user.bannerImage || '')
    const animeStats = user.statistics?.anime
    friendCount.value = String(animeStats?.count ?? '--')
    const rawMeanScore = Number(animeStats?.meanScore ?? NaN)
    friendMeanScore.value = Number.isFinite(rawMeanScore) ? rawMeanScore.toFixed(1) : '--'
  } catch {
    // Keep static placeholders if profile fetch fails.
  }
}

const fetchMediaMatch = async () => {
  // Le serveur calcule ici les compteurs synthese de comparaison.
  const selfUserId = Number(authRecord.value.anilist_user_id ?? 0)
  const selfUserName = String(authRecord.value.anilist_username ?? '')

  if ((!selfUserId && !selfUserName) || !friendUserId.value) return

  try {
    compareError.value = ''
    const qs = new URLSearchParams()
    if (selfUserId) qs.set('selfUserId', String(selfUserId))
    if (selfUserName) qs.set('selfUserName', selfUserName)
    if (friendName.value && friendName.value !== 'Friend') qs.set('friendUserName', friendName.value)

    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${base}/api/social/compare/${friendUserId.value}${qs.toString() ? `?${qs.toString()}` : ''}`
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`compare api ${response.status}: ${errorBody}`)
    }

    const data = await response.json() as {
      commonCount: number
      onlySelfCount: number
      onlyFriendCount: number
      selfCount: number
      friendCount: number
    }

    const selfTotal = Math.max(Number(data.selfCount) || 0, 0)
    const friendTotal = Math.max(Number(data.friendCount) || 0, 0)
    const common = Math.max(Math.min(Number(data.commonCount) || 0, selfTotal, friendTotal), 0)
    const onlySelf = Math.max(selfTotal - common, 0)
    const onlyFriend = Math.max(friendTotal - common, 0)

    commonCount.value = String(common)
    onlySelfCount.value = String(onlySelf)
    onlyFriendCount.value = String(onlyFriend)
    selfCount.value = String(selfTotal)
    friendCount.value = String(friendTotal)
  } catch (error) {
    console.error('[compareList] media match failed', error)
    compareError.value = error instanceof Error ? error.message : 'Comparison failed'
    commonCount.value = '--'
    onlySelfCount.value = '--'
    onlyFriendCount.value = '--'
  }
}

const fetchCompareEntries = async () => {
  // Ici on charge les vraies listes CURRENT / COMPLETED pour les analyses detaillees.
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
              coverImage { medium large }
            }
          }
        }
      }
    }
  `

  const mapEntries = (response: any): CompareEntry[] => {
    // AniList renvoie des groupes ; on les aplatit dans une seule liste dedoublonnee.
    const lists = Array.isArray(response?.data?.MediaListCollection?.lists) ? response.data.MediaListCollection.lists : []
    const result = new Map<number, CompareEntry>()
    for (const list of lists) {
      const status = String(list?.status || '')
      if (status !== 'CURRENT' && status !== 'COMPLETED') continue
      const entries = Array.isArray(list?.entries) ? list.entries : []
      for (const entry of entries) {
        const mediaId = Number(entry?.media?.id || 0)
        if (!mediaId) continue
        const title = String(entry?.media?.title?.romaji || entry?.media?.title?.english || entry?.media?.title?.native || 'Unknown title')
        const cover = String(entry?.media?.coverImage?.large || entry?.media?.coverImage?.medium || '')
        const normalized: CompareEntry = {
          mediaId,
          title,
          cover,
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
    const [selfRes, friendRes] = await Promise.all([
      anilistGraphql.request<any>(query, { userId: selfUserId }, { token: token.value, skipCache: true }),
      anilistGraphql.request<any>(query, { userId: friendUserId.value }, { token: token.value, skipCache: true })
    ])
    selfEntries.value = mapEntries(selfRes)
    friendEntries.value = mapEntries(friendRes)
  } catch (error) {
    console.error('[compareList] entries failed', error)
  } finally {
    isEntriesLoading.value = false
  }
}

onMounted(async () => {
  // On charge d'abord les profils et les listes, puis les compteurs consolides.
  await Promise.all([fetchSelfProfile(), fetchFriendProfile(), fetchCompareEntries()])
  await fetchMediaMatch()
})
</script>

<style scoped src="~/assets/css/pages/compareList.css"></style>
  

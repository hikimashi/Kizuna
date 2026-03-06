<template>
  <div class="compare-page">
    <div class="compare-sub-tabs">
      <div class="sub-tabs">
        <NuxtLink class="sub-tab" :to="`/social/user/${$route.params.id}`">Anime List</NuxtLink>
        <NuxtLink class="sub-tab active" :to="`/social/compare/${$route.params.id}`">Compare list</NuxtLink>
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
          <div class="user-stat">-- anime - -- avg</div>
        </div>

        <div class="vs-divider"></div>

        <div class="hero-center">
          <div class="compat-label">Compatibility</div>
          <div class="compat-score">--<span>%</span></div>
          <div class="compat-bar"><div class="compat-fill"></div></div>
          <div class="compat-desc">Static preview</div>
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
          <div class="qs-value">--</div>
          <div class="qs-sub">out of -- / --</div>
        </div>
        <div class="qs-card">
          <div class="qs-label">Avg Score Diff</div>
          <div class="qs-value">--</div>
          <div class="qs-sub">--</div>
        </div>
        <div class="qs-card">
          <div class="qs-label">Only You Watched</div>
          <div class="qs-value">--</div>
          <div class="qs-sub">anime to recommend</div>
        </div>
        <div class="qs-card">
          <div class="qs-label">Only They Watched</div>
          <div class="qs-value">--</div>
          <div class="qs-sub">anime to discover</div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" type="button">Shared</button>
        <button class="tab" type="button">Genres</button>
        <button class="tab" type="button">Only Yours</button>
        <button class="tab" type="button">Discover</button>
        <button class="tab" type="button">Score Diff</button>
      </div>

      <div class="section-title">Comparison preview</div>
      <div class="placeholder-panel">
        Compare page recreated without functions. Data and interactions will be added next.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, unref } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

definePageMeta({
  path: '/social/compare/:id'
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
const friendCount = ref('--')
const friendMeanScore = ref('--')

const fetchFriendProfile = async () => {
  if (!friendUserId.value) return

  const query = `
    query ($userId: Int) {
      User(id: $userId) {
        name
        avatar { medium large }
        statistics { anime { count meanScore } }
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
    friendCount.value = String(user.statistics?.anime?.count ?? '--')
    const rawMeanScore = Number(user.statistics?.anime?.meanScore ?? NaN)
    friendMeanScore.value = Number.isFinite(rawMeanScore) ? rawMeanScore.toFixed(1) : '--'
  } catch {
    // Keep static placeholders if profile fetch fails.
  }
}

onMounted(fetchFriendProfile)
</script>

<style scoped src="~/assets/css/pages/compareList.css"></style>

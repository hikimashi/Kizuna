<template>
  <div class="profile-nav">
    <section class="banner-wrap" :class="{ 'has-image': Boolean(resolvedBannerUrl) }">
      <img v-if="resolvedBannerUrl" :src="resolvedBannerUrl" alt="" class="banner-image">
      <div class="banner-content">
        <div class="banner-avatar">
          <img v-if="resolvedAvatarUrl" :src="resolvedAvatarUrl" :alt="resolvedUsername || 'AniList avatar'">
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
        <div class="banner-meta">
          <div class="banner-username">{{ resolvedUsername || 'User' }}</div>
          <div class="banner-joined">Joined {{ resolvedJoinedDisplay }}</div>
        </div>
      </div>
    </section>

    <div class="sub-tabs-bar">
      <div class="sub-tabs">
        <template v-for="tab in props.tabs" :key="tab.key">
          <NuxtLink
            v-if="tab.to && !tab.disabled"
            class="sub-tab"
            :class="{ active: tab.active }"
            :to="tab.to"
          >
            {{ tab.label }}
          </NuxtLink>
          <span
            v-else
            class="sub-tab"
            :class="{ active: tab.active, disabled: Boolean(tab.disabled) }"
            aria-disabled="true"
          >
            {{ tab.label }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, unref } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

type SubTabItem = {
  key: string
  label: string
  to?: string
  disabled?: boolean
  active?: boolean
}

const props = defineProps<{
  username?: string
  avatarUrl?: string
  bannerUrl?: string
  joinedDisplay?: string
  tabs: SubTabItem[]
}>()

const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const joinedCache = useState<string>('user_header_joined_display', () => '')

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))

const resolvedUsername = computed(() =>
  String(props.username || authRecord.value.anilist_username || authRecord.value.username || 'User')
)

const resolvedAvatarUrl = computed(() =>
  String(props.avatarUrl || authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
)

const resolvedBannerUrl = computed(() =>
  String(props.bannerUrl || authRecord.value.anilist_banner || '')
)

const formatJoined = (timestamp?: number | null) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

if (import.meta.client && !joinedCache.value) {
  joinedCache.value = localStorage.getItem('user_header_joined_display') || ''
}

const resolvedJoinedDisplay = computed(() => joinedCache.value || '-')

onMounted(async () => {
  if (joinedCache.value || !token.value) return
  const query = `
    query {
      Viewer {
        createdAt
      }
    }
  `

  try {
    const response = await anilistGraphql.request<any>(
      query,
      {},
      { token: token.value, skipCache: true }
    )
    joinedCache.value = formatJoined(Number(response?.data?.Viewer?.createdAt || 0) || null)
    if (import.meta.client) {
      localStorage.setItem('user_header_joined_display', joinedCache.value)
    }
  } catch {
    if (!joinedCache.value) joinedCache.value = '-'
  }
})
</script>

<style scoped>
.banner-wrap {
  width: 100%;
  height: clamp(230px, 28vw, 340px);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20, 30, 50, 0.95) 0%, rgba(10, 18, 35, 0.98) 100%);
}

.banner-image {
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

.banner-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 70% 50%, rgba(61, 180, 242, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 40% 60% at 30% 60%, rgba(146, 86, 243, 0.15) 0%, transparent 60%);
}

.banner-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255, 255, 255, 0.012) 20px, rgba(255, 255, 255, 0.012) 21px);
}

.banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(5, 10, 20, 0.12) 0%,
    rgba(8, 12, 22, 0.34) 75%,
    rgba(8, 12, 22, 0.5) 100%
  );
}

.banner-wrap.has-image::after {
  display: none;
}

.banner-avatar {
  position: relative;
  width: 132px;
  height: 132px;
  border-radius: 8px;
  background: transparent;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 2;
}

.banner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.banner-avatar svg {
  width: 46px;
  height: 46px;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1.2;
}

.banner-content {
  position: absolute;
  bottom: 0;
  left: clamp(16px, 2.4vw, 40px);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 18px;
}

.banner-meta {
  transform: translateY(-16px);
}

.banner-username {
  font-family: 'Overpass', sans-serif;
  font-size: clamp(30px, 3.6vw, 46px);
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
  margin-bottom: 0;
}

.banner-joined {
  font-family: 'Overpass', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.3px;
  transform: translateY(-12px);
}

.sub-tabs-bar {
  background: #0e1826;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0;
  display: flex;
  justify-content: center;
}

.sub-tabs {
  display: flex;
  align-items: center;
}

.sub-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 10px 20px;
  font-size: 13px;
  font-family: 'Overpass', sans-serif;
  font-weight: 500;
  line-height: 1.2;
  color: #7a9ab8;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  margin: 0;
  margin-bottom: -1px;
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  vertical-align: middle;
  transform: translateY(3px);
}

.sub-tab.active {
  color: #3db4f2;
  border-bottom-color: #3db4f2;
  font-weight: 600;
}

.sub-tab:hover:not(.disabled):not(.active) {
  color: #9fbbd6;
}

.sub-tab.disabled {
  cursor: default;
}

[data-theme="winter"] .sub-tabs-bar {
  background: rgba(239, 246, 253, 0.78);
  border-bottom-color: rgba(23, 52, 78, 0.18);
}

[data-theme="winter"] .sub-tab {
  color: #4a6883;
}

[data-theme="winter"] .sub-tab.active {
  color: #1f88cb;
  border-bottom-color: #1f88cb;
}

[data-theme="winter"] .sub-tab:hover:not(.disabled):not(.active) {
  color: #2f577d;
}

@media (max-width: 1024px) {
  .banner-avatar {
    width: 110px;
    height: 110px;
  }

  .banner-content {
    left: 20px;
  }

  .sub-tab {
    padding: 9px 14px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .banner-wrap {
    height: clamp(200px, 44vw, 250px);
  }
}

@media (max-width: 640px) {
  .banner-content {
    left: 18px;
    gap: 14px;
  }

  .banner-meta {
    transform: translateY(-10px);
  }

  .banner-avatar {
    width: 102px;
    height: 102px;
  }

  .banner-username {
    font-size: clamp(24px, 6vw, 32px);
    margin-bottom: 4px;
  }

  .banner-joined {
    font-size: 13px;
  }

  .sub-tabs-bar {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .sub-tabs {
    min-width: max-content;
    padding: 0 8px;
  }
}

[data-theme="winter"] .banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(8, 12, 22, 0.2) 0%,
    rgba(8, 12, 22, 0.45) 75%,
    rgba(8, 12, 22, 0.58) 100%
  );
}
</style>

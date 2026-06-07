<template>
  <div class="profile-nav">
    <section class="banner-wrap" :class="{ 'has-image': Boolean(resolvedBannerUrl) }">
      <img v-if="resolvedBannerUrl" :src="resolvedBannerUrl" alt="" class="banner-image">
      <div class="banner-content">
        <div class="banner-avatar">
          <img v-if="resolvedAvatarUrl" :src="resolvedAvatarUrl" :alt="resolvedUsername || 'Avatar AniList'">
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
          <div class="banner-username">{{ resolvedUsername || 'Utilisateur' }}</div>
          <div class="banner-joined">Inscrit {{ resolvedJoinedDisplay }}</div>
        </div>
      </div>
    </section>

    <div class="border-b border-[var(--kz-border)] bg-[color-mix(in_srgb,var(--kz-card-bg)_88%,transparent)] supports-[backdrop-filter]:backdrop-blur-sm">
      <div class="tabs tabs-bordered mx-auto flex-nowrap justify-start overflow-x-auto px-2 sm:px-3 md:justify-center">
        <template v-for="tab in props.tabs" :key="tab.key">
          <NuxtLink
            v-if="tab.to && !tab.disabled"
            class="tab h-auto min-h-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[11px] font-medium text-[var(--kz-text-secondary)] transition hover:text-[var(--kz-text-primary)] sm:px-4 sm:text-xs md:px-5"
            :class="tabClass(tab)"
            :to="tab.to"
          >
            {{ tab.label }}
          </NuxtLink>
          <span
            v-else
            class="tab h-auto min-h-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[11px] font-medium text-[var(--kz-text-secondary)] transition sm:px-4 sm:text-xs md:px-5"
            :class="tabClass(tab)"
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
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


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
  String(props.username || authRecord.value.anilist_username || authRecord.value.username || 'Utilisateur')
)

const resolvedAvatarUrl = computed(() =>
  String(props.avatarUrl || authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
)

const resolvedBannerUrl = computed(() =>
  String(props.bannerUrl || authRecord.value.anilist_banner || '')
)

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

if (import.meta.client && !joinedCache.value) {
  joinedCache.value = localStorage.getItem('user_header_joined_display') || ''
}

const resolvedJoinedDisplay = computed(() => joinedCache.value || '-')

/**
 * Calcule la valeur « tab class ».
 *
 * @param tab - Valeur utilisée par le traitement « tab class ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const tabClass = (tab: SubTabItem) => ({
  'tab-active border-b-[var(--kz-accent)] text-[var(--kz-accent)]': Boolean(tab.active),
  'cursor-default opacity-45 hover:text-[var(--kz-text-secondary)]': Boolean(tab.disabled),
})

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
      { token: token.value, cacheTtlMs: 86_400_000 }
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

@media (max-width: 1024px) {
  .banner-avatar {
    width: 110px;
    height: 110px;
  }

  .banner-content {
    left: 20px;
  }
}

@media (max-width: 768px) {
  .banner-wrap {
    height: clamp(200px, 44vw, 250px);
  }
}

@media (max-width: 640px) {
  .banner-content {
    left: 12px;
    right: 12px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    text-align: center;
  }

  .banner-meta {
    transform: none;
    width: 100%;
    padding-bottom: 12px;
  }

  .banner-avatar {
    width: 92px;
    height: 92px;
  }

  .banner-username {
    font-size: clamp(22px, 6vw, 28px);
    margin-bottom: 2px;
  }

  .banner-joined {
    font-size: 12px;
    transform: none;
  }
}

@media (max-width: 420px) {
  .banner-wrap {
    height: 188px;
  }

  .banner-avatar {
    width: 84px;
    height: 84px;
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

<template>
  <div class="profile-page">
    <section class="banner-wrap" :class="{ 'has-image': Boolean(bannerSrc) }">
      <img v-if="bannerSrc" :src="bannerSrc" alt="AniList banner" class="banner-image" />
      <div class="banner-content">
        <div class="banner-avatar">
          <img v-if="avatarSrc" :src="avatarSrc" alt="AniList avatar" />
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8.5" r="4" />
            <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <div>
          <div class="banner-username">{{ username }}</div>
          <div class="banner-joined">Joined {{ joinedDisplay }}</div>
        </div>
      </div>
    </section>

    <main class="page">
      <section class="grid">
        <aside class="left">
          <div class="info-panel">
            <div class="field-row">
              <span class="field-label">AniList ID:</span>
              <span class="field-value">{{ anilistIdDisplay }}</span>
            </div>
          </div>

          <div class="panel">
            <span class="panel-title">Genre Overview</span>
            <div class="genre-tags">
              <template v-if="isLoading">
                <span v-for="n in 5" :key="`genre-skeleton-${n}`" class="tag skeleton-pulse" />
              </template>
              <template v-else>
                <span
                  v-for="genre in topGenres"
                  :key="genre.genre"
                  class="tag"
                  :style="{ background: getGenreColor(genre.genre) }"
                >
                  {{ genre.genre }}
                  <span class="tag-count">{{ genre.count }}</span>
                </span>
              </template>
            </div>
            <div class="genre-bar" :class="{ 'skeleton-pulse': isLoading }">
              <template v-if="!isLoading">
                <span
                  v-for="genre in barGenres"
                  :key="`bar-${genre.genre}`"
                  class="gb"
                  :style="{
                    width: `${(genre.count / barGenreTotal) * 100}%`,
                    background: getGenreColor(genre.genre)
                  }"
                />
              </template>
            </div>
          </div>

          <div class="panel" v-if="isLoading || hasFavoriteAnime">
            <span class="panel-title">Favorite Anime</span>
            <div class="fav-grid">
              <div v-if="isLoading" v-for="n in 5" :key="`fav-anime-skeleton-${n}`" class="fav-card">
                <div class="fav-placeholder skeleton-pulse">-</div>
              </div>
              <div v-else v-for="anime in favoriteAnime" :key="`fav-anime-${anime.id}`" class="fav-card">
                <img :src="anime.coverImage?.large || anime.coverImage?.medium" :alt="anime.title?.english || anime.title?.romaji || 'Anime cover'" />
              </div>
            </div>
          </div>

          <div class="panel" v-if="isLoading || hasFavoriteCharacters">
            <span class="panel-title">Favorite Characters</span>
            <div class="fav-grid">
              <div v-if="isLoading" v-for="n in 3" :key="`fav-char-skeleton-${n}`" class="fav-card">
                <div class="fav-placeholder skeleton-pulse">-</div>
              </div>
              <div v-else v-for="character in favoriteCharacters" :key="`fav-char-${character.id}`" class="fav-card">
                <img :src="character.image?.large || character.image?.medium" :alt="character.name?.full || character.name?.userPreferred || 'Character'" />
              </div>
            </div>
          </div>
        </aside>

        <section class="right">
          <div class="stats-panel">
            <div class="stats-row">
              <div class="stat">
                <span class="stat-num" :class="{ 'skeleton-pulse skeleton-text': isLoading }">
                  <span v-if="!isLoading">{{ totalAnimes }}</span>
                </span>
                <span class="stat-lbl">Total Animes</span>
              </div>
              <div class="stat">
                <span class="stat-num" :class="{ 'skeleton-pulse skeleton-text': isLoading }">
                  <span v-if="!isLoading">{{ daysWatched }}</span>
                </span>
                <span class="stat-lbl">Days Watched</span>
              </div>
              <div class="stat">
                <span class="stat-num" :class="{ 'skeleton-pulse skeleton-text': isLoading }">
                  <span v-if="!isLoading">{{ meanScore }}</span>
                </span>
                <span class="stat-lbl">Mean Score</span>
              </div>
            </div>
            <div class="progress-markers">
              <div class="marker"><span class="marker-num">50</span><div class="marker-tick" /></div>
              <div class="marker"><span class="marker-num">100</span><div class="marker-tick" /></div>
              <div class="marker"><span class="marker-num">150</span><div class="marker-tick" /></div>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :class="{ 'skeleton-pulse': isLoading }"
                :style="{ width: isLoading ? '31%' : `${Math.min((totalAnimes / 150) * 100, 100)}%` }"
              />
            </div>
          </div>

          <div class="panel">
            <div class="activity-header">
              <span class="activity-title">Activity</span>
            </div>

            <template v-if="isLoading || (activityLoading && activityItems.length === 0)">
              <div v-for="n in 6" :key="`activity-skeleton-${n}`" class="a-item skeleton-pulse">
                <div class="a-thumb" />
                <div class="a-body">
                  <div class="a-text skeleton-line" />
                </div>
              </div>
            </template>
            <template v-else>
              <article v-for="activity in activityItems" :key="activity.id" class="a-item">
                <div class="a-thumb">
                  <img v-if="activity.media?.coverImage?.medium" :src="activity.media.coverImage.medium" alt="Cover" />
                  <div v-else class="thumb-ph">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                    </svg>
                  </div>
                </div>
                <div class="a-body">
                  <div class="a-text">
                    {{ getActivityPrefix(activity) }}
                    <a
                      v-if="activity.media?.siteUrl"
                      :href="activity.media.siteUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ getActivityTitle(activity) }}
                    </a>
                    <span v-else>{{ getActivityTitle(activity) }}</span>
                  </div>
                </div>
                <span class="a-date">{{ timeAgo(activity.createdAt) }}</span>
              </article>
              <div v-if="activityLoading && activityItems.length > 0" class="activity-loading-more">
                Loading more...
              </div>
              <div v-else-if="!activityHasMore && activityItems.length === 0" class="activity-empty">
                No recent activity.
              </div>
              <div ref="activitySentinelRef" class="activity-sentinel" />
            </template>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useAnilistProfileStore } from '~/composables/useAnilistProfileStore'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'

definePageMeta({ middleware: ['auth'] })

const pocketbaseStore = usePocketbaseStore()
const profileStore = useAnilistProfileStore()
const {
  isLoading,
  totalAnimes,
  daysWatched,
  meanScore,
  genres,
  favoriteAnime,
  favoriteCharacters
} = storeToRefs(profileStore)

const {
  items: activityItems,
  loading: activityLoading,
  hasMore: activityHasMore,
  sentinelRef: activitySentinelRef,
  reset: resetActivityScroll
} = useInfiniteScroll<any>(
  async (page, perPage) => profileStore.fetchActivityPage(page, perPage),
  {
    threshold: 260,
    initialPage: 1,
    perPage: 15,
    immediate: false
  }
)

const GENRE_COLORS: Record<string, string> = {
  Action: '#F77F00',
  Adventure: '#4CC9F0',
  Comedy: '#68D639',
  Drama: '#02A9FF',
  Ecchi: '#FF6B9D',
  Fantasy: '#9256F3',
  Horror: '#D62828',
  'Mahou Shoujo': '#FF85C8',
  Mecha: '#6C8EBF',
  Music: '#FFBE0B',
  Mystery: '#7B2D8B',
  Psychological: '#9B2335',
  Romance: '#F779A4',
  'Sci-Fi': '#4361EE',
  'Slice of Life': '#A8DADC',
  Sports: '#06D6A0',
  Supernatural: '#6A0572',
  Thriller: '#E85D75'
}
function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? '#3db4f2'
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

function getActivityTitle(activity: any): string {
  return activity?.media?.title?.english ?? activity?.media?.title?.romaji ?? 'Unknown Title'
}

function getActivityPrefix(activity: any): string {
  const status = String(activity?.status ?? '').toLowerCase()
  const progress = activity?.progress

  if (status === 'watched') return `Watched episode ${progress ?? '?'} of `
  if (status === 'completed') return 'Completed '
  if (status === 'rewatched') return 'Rewatched '
  const raw = String(activity?.status ?? 'updated').replace(/_/g, ' ').toLowerCase()
  const normalized = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Updated'
  return `${normalized} `
}

const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
const username = computed(() => authRecord.value.anilist_username ?? 'Username')
const anilistIdDisplay = computed(() => authRecord.value.anilist_user_id ?? '-')
const avatarSrc = computed(() => authRecord.value.anilist_avatar_url_large || authRecord.value.anilist_avatar_url_medium || '')
const bannerSrc = computed(() => authRecord.value.anilist_banner || '')
const joinedDisplay = computed(() => {
  const created = authRecord.value.created
  if (!created) return '-'
  const date = new Date(created)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
})

const topGenres = computed(() => genres.value.slice(0, 5))
const barGenres = computed(() => genres.value.slice(0, 5))
const hasFavoriteAnime = computed(() => favoriteAnime.value.length > 0)
const hasFavoriteCharacters = computed(() => favoriteCharacters.value.length > 0)
const barGenreTotal = computed(() => {
  const sum = barGenres.value.reduce((acc, item) => acc + item.count, 0)
  return sum || 1
})

onMounted(async () => {
  await profileStore.loadProfile()
  await resetActivityScroll()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;600;700;900&family=Overpass+Mono:wght@600&family=Roboto:wght@400;500;800&display=swap');

.profile-page {
  min-height: 100vh;
  background: transparent;
  color: #fafafa;
}

.banner-wrap {
  width: 100%;
  height: clamp(220px, 30vw, 340px);
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
    rgba(5, 10, 20, 0.22) 0%,
    rgba(8, 12, 22, 0.5) 75%,
    rgba(8, 12, 22, 0.66) 100%
  );
}

.banner-wrap.has-image::after {
  display: none;
}

.banner-content {
  position: absolute;
  bottom: 26px;
  left: clamp(16px, 2.4vw, 40px);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.banner-avatar {
  width: 110px;
  height: 110px;
  border-radius: 8px;
  background: transparent;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
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

.banner-username {
  font-family: 'Overpass', sans-serif;
  font-size: clamp(24px, 2.8vw, 36px);
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
  margin-bottom: 4px;
}

.banner-joined {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.3px;
}

.page {
  width: min(100%, 1680px);
  margin: 0 auto;
  padding: 24px clamp(18px, 3vw, 64px) 80px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);
  gap: clamp(20px, 2.2vw, 34px);
  align-items: start;
}

.left,
.right {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel,
.stats-panel,
.info-panel {
  background: color-mix(in srgb, var(--kz-card-bg) 94%, #152232 6%);
  border: 1px solid var(--kz-border);
  border-radius: 2.5px;
}

.panel,
.stats-panel {
  padding: 16px;
}

.panel-title,
.activity-title {
  font-size: 13px;
  font-weight: 500;
  color: #9FADBD;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: block;
  text-transform: uppercase;
}

.info-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-row {
  min-height: 32px;
  background: var(--kz-soft-bg);
  border: 1px solid var(--kz-border);
  border-radius: 2.5px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #9FADBD;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.field-value {
  font-size: 12px;
  font-weight: 500;
  color: #fafafa;
  letter-spacing: 0.3px;
}

.genre-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.tag {
  height: 24px;
  padding: 0 12px;
  border-radius: 2.5px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  color: #fafafa;
  letter-spacing: 0.3px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.07);
}

.tag-count {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
}

.genre-bar {
  height: 10px;
  display: flex;
  margin: 0 -14px;
  overflow: hidden;
}

.gb {
  height: 100%;
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.fav-card {
  aspect-ratio: 2 / 3;
  border-radius: 5px;
  background: #0d1a27;
  overflow: hidden;
}

.fav-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fav-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a2a3a 0%, #0d1a27 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.15);
  font-size: 12px;
}

.stats-panel {
  padding: 18px 22px 20px;
}

.stats-row {
  display: flex;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
  align-items: stretch;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.stat + .stat {
  border-left: 1px solid rgba(255, 255, 255, 0.07);
  padding-left: 20px;
}

.stat-num {
  font-family: 'Overpass Mono', monospace;
  font-size: 26px;
  font-weight: 600;
  color: #25A5F2;
  display: block;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-lbl {
  font-size: 10px;
  font-weight: 500;
  color: #9FADBD;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.progress-markers {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.marker-num {
  font-size: 11px;
  color: #fff;
  letter-spacing: 0.5px;
}

.marker-tick {
  width: 1px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
}

.progress-track {
  height: 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #25A5F2;
  border-radius: 100px;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.a-item {
  background: color-mix(in srgb, var(--kz-card-bg) 92%, #0d1a27 8%);
  border: 1px solid var(--kz-border);
  border-radius: 2.5px;
  display: flex;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  min-height: 70px;
  margin-bottom: 8px;
}

.a-item:last-child {
  margin-bottom: 0;
}

.a-thumb {
  width: 54px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(31, 38, 49, 0.6);
}

.a-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-ph {
  color: rgba(255, 255, 255, 0.15);
}

.a-body {
  flex: 1;
  padding: 11px 72px 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.a-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--kz-text-secondary);
  letter-spacing: 0.3px;
  line-height: 1.5;
}

.a-text a {
  color: #25A5F2;
  text-decoration: none;
  font-weight: 500;
}

.a-text a:hover {
  text-decoration: underline;
}

.a-date {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 10px;
  font-weight: 500;
  color: color-mix(in srgb, var(--kz-text-secondary) 70%, transparent);
  white-space: nowrap;
}

.activity-loading-more,
.activity-empty {
  margin-top: 10px;
  font-size: 12px;
  color: var(--kz-text-secondary);
  text-align: center;
}

.activity-sentinel {
  height: 1px;
}

.skeleton-pulse {
  animation: pulse 1.4s infinite;
}

.skeleton-text {
  min-width: 52px;
  min-height: 18px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 4px;
}

.skeleton-line {
  width: 80%;
  height: 11px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 3px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 900px) {
  .page {
    padding-top: 18px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 700px) {
  .banner-wrap {
    height: 220px;
  }

  .banner-avatar {
    width: 88px;
    height: 88px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .stat + .stat {
    border-left: 0;
    padding-left: 0;
  }

  .a-date {
    position: static;
    margin: 0 12px 10px auto;
  }

  .a-body {
    padding-right: 12px;
  }

}

@media (max-width: 520px) {
  .page {
    padding-left: 12px;
    padding-right: 12px;
  }

  .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .a-item {
    min-height: 62px;
  }

  .a-thumb {
    width: 48px;
  }

  .a-text {
    font-size: 12px;
  }
}

[data-theme="winter"] .profile-page .banner-wrap.has-image::before {
  background: linear-gradient(
    180deg,
    rgba(8, 12, 22, 0.2) 0%,
    rgba(8, 12, 22, 0.45) 75%,
    rgba(8, 12, 22, 0.58) 100%
  );
}

[data-theme="winter"] .profile-page .panel,
[data-theme="winter"] .profile-page .stats-panel,
[data-theme="winter"] .profile-page .info-panel {
  background: rgba(245, 250, 255, 0.9);
  border-color: rgba(32, 62, 92, 0.26);
}

[data-theme="winter"] .profile-page .field-row {
  background: rgba(232, 242, 251, 0.95);
  border-color: rgba(32, 62, 92, 0.22);
}

[data-theme="winter"] .profile-page .a-item {
  background: rgba(236, 245, 253, 0.95);
  border-color: rgba(32, 62, 92, 0.22);
}

[data-theme="winter"] .profile-page .field-label,
[data-theme="winter"] .profile-page .a-text,
[data-theme="winter"] .profile-page .a-date,
[data-theme="winter"] .profile-page .panel-title,
[data-theme="winter"] .profile-page .activity-title,
[data-theme="winter"] .profile-page .stat-lbl {
  color: #3b5c78;
}

[data-theme="winter"] .profile-page .field-value,
[data-theme="winter"] .profile-page .marker-num,
[data-theme="winter"] .profile-page .stat-num {
  color: #1f3f5f;
  text-shadow: none;
}

[data-theme="winter"] .profile-page .banner-username {
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.42);
}

[data-theme="winter"] .profile-page .a-text a {
  color: #1d8ed8;
}
</style>

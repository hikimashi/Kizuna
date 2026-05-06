<template>
  <div class="notifications-page">
    <div class="page">
      <aside class="sidebar">
        <div class="sidebar-heading">Notifications</div>
        <p class="sidebar-copy">
          Dernieres mises a jour AniList pour votre compte.
        </p>

        <div class="sidebar-card">
          <span class="sidebar-card-label">Non lues</span>
          <span class="sidebar-card-value">{{ unreadCount }}</span>
        </div>

        <div class="sidebar-card">
          <span class="sidebar-card-label">Chargees</span>
          <span class="sidebar-card-value">{{ items.length }}</span>
        </div>

        <button class="sidebar-action" type="button" :disabled="isLoading" @click="refreshNotifications">
          {{ isLoading ? 'Actualisation...' : 'Actualiser les notifications' }}
        </button>

        <NuxtLink class="sidebar-link" to="/settings">
          Ouvrir les parametres
        </NuxtLink>
      </aside>

      <main class="main">
        <div class="top-bar">
          <div>
            <div class="page-title">Notifications</div>
            <p class="page-subtitle">
              Ouvrir cette page remet a zero le compteur AniList non lu.
            </p>
          </div>
        </div>

        <div v-if="loadError" class="state-card error-card">
          {{ loadError }}
        </div>

        <div v-if="!isAniListLinked" class="state-card">
          Liez votre compte AniList pour charger les notifications.
        </div>

        <div v-else-if="isLoading && !items.length" class="notification-list">
          <article v-for="n in 6" :key="`skeleton-${n}`" class="notification-card is-skeleton">
            <div class="notification-media skeleton-block"></div>
            <div class="notification-copy">
              <div class="notification-line skeleton-line"></div>
              <div class="notification-line skeleton-line short"></div>
              <div class="notification-line skeleton-line tiny"></div>
            </div>
          </article>
        </div>

        <div v-else-if="items.length" class="notification-list">
          <button
            v-for="item in items"
            :key="item.key"
            class="notification-card"
            type="button"
            @click="openNotification(item)"
          >
            <div class="notification-media" :class="{ 'is-avatar': useAvatarPreview(item) }">
              <img
                v-if="notificationPreview(item)"
                :src="notificationPreview(item)!"
                :alt="notificationPreviewAlt(item)"
              >
              <div v-else class="notification-fallback">
                {{ notificationFallback(item) }}
              </div>
            </div>

            <div class="notification-copy">
              <div class="notification-meta">
                <span class="notification-chip">{{ notificationLabel(item.type) }}</span>
                <span class="notification-time">{{ timeAgo(item.createdAt) }}</span>
              </div>

              <div class="notification-title">
                {{ notificationTitle(item) }}
              </div>

              <div v-if="notificationDetail(item)" class="notification-detail">
                {{ notificationDetail(item) }}
              </div>
            </div>

            <span class="notification-arrow" aria-hidden="true">›</span>
          </button>

          <button
            v-if="hasNextPage"
            class="load-more"
            type="button"
            :disabled="isLoading"
            @click="notificationStore.loadMore()"
          >
            {{ isLoading ? 'Chargement...' : 'Charger plus' }}
          </button>
        </div>

        <div v-else-if="!isLoading" class="state-card empty-card">
          <div class="empty-title">Aucune notification pour le moment</div>
          <p class="empty-copy">
            Quand AniList enverra des mises a jour sociales ou media, elles apparaitront ici.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnilistNotificationsStore, type AniListNotificationItem } from '~/composables/useAnilistNotificationsStore'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

definePageMeta({ middleware: ['auth'] })

const notificationStore = useAnilistNotificationsStore()
const pocketbaseStore = usePocketbaseStore()
const { unreadCount, items, isLoading, loadError, hasNextPage } = storeToRefs(notificationStore)

const authRecord = computed<Record<string, any>>(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const isAniListLinked = computed(() => Boolean(authRecord.value?.anilist_user_id && authRecord.value?.anilist_token))

const notificationLabel = (type: string) => {
  if (type === 'AIRING') return 'Diffusion'
  if (type.startsWith('MEDIA_')) return 'Media'
  if (type.startsWith('THREAD_')) return 'Forum'
  if (type.startsWith('ACTIVITY_')) return 'Social'
  if (type === 'FOLLOWING') return 'Suivi'
  if (type === 'RELATED_MEDIA_ADDITION') return 'Media lie'
  return 'Mise a jour'
}

const notificationTitle = (item: AniListNotificationItem) => {
  const actorName = item.actor?.name || 'utilisateur AniList'
  const mediaTitle = item.media?.title || 'ce titre'

  switch (item.type) {
    case 'AIRING':
      return `L'episode ${item.episode || '?'} de ${mediaTitle} vient d'etre diffuse.`
    case 'FOLLOWING':
      return `${actorName} vous suit.`
    case 'ACTIVITY_MESSAGE':
      return `${actorName} vous a envoye un message.`
    case 'ACTIVITY_REPLY':
      return `${actorName} a repondu a votre activite.`
    case 'ACTIVITY_MENTION':
      return `${actorName} vous a mentionne dans une activite.`
    case 'ACTIVITY_LIKE':
      return `${actorName} a aime votre activite.`
    case 'ACTIVITY_REPLY_LIKE':
      return `${actorName} a aime votre reponse d'activite.`
    case 'ACTIVITY_REPLY_SUBSCRIBED':
      return `${actorName} a repondu a une activite a laquelle vous participez.`
    case 'THREAD_COMMENT_MENTION':
      return `${actorName} vous a mentionne dans un commentaire de forum.`
    case 'THREAD_SUBSCRIBED':
      return `${actorName} a repondu a un fil suivi.`
    case 'THREAD_COMMENT_REPLY':
      return `${actorName} a repondu a votre commentaire de forum.`
    case 'THREAD_LIKE':
      return `${actorName} a aime votre sujet de forum.`
    case 'THREAD_COMMENT_LIKE':
      return `${actorName} a aime votre commentaire de forum.`
    case 'RELATED_MEDIA_ADDITION':
      return `${mediaTitle} a ete ajoute comme media lie.`
    case 'MEDIA_DATA_CHANGE':
      return `Les données de suivi de ${mediaTitle} ont change.`
    case 'MEDIA_MERGE':
      return `${mediaTitle} a ete fusionne avec une autre fiche.`
    case 'MEDIA_DELETION':
      return `${item.deletedMediaTitle || 'Un titre suivi'} a ete supprime d'AniList.`
    default:
      return `Notification de ${actorName}.`
  }
}

const notificationDetail = (item: AniListNotificationItem) => {
  if (item.type === 'MEDIA_MERGE' && item.deletedMediaTitles.length) {
    return `Fusionne depuis : ${item.deletedMediaTitles.join(', ')}`
  }
  if (item.reason) return item.reason
  if (item.thread?.title) return item.thread.title
  if (item.media?.title && !notificationTitle(item).includes(item.media.title)) return item.media.title
  if (item.actor?.name && item.type !== 'FOLLOWING') return `Par ${item.actor.name}`
  return ''
}

const notificationPreview = (item: AniListNotificationItem) => item.media?.cover || item.actor?.avatar || ''

const notificationPreviewAlt = (item: AniListNotificationItem) => item.media?.title || item.actor?.name || 'Apercu de notification'

const notificationFallback = (item: AniListNotificationItem) => {
  const seed = item.media?.title || item.actor?.name || item.thread?.title || 'NT'
  return seed.slice(0, 2).toUpperCase()
}

const useAvatarPreview = (item: AniListNotificationItem) => !item.media?.cover && Boolean(item.actor?.avatar)

const timeAgo = (timestamp: number) => {
  if (!timestamp) return 'Heure inconnue'

  const diff = Math.max(0, Math.floor(Date.now() / 1000) - Number(timestamp))
  if (diff < 60) return "A l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`

  const date = new Date(Number(timestamp) * 1000)
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
  }).format(date)
}

const openNotification = async (item: AniListNotificationItem) => {
  if (item.media?.id) {
    await navigateTo(`/anime/${item.media.id}`)
    return
  }

  if (item.thread?.id) {
    await navigateTo(`https://anilist.co/forum/thread/${item.thread.id}`, { external: true })
    return
  }

  if (item.actor?.id) {
    await navigateTo(`/social/user/${item.actor.id}`)
  }
}

const refreshNotifications = async () => {
  await notificationStore.loadNotifications({
    page: 1,
    perPage: 20,
    resetNotificationCount: false,
    force: true
  })
}

onMounted(async () => {
  if (!isAniListLinked.value) return
  await notificationStore.loadNotifications({
    page: 1,
    perPage: 20,
    resetNotificationCount: true,
    force: true
  })
})
</script>

<style scoped>
.notifications-page {
  min-height: calc(100vh - 64px);
  background: var(--kz-page-bg);
  color: var(--kz-text-primary);
}

.page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  width: min(1320px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 40px;
}

.sidebar {
  position: sticky;
  top: 18px;
  align-self: start;
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--kz-border);
  border-radius: 20px;
  background: var(--kz-card-bg);
}

.sidebar-heading {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.sidebar-copy {
  margin: 0;
  color: var(--kz-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.sidebar-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--kz-border);
  border-radius: 16px;
  background: var(--kz-soft-bg);
}

.sidebar-card-label {
  color: var(--kz-text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.sidebar-card-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.sidebar-action,
.sidebar-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid var(--kz-border);
  border-radius: 14px;
  background: var(--kz-soft-bg);
  color: var(--kz-text-primary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.sidebar-action:hover,
.sidebar-link:hover {
  background: var(--kz-soft-bg-hover);
  border-color: var(--kz-hover-border);
  transform: translateY(-1px);
}

.sidebar-action:disabled {
  cursor: default;
  opacity: 0.7;
  transform: none;
}

.main {
  display: grid;
  gap: 18px;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 6px 4px 2px;
}

.page-title {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(--kz-text-secondary);
  font-size: 14px;
}

.notification-list {
  display: grid;
  gap: 14px;
}

.notification-card,
.state-card {
  border: 1px solid var(--kz-border);
  border-radius: 18px;
  background: var(--kz-card-bg);
}

.notification-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.notification-card:hover {
  border-color: color-mix(in srgb, var(--kz-accent) 28%, var(--kz-border));
  background: color-mix(in srgb, var(--kz-card-bg) 90%, var(--kz-soft-bg-hover));
  transform: translateY(-1px);
}

.notification-card.is-skeleton {
  cursor: default;
}

.notification-media {
  width: 62px;
  height: 82px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--kz-hover-fill);
  flex-shrink: 0;
}

.notification-media.is-avatar {
  width: 62px;
  height: 62px;
  border-radius: 18px;
}

.notification-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notification-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--kz-text-primary);
  font-size: 16px;
  font-weight: 800;
}

.notification-copy {
  min-width: 0;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.notification-chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--kz-accent) 16%, transparent);
  color: var(--kz-accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.notification-time {
  color: var(--kz-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.notification-title {
  color: var(--kz-text-primary);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
}

.notification-detail {
  margin-top: 6px;
  color: var(--kz-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.notification-arrow {
  color: var(--kz-text-secondary);
  font-size: 26px;
  line-height: 1;
}

.state-card {
  padding: 22px;
}

.error-card {
  color: #f87171;
}

.empty-card {
  text-align: center;
}

.empty-title {
  font-size: 22px;
  font-weight: 800;
}

.empty-copy {
  margin: 8px 0 0;
  color: var(--kz-text-secondary);
  font-size: 14px;
}

.load-more {
  min-height: 48px;
  border: 1px solid var(--kz-border);
  border-radius: 16px;
  background: var(--kz-card-bg);
  color: var(--kz-text-primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.load-more:hover {
  background: var(--kz-soft-bg-hover);
  border-color: color-mix(in srgb, var(--kz-accent) 24%, var(--kz-border));
}

.load-more:disabled {
  opacity: 0.7;
  cursor: default;
}

.skeleton-block,
.skeleton-line {
  background: linear-gradient(90deg, var(--kz-soft-bg) 0%, color-mix(in srgb, var(--kz-card-bg) 70%, white 30%) 50%, var(--kz-soft-bg) 100%);
  background-size: 200% 100%;
  animation: notifications-shimmer 1.4s ease-in-out infinite;
}

.skeleton-line {
  height: 14px;
  border-radius: 999px;
}

.skeleton-line.short {
  width: 58%;
  margin-top: 10px;
}

.skeleton-line.tiny {
  width: 34%;
  margin-top: 10px;
}

@keyframes notifications-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 980px) {
  .page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
  }

  .sidebar-heading,
  .sidebar-copy {
    grid-column: 1 / -1;
  }

  .sidebar-action,
  .sidebar-link {
    grid-column: span 2;
  }
}

@media (max-width: 700px) {
  .page {
    width: min(100%, calc(100% - 20px));
    padding-top: 14px;
  }

  .sidebar {
    grid-template-columns: 1fr 1fr;
    padding: 14px;
  }

  .top-bar {
    padding: 0;
  }

  .page-title {
    font-size: 28px;
  }

  .notification-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .notification-arrow {
    display: none;
  }
}

@media (max-width: 520px) {
  .sidebar {
    grid-template-columns: 1fr;
  }

  .sidebar-action,
  .sidebar-link {
    grid-column: auto;
  }

  .notification-card {
    gap: 12px;
    padding: 12px;
  }

  .notification-media {
    width: 54px;
    height: 72px;
  }

  .notification-media.is-avatar {
    width: 54px;
    height: 54px;
  }
}
</style>

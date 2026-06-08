<template>
  <div class="notifications-page">
    <div class="page">
      <aside class="sidebar shadow-xl backdrop-blur-sm">
        <div class="sidebar-heading">Notifications</div>
        <p class="sidebar-copy">
          Dernières mises à jour AniList pour votre compte.
        </p>

        <div class="sidebar-card shadow-sm">
          <span class="sidebar-card-label">Non lues</span>
          <span class="sidebar-card-value">{{ unreadCount }}</span>
        </div>

        <div class="sidebar-card shadow-sm">
          <span class="sidebar-card-label">Chargees</span>
          <span class="sidebar-card-value">{{ items.length }}</span>
        </div>

        <button class="sidebar-action shadow-sm" type="button" :disabled="isLoading" @click="refreshNotifications">
          {{ isLoading ? 'Actualisation...' : 'Actualiser les notifications' }}
        </button>

        <NuxtLink class="sidebar-link shadow-sm" to="/settings">
          Ouvrir les paramètres
        </NuxtLink>
      </aside>

      <main class="main">
        <div class="top-bar">
          <div>
            <div class="page-title">Notifications</div>
            <p class="page-subtitle">
              Ouvrir cette page remet à zéro le compteur AniList non lu.
            </p>
          </div>
        </div>

        <div v-if="loadError" class="state-card error-card shadow-sm">
          {{ loadError }}
        </div>

        <div v-if="!isAniListLinked" class="state-card shadow-sm">
          Liez votre compte AniList pour charger les notifications.
        </div>

        <div v-else-if="isLoading && !items.length" class="notification-list">
          <article v-for="n in 6" :key="`skeleton-${n}`" class="notification-card is-skeleton shadow-sm">
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
            class="notification-card shadow-sm"
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
            class="load-more shadow-sm"
            type="button"
            :disabled="isLoading"
            @click="notificationStore.loadMore()"
          >
            {{ isLoading ? 'Chargement...' : 'Charger plus' }}
          </button>
        </div>

        <div v-else-if="!isLoading" class="state-card empty-card shadow-sm">
          <div class="empty-title">Aucune notification pour le moment</div>
          <p class="empty-copy">
            Quand AniList enverra des mises à jour sociales ou média, elles apparaîtront ici.
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
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


const notificationStore = useAnilistNotificationsStore()
const pocketbaseStore = usePocketbaseStore()
const { unreadCount, items, isLoading, loadError, hasNextPage } = storeToRefs(notificationStore)

const authRecord = computed<Record<string, any>>(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const isAniListLinked = computed(() => Boolean(authRecord.value?.anilist_user_id && authRecord.value?.anilist_token))

/**
 * Calcule la valeur « notification label ».
 *
 * @param type - Valeur utilisée par le traitement « notification label ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const notificationLabel = (type: string) => {
  if (type === 'AIRING') return 'Diffusion'
  if (type.startsWith('MEDIA_')) return 'Media'
  if (type.startsWith('THREAD_')) return 'Forum'
  if (type.startsWith('ACTIVITY_')) return 'Social'
  if (type === 'FOLLOWING') return 'Suivi'
  if (type === 'RELATED_MEDIA_ADDITION') return 'Média lié'
  return 'Mise à jour'
}

/**
 * Calcule la valeur « notification title ».
 *
 * @param item - Valeur utilisée par le traitement « notification title ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const notificationTitle = (item: AniListNotificationItem) => {
  const actorName = item.actor?.name || 'utilisateur AniList'
  const mediaTitle = item.media?.title || 'ce titre'

  // Les types AniList sont techniques; on les transforme en phrases lisibles côté UI.
  switch (item.type) {
    case 'AIRING':
      return `L'épisode ${item.episode || '?'} de ${mediaTitle} vient d'être diffusé.`
    case 'FOLLOWING':
      return `${actorName} vous suit.`
    case 'ACTIVITY_MESSAGE':
      return `${actorName} vous a envoyé un message.`
    case 'ACTIVITY_REPLY':
      return `${actorName} a répondu à votre activité.`
    case 'ACTIVITY_MENTION':
      return `${actorName} vous a mentionné dans une activité.`
    case 'ACTIVITY_LIKE':
      return `${actorName} a aimé votre activité.`
    case 'ACTIVITY_REPLY_LIKE':
      return `${actorName} a aimé votre réponse d'activité.`
    case 'ACTIVITY_REPLY_SUBSCRIBED':
      return `${actorName} a répondu à une activité à laquelle vous participez.`
    case 'THREAD_COMMENT_MENTION':
      return `${actorName} vous a mentionné dans un commentaire de forum.`
    case 'THREAD_SUBSCRIBED':
      return `${actorName} a répondu à un fil suivi.`
    case 'THREAD_COMMENT_REPLY':
      return `${actorName} a répondu à votre commentaire de forum.`
    case 'THREAD_LIKE':
      return `${actorName} a aimé votre sujet de forum.`
    case 'THREAD_COMMENT_LIKE':
      return `${actorName} a aimé votre commentaire de forum.`
    case 'RELATED_MEDIA_ADDITION':
      return `${mediaTitle} a été ajouté comme média lié.`
    case 'MEDIA_DATA_CHANGE':
      return `Les données de suivi de ${mediaTitle} ont change.`
    case 'MEDIA_MERGE':
      return `${mediaTitle} a été fusionné avec une autre fiche.`
    case 'MEDIA_DELETION':
      return `${item.deletedMediaTitle || 'Un titre suivi'} a été supprimé d'AniList.`
    default:
      return `Notification de ${actorName}.`
  }
}

/**
 * Calcule la valeur « notification detail ».
 *
 * @param item - Valeur utilisée par le traitement « notification detail ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const notificationDetail = (item: AniListNotificationItem) => {
  // Détail secondaire: raison AniList, titre de thread ou acteur selon le type disponible.
  if (item.type === 'MEDIA_MERGE' && item.deletedMediaTitles.length) {
    return `Fusionne depuis : ${item.deletedMediaTitles.join(', ')}`
  }
  if (item.reason) return item.reason
  if (item.thread?.title) return item.thread.title
  if (item.media?.title && !notificationTitle(item).includes(item.media.title)) return item.media.title
  if (item.actor?.name && item.type !== 'FOLLOWING') return `Par ${item.actor.name}`
  return ''
}

/**
 * Calcule la valeur « notification preview ».
 *
 * @param item - Valeur utilisée par le traitement « notification preview ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const notificationPreview = (item: AniListNotificationItem) => item.media?.cover || item.actor?.avatar || ''

/**
 * Calcule la valeur « notification preview alt ».
 *
 * @param item - Valeur utilisée par le traitement « notification preview alt ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const notificationPreviewAlt = (item: AniListNotificationItem) => item.media?.title || item.actor?.name || 'Aperçu de notification'

/**
 * Calcule la valeur « notification fallback ».
 *
 * @param item - Valeur utilisée par le traitement « notification fallback ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const notificationFallback = (item: AniListNotificationItem) => {
  const seed = item.media?.title || item.actor?.name || item.thread?.title || 'NT'
  return seed.slice(0, 2).toUpperCase()
}

/**
 * Calcule la valeur « avatar preview ».
 *
 * @param item - Valeur utilisée par le traitement « avatar preview ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const useAvatarPreview = (item: AniListNotificationItem) => !item.media?.cover && Boolean(item.actor?.avatar)

/**
 * Calcule la valeur « time ago ».
 *
 * @param timestamp - Valeur utilisée par le traitement « time ago ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
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

/**
 * Ouvre notification.
 *
 * @param item - Valeur utilisée par le traitement « open notification ».
 * @returns Une promesse résolue avec le résultat du traitement.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const openNotification = async (item: AniListNotificationItem) => {
  // Priorité média > thread > acteur, car c'est généralement la cible la plus utile.
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

/**
 * Calcule la valeur « refresh notifications ».
 *
 * @returns Une promesse résolue une fois le traitement terminé.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const refreshNotifications = async () => {
  // Rafraichissement manuel sans marquer comme lu.
  await notificationStore.loadNotifications({
    page: 1,
    perPage: 20,
    resetNotificationCount: false,
    force: true
  })
}

onMounted(async () => {
  if (!isAniListLinked.value) return
  // Première ouverture de la page: AniList remet le compteur non lu à zéro.
  await notificationStore.loadNotifications({
    page: 1,
    perPage: 20,
    resetNotificationCount: true,
    force: true
  })
})
</script>

<style scoped src="~/assets/css/pages/notifications.css"></style>

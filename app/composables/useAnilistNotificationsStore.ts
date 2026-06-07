import { defineStore } from 'pinia'
import { computed, ref, unref } from 'vue'
import { usePocketbaseStore } from './usePocketbaseStore'
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


type NotificationUserPreview = {
  id: number
  name: string
  avatar?: {
    medium?: string | null
    large?: string | null
  } | null
} | null

type NotificationMediaPreview = {
  id: number
  title?: {
    userPreferred?: string | null
  } | null
  coverImage?: {
    medium?: string | null
    large?: string | null
  } | null
} | null

type NotificationThreadPreview = {
  id: number
  title?: string | null
} | null

type RawNotificationNode = {
  __typename?: string
  id?: number
  type?: string
  createdAt?: number
  episode?: number
  reason?: string | null
  deletedMediaTitle?: string | null
  deletedMediaTitles?: Array<string | null> | null
  user?: NotificationUserPreview
  media?: NotificationMediaPreview
  thread?: NotificationThreadPreview
}

export type AniListNotificationItem = {
  key: string
  id: number
  type: string
  createdAt: number
  actor?: {
    id: number
    name: string
    avatar?: string
  }
  media?: {
    id: number
    title: string
    cover?: string
  }
  thread?: {
    id: number
    title: string
  }
  episode?: number
  reason?: string
  deletedMediaTitle?: string
  deletedMediaTitles: string[]
}

const notificationsQuery = `
query ($page: Int, $perPage: Int, $resetNotificationCount: Boolean) {
  Viewer {
    unreadNotificationCount
  }
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
    }
    notifications(resetNotificationCount: $resetNotificationCount) {
      __typename
      ... on AiringNotification {
        id
        type
        createdAt
        episode
        media {
          id
          title {
            userPreferred
          }
          coverImage {
            medium
            large
          }
        }
      }
      ... on FollowingNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ActivityMessageNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ActivityMentionNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ActivityReplyNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ActivityReplySubscribedNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ActivityLikeNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ActivityReplyLikeNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
      }
      ... on ThreadCommentMentionNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
        thread {
          id
          title
        }
      }
      ... on ThreadCommentReplyNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
        thread {
          id
          title
        }
      }
      ... on ThreadCommentSubscribedNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
        thread {
          id
          title
        }
      }
      ... on ThreadCommentLikeNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
        thread {
          id
          title
        }
      }
      ... on ThreadLikeNotification {
        id
        type
        createdAt
        user {
          id
          name
          avatar {
            medium
            large
          }
        }
        thread {
          id
          title
        }
      }
      ... on RelatedMediaAdditionNotification {
        id
        type
        createdAt
        media {
          id
          title {
            userPreferred
          }
          coverImage {
            medium
            large
          }
        }
      }
      ... on MediaDataChangeNotification {
        id
        type
        createdAt
        reason
        media {
          id
          title {
            userPreferred
          }
          coverImage {
            medium
            large
          }
        }
      }
      ... on MediaMergeNotification {
        id
        type
        createdAt
        reason
        deletedMediaTitles
        media {
          id
          title {
            userPreferred
          }
          coverImage {
            medium
            large
          }
        }
      }
      ... on MediaDeletionNotification {
        id
        type
        createdAt
        reason
        deletedMediaTitle
      }
    }
  }
}
`

const unreadCountQuery = `
query {
  Viewer {
    unreadNotificationCount
  }
}
`

/**
 * Retourne avatar.
 *
 * @param user - Valeur utilisée par le traitement « get avatar ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const getAvatar = (user?: NotificationUserPreview) =>
  user?.avatar?.large || user?.avatar?.medium || undefined

/**
 * Retourne cover.
 *
 * @param media - Valeur utilisée par le traitement « get cover ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const getCover = (media?: NotificationMediaPreview) =>
  media?.coverImage?.large || media?.coverImage?.medium || undefined

/**
 * Retourne media title.
 *
 * @param media - Valeur utilisée par le traitement « get media title ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const getMediaTitle = (media?: NotificationMediaPreview) =>
  String(media?.title?.userPreferred || 'Media sans titre')

/**
 * Normalise notification.
 *
 * @param node - Valeur utilisée par le traitement « normalize notification ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeNotification = (node: RawNotificationNode): AniListNotificationItem | null => {
  const id = Number(node?.id || 0)
  if (!Number.isFinite(id) || id <= 0) return null

  // Toutes les notifications AniList ne possèdent pas un acteur, un média ou un thread.
  const actor = node?.user?.id
    ? {
        id: Number(node.user.id),
        name: String(node.user.name || 'Utilisateur inconnu'),
        avatar: getAvatar(node.user)
      }
    : undefined

  const media = node?.media?.id
    ? {
        id: Number(node.media.id),
        title: getMediaTitle(node.media),
        cover: getCover(node.media)
      }
    : undefined

  const thread = node?.thread?.id
    ? {
        id: Number(node.thread.id),
        title: String(node.thread.title || 'Discussion du forum')
      }
    : undefined

  return {
    // La clé combine type et id pour éviter les collisions entre fragments de notification.
    key: `${String(node?.type || node?.__typename || 'notification').toLowerCase()}:${id}`,
    id,
    type: String(node?.type || node?.__typename || 'UNKNOWN'),
    createdAt: Number(node?.createdAt || 0),
    actor,
    media,
    thread,
    episode: Number(node?.episode || 0) || undefined,
    reason: node?.reason ? String(node.reason) : undefined,
    deletedMediaTitle: node?.deletedMediaTitle ? String(node.deletedMediaTitle) : undefined,
    deletedMediaTitles: Array.isArray(node?.deletedMediaTitles)
      ? node.deletedMediaTitles.map(value => String(value || '')).filter(Boolean)
      : []
  }
}

export const useAnilistNotificationsStore = defineStore('anilistNotifications', () => {
  const pocketbaseStore = usePocketbaseStore()
  const anilistGraphql = useAnilistGraphql()

  const authRecord = computed<Record<string, any>>(() => unref(pocketbaseStore.authRecord) ?? {})
  const token = computed(() => String(authRecord.value.anilist_token ?? ''))
  const userId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
  const userKey = computed(() => `${userId.value || 0}:${token.value ? 'linked' : 'anon'}`)

  const unreadCount = ref(0)
  const items = ref<AniListNotificationItem[]>([])
  const isLoading = ref(false)
  const isLoadingUnread = ref(false)
  const loadError = ref('')
  const hasNextPage = ref(false)
  const currentPage = ref(1)
  const loadedForKey = ref('')

  const isLinked = computed(() => Boolean(userId.value && token.value))

  /**
   * Analyse error message.
   *
   * @param response - Valeur utilisée par le traitement « parse error message ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const parseErrorMessage = (response: any) => {
    if (!Array.isArray(response?.errors) || !response.errors.length) return ''
    return response.errors.map((error: any) => String(error?.message || '')).filter(Boolean).join(' | ')
  }

  /**
   * Réinitialise reset.
   *
   * @param keepUnread - Valeur utilisée par le traitement « reset ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const reset = (keepUnread = false) => {
    items.value = []
    isLoading.value = false
    loadError.value = ''
    hasNextPage.value = false
    currentPage.value = 1
    loadedForKey.value = ''
    if (!keepUnread) unreadCount.value = 0
  }

  /**
   * Exécute graphql.
   *
   * @param query - Valeur utilisée par le traitement « request graphql ».
   * @param variables - Valeur utilisée par le traitement « request graphql ».
   * @param options - Valeur utilisée par le traitement « request graphql ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const requestGraphql = async (
    query: string,
    variables: Record<string, any>,
    options: {
      cacheTtlMs?: number
      skipCache?: boolean
    } = {}
  ) => {
    return await anilistGraphql.request<any>(
      query,
      variables,
      {
        token: token.value,
        cacheTtlMs: options.cacheTtlMs ?? 30_000,
        skipCache: options.skipCache ?? false
      }
    )
  }

  /**
   * Charge unread count.
   *
   * @param force - Valeur utilisée par le traitement « load unread count ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif, peut écrire dans les journaux.
   */
  const loadUnreadCount = async (force = false) => {
    if (!isLinked.value) {
      unreadCount.value = 0
      return
    }

    // Si la liste complète est déjà chargée pour ce compte, le compteur courant suffit.
    if (!force && loadedForKey.value === userKey.value && items.value.length) return
    if (isLoadingUnread.value) return

    isLoadingUnread.value = true
    try {
      const response = await requestGraphql(unreadCountQuery, {}, { cacheTtlMs: 15_000 })
      const errorMessage = parseErrorMessage(response)
      if (errorMessage) throw new Error(errorMessage)
      unreadCount.value = Number(response?.data?.Viewer?.unreadNotificationCount || 0)
    } catch (error) {
      console.error('[notifications] unread count failed', error)
    } finally {
      isLoadingUnread.value = false
    }
  }

  /**
   * Charge notifications.
   *
   * @param options - Valeur utilisée par le traitement « load notifications ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif, peut écrire dans les journaux.
   */
  const loadNotifications = async (options: {
    page?: number
    perPage?: number
    resetNotificationCount?: boolean
    force?: boolean
  } = {}) => {
    if (!isLinked.value) {
      reset()
      return
    }

    const page = Math.max(1, Number(options.page || 1))
    const perPage = Math.min(50, Math.max(1, Number(options.perPage || 20)))
    const resetNotificationCount = Boolean(options.resetNotificationCount)
    const isFirstPage = page === 1

    // Évite de recharger la première page si elle correspond déjà au compte courant.
    if (isLoading.value) return
    if (!options.force && isFirstPage && loadedForKey.value === userKey.value && items.value.length && !resetNotificationCount) {
      return
    }

    isLoading.value = true
    if (isFirstPage) loadError.value = ''

    try {
      const response = await requestGraphql(
        notificationsQuery,
        { page, perPage, resetNotificationCount },
        {
          cacheTtlMs: resetNotificationCount ? 0 : 20_000,
          skipCache: resetNotificationCount
        }
      )

      const errorMessage = parseErrorMessage(response)
      if (errorMessage) throw new Error(errorMessage)

      const pageInfo = response?.data?.Page?.pageInfo
      const rawItems = Array.isArray(response?.data?.Page?.notifications) ? response.data.Page.notifications : []
      const normalizedItems = rawItems
        .map((item: RawNotificationNode) => normalizeNotification(item))
        .filter((item: AniListNotificationItem | null): item is AniListNotificationItem => Boolean(item))

      if (isFirstPage) {
        items.value = normalizedItems
      } else {
        // Les pages peuvent se recouvrir si AniList change entre deux appels; la Map déduplique.
        const merged = new Map<string, AniListNotificationItem>()
        for (const item of [...items.value, ...normalizedItems]) {
          merged.set(item.key, item)
        }
        items.value = Array.from(merged.values())
      }

      currentPage.value = Number(pageInfo?.currentPage || page)
      hasNextPage.value = Boolean(pageInfo?.hasNextPage)
      loadedForKey.value = userKey.value

      if (resetNotificationCount) {
        // resetNotificationCount est la lecture "marquer comme lu" d'AniList.
        unreadCount.value = 0
      } else {
        unreadCount.value = Number(response?.data?.Viewer?.unreadNotificationCount || 0)
      }
    } catch (error: any) {
      console.error('[notifications] load failed', error)
      loadError.value = error?.message || 'Impossible de charger les notifications AniList.'
      if (isFirstPage) {
        items.value = []
        hasNextPage.value = false
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Charge more.
   *
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const loadMore = async () => {
    if (!hasNextPage.value || isLoading.value) return
    await loadNotifications({ page: currentPage.value + 1 })
  }

  return {
    unreadCount,
    items,
    isLinked,
    isLoading,
    isLoadingUnread,
    loadError,
    hasNextPage,
    currentPage,
    loadUnreadCount,
    loadNotifications,
    loadMore,
    reset
  }
})

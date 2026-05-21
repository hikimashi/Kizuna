import { unref } from 'vue'
import { navigateTo } from '#app'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useMyAuthStore } from '~/composables/useMyAuthStore'
import { useToastStore } from '~/composables/useToastStore'

const PUBLIC_PATHS = new Set(['/', '/auth/callback', '/manuel'])
// Les profils sociaux publics restent accessibles sans session locale.
const PUBLIC_PATH_PATTERNS = [/^\/social\/user\/[^/]+$/]

export default defineNuxtRouteMiddleware(async (to) => {
  // L'auth PocketBase est côté client (localStorage), on ignore donc le guard SSR pour éviter de faux redirects au refresh.
  if (import.meta.server) return

  if (PUBLIC_PATHS.has(to.path) || PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(to.path))) return

  const pocketbaseStore = usePocketbaseStore()
  const authStore = useMyAuthStore()
  const hasToken = Boolean(pocketbaseStore.pb.authStore.token)

  if (hasToken) {
    await authStore.authRefresh()
  }

  const authRecord = unref(pocketbaseStore.authRecord) as Record<string, any> | null
  const isLoggedIn = Boolean(authRecord?.id)
  const isAniListLinked = Boolean(authRecord?.anilist_user_id && authRecord?.anilist_token)

  if (isLoggedIn && isAniListLinked) return

  // Un compte local sans AniList lié reste bloqué sur l'accueil, qui affiche l'état de liaison requis.
  if (isLoggedIn && !isAniListLinked) {
    if (to.path !== '/') {
      return navigateTo('/')
    }
    return
  }

  if (isLoggedIn) return

  if (process.client) {
    const toastStore = useToastStore()
    toastStore.openToast({
      type: 'warning',
      message: 'Tu dois te connecter pour accéder à cette page.'
    })
  }

  return navigateTo('/')
})

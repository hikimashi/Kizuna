import { unref } from 'vue'
import { navigateTo } from '#app'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useMyAuthStore } from '~/composables/useMyAuthStore'
import { useToastStore } from '~/composables/useToastStore'

const PUBLIC_PATHS = new Set(['/', '/auth/callback'])

export default defineNuxtRouteMiddleware(async (to) => {
  // PocketBase auth is client-side (localStorage), skip SSR guard to avoid false redirects on refresh.
  if (process.server) return

  if (PUBLIC_PATHS.has(to.path)) return

  const pocketbaseStore = usePocketbaseStore()
  const authStore = useMyAuthStore()
  const hasToken = Boolean(pocketbaseStore.pb.authStore.token)

  const hasDirectSession = Boolean(pocketbaseStore.pb.authStore.model?.id) || pocketbaseStore.pb.authStore.isValid
  if (hasDirectSession) return
  if (hasToken) {
    await authStore.authRefresh()
    return
  }

  const authRecord = unref(pocketbaseStore.authRecord) as Record<string, any> | null
  const isLoggedIn = Boolean(authRecord?.id)
  const isAniListLinked = Boolean(authRecord?.anilist_user_id && authRecord?.anilist_token)

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
      message: 'Tu dois te connecter pour acceder a cette page.'
    })
  }

  return navigateTo('/')
})

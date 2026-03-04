import { unref } from 'vue'
import { navigateTo } from '#app'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useToastStore } from '~/composables/useToastStore'

const PUBLIC_PATHS = new Set(['/', '/auth/callback'])

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_PATHS.has(to.path)) return

  const pocketbaseStore = usePocketbaseStore()
  const authRecord = unref(pocketbaseStore.authRecord) as { id?: string } | null
  const isLoggedIn = Boolean(authRecord?.id)

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

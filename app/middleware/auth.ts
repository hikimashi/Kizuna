import { navigateTo } from '#app';
import { useUserStore } from '~/composables/useUserStore';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore();
  const pocketbaseStore = usePocketbaseStore();

  // Allow access to auth callback page without authentication
  if (to.path === '/auth/callback') {
    return;
  }

  if (!pocketbaseStore.pb.authStore.isValid || !userStore.userData) {
    return navigateTo('/');
  }
});
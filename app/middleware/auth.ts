import { navigateTo } from '#app';
import { unref } from 'vue';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';

export default defineNuxtRouteMiddleware(async (to) => {
  // L'auth PocketBase est cote client (localStorage), on ignore donc le guard SSR pour eviter de faux redirects au refresh.
  if (process.server) return;

  const pocketbaseStore = usePocketbaseStore();
  const authStore = useMyAuthStore();
  const hasToken = Boolean(pocketbaseStore.pb.authStore.token);

  // Autorise l'acces a la page de callback auth sans authentification.
  if (to.path === '/auth/callback') {
    return;
  }

  const hasDirectSession = Boolean(pocketbaseStore.pb.authStore.model?.id) || pocketbaseStore.pb.authStore.isValid;
  if (hasDirectSession) return;
  if (hasToken) {
    await authStore.authRefresh();
    return;
  }

  const authRecord = unref(pocketbaseStore.authRecord) as Record<string, any> | null;
  const isLoggedIn = Boolean(authRecord?.id);
  const isAniListLinked = Boolean(authRecord?.anilist_user_id && authRecord?.anilist_token);

  if (isLoggedIn && !isAniListLinked) {
    return navigateTo('/');
  }

  if (!isLoggedIn) {
    return navigateTo('/');
  }
});

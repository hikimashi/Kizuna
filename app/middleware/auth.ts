/**
 * auth.ts
 * Middleware de protection des routes.
 * Redirige vers l'accueil si l'utilisateur n'est pas connecté.
 */

import { navigateTo } from '#app';
import { useUserStore } from '~/composables/useUserStore';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore();
  const pocketbaseStore = usePocketbaseStore();

  // Exception : page callback AniList (doit être accessible sans auth)
  if (to.path === '/auth/callback') {
    return;
  }

  // Vérifie l'authentification
  if (!pocketbaseStore.pb.authStore.isValid || !userStore.userData) {
    return navigateTo('/');
  }
});

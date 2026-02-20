/**
 * auth.client.ts
 * Plugin Nuxt pour l'initialisation de l'authentification.
 * Exécuté uniquement côté client au démarrage.
 */

export default defineNuxtPlugin(async () => {
  const authStore = useMyAuthStore();
  const themeStore = useThemeStore();

  // Rafraîchit l'état d'authentification (vérifie le token localStorage)
  await authStore.authRefresh();

  // Initialise le thème (localStorage ou userData)
  themeStore.setTheme();
});

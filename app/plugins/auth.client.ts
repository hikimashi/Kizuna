// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────

export default defineNuxtPlugin(async () => {
  // Ce plugin rafraîchit l'état d'authentification au démarrage de l'application.
  const authStore = useMyAuthStore();
  const themeStore = useThemeStore();

  // Applique le thème sauvegardé immédiatement, puis le revalide après le refresh auth.
  themeStore.setTheme();
  await authStore.authRefresh();
  themeStore.setTheme();
});

export default defineNuxtPlugin(async () => {
  // Ce plugin rafraichit l'etat d'authentification au demarrage de l'application.
  const authStore = useMyAuthStore();
  const themeStore = useThemeStore();

  // Applique le theme sauvegarde immediatement, puis le revalide apres le refresh auth.
  themeStore.setTheme();
  await authStore.authRefresh();
  themeStore.setTheme();
});

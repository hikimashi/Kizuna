export default defineNuxtPlugin(async () => {
  // This plugin ensures that the authentication state is refreshed when the app initializes
  const authStore = useMyAuthStore();
  const themeStore = useThemeStore();

  // Apply saved theme immediately, then re-resolve after auth refresh.
  themeStore.setTheme();
  await authStore.authRefresh();
  themeStore.setTheme();
});

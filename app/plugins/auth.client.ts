export default defineNuxtPlugin(async () => {
  // This plugin ensures that the authentication state is refreshed when the app initializes
  const authStore = useMyAuthStore();
  const themeStore = useThemeStore();

  await authStore.authRefresh();

  themeStore.setTheme();
});

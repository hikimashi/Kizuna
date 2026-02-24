import { useAppConfig } from '~/composables/useAppConfig';

export default defineNuxtPlugin(async (nuxtApp) => {
  const { fetchConfig } = useAppConfig();
  await fetchConfig();
});

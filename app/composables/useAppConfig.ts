import { ref } from 'vue';

const configCache = ref<{
  pocketbaseUrl: string;
  anilistClientId: string;
  anilistRedirectUri: string;
} | null>(null);

export const useAppConfig = () => {
  const fetchConfig = async () => {
    if (configCache.value) {
      return configCache.value;
    }

    try {
      const config = await $fetch<{
      pocketbaseUrl: string;
      anilistClientId: string;
      anilistRedirectUri: string;
    }>('/api/config');
      configCache.value = config;
      return config;
    } catch (error) {
      console.error('Failed to fetch app config:', error);
      return {
        pocketbaseUrl: 'https://anna.clementlopes.site',
        anilistClientId: '',
        anilistRedirectUri: '',
      };
    }
  };

  return {
    fetchConfig,
    configCache,
  };
};

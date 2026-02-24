import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import PocketBase from 'pocketbase';
import { useAppConfig } from './useAppConfig';

export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  const { configCache } = useAppConfig();
  
  const pbInstance = computed(() => {
    const url = configCache.value?.pocketbaseUrl || 'https://anna.clementlopes.site';
    return new PocketBase(url);
  });
  
  const authRecord = ref(pbInstance.value.authStore.model);
  const authToken = ref(pbInstance.value.authStore.token);
  const isAuthValid = ref(pbInstance.value.authStore.isValid);

  const initializeAuthState = () => {
    authRecord.value = pbInstance.value.authStore.model;
    authToken.value = pbInstance.value.authStore.token;
    isAuthValid.value = pbInstance.value.authStore.isValid;

    pbInstance.value.authStore.onChange((token, model) => {
      authRecord.value = model;
      authToken.value = token;
      isAuthValid.value = pbInstance.value.authStore.isValid;
    }, true);
  };

  initializeAuthState();

  return {
    pb: pbInstance,
    authRecord,
    authToken,
    isAuthValid,
  };
});

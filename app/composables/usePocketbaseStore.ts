import { defineStore } from 'pinia';
import { ref } from 'vue';
import PocketBase from 'pocketbase';

export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.public.pocketbaseUrl as string);
  
  // Create reactive refs for auth state
  const authRecord = ref(pb.authStore.model);
  const authToken = ref(pb.authStore.token);
  const isAuthValid = ref(pb.authStore.isValid);

  // Initialize the reactive refs and set up onChange listener
  const initializeAuthState = () => {
    // Set initial values
    authRecord.value = pb.authStore.model;
    authToken.value = pb.authStore.token;
    isAuthValid.value = pb.authStore.isValid;

    // Listen for auth state changes
    pb.authStore.onChange((token, model) => {
      authRecord.value = model;
      authToken.value = token;
      isAuthValid.value = pb.authStore.isValid;
    }, true); // Pass true to trigger the callback immediately with current state
  };

  // Initialize the auth state
  initializeAuthState();

  return {
    pb,
    authRecord,
    authToken,
    isAuthValid,
  };
});

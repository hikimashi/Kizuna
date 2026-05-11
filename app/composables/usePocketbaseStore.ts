import { defineStore } from 'pinia';
import { ref } from 'vue';
import PocketBase from 'pocketbase';

export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.public.pocketbaseUrl as string);
  
  // Crée des refs reactives pour l'etat d'authentification.
  const authRecord = ref(pb.authStore.model);
  const authToken = ref(pb.authStore.token);
  const isAuthValid = ref(pb.authStore.isValid);

  // Initialise les refs reactives et configure l'ecoute des changements.
  const initializeAuthState = () => {
    // Definit les valeurs initiales.
    authRecord.value = pb.authStore.model;
    authToken.value = pb.authStore.token;
    isAuthValid.value = pb.authStore.isValid;

    // Ecoute les changements d'etat auth.
    pb.authStore.onChange((token, model) => {
      authRecord.value = model;
      authToken.value = token;
      isAuthValid.value = pb.authStore.isValid;
    }, true); // Passe `true` pour declencher immediatement le callback avec l'etat courant.
  };

  // Initialise l'etat d'authentification.
  initializeAuthState();

  return {
    pb,
    authRecord,
    authToken,
    isAuthValid,
  };
});

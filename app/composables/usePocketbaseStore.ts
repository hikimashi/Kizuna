import { defineStore } from 'pinia';
import { ref } from 'vue';
import PocketBase from 'pocketbase';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  const config = useRuntimeConfig();
  // Instance PocketBase unique exposée par Pinia pour éviter plusieurs authStore concurrents.
  const pb = new PocketBase(config.public.pocketbaseUrl as string);
  
  // Crée des refs réactives pour l'état d'authentification.
  const authRecord = ref(pb.authStore.model);
  const authToken = ref(pb.authStore.token);
  const isAuthValid = ref(pb.authStore.isValid);

  // Initialise les refs réactives et configure l'écoute des changements.
  /**
   * Calcule la valeur « initialize auth state ».
   *
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const initializeAuthState = () => {
    // Definit les valeurs initiales.
    authRecord.value = pb.authStore.model;
    authToken.value = pb.authStore.token;
    isAuthValid.value = pb.authStore.isValid;

    // Écoute les changements d'état auth.
    pb.authStore.onChange((token, model) => {
      // Synchronise le store réactif avec le authStore interne de PocketBase.
      authRecord.value = model;
      authToken.value = token;
      isAuthValid.value = pb.authStore.isValid;
    }, true); // Passe `true` pour déclencher immédiatement le callback avec l'état courant.
  };

  // Initialise l'état d'authentification.
  initializeAuthState();

  return {
    pb,
    authRecord,
    authToken,
    isAuthValid,
  };
});

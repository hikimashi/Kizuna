/**
 * usePocketbaseStore.ts
 * Store Pinia pour la gestion du client PocketBase et de l'état d'authentification.
 * @see {@link https://pocketbase.io/docs PocketBase Docs}
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import PocketBase from 'pocketbase';

export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  // Configuration runtime (URL depuis nuxt.config.ts)
  const config = useRuntimeConfig();
  
  // Instance du client PocketBase
  const pb = new PocketBase(config.public.pocketbaseUrl as string);

  // État d'authentification réactif
  const authRecord = ref(pb.authStore.model);
  const authToken = ref(pb.authStore.token);
  const isAuthValid = ref(pb.authStore.isValid);

  /**
   * Initialise l'état d'authentification et écoute les changements
   * pb.authStore.onChange() est appelé automatiquement quand :
   * - L'utilisateur se connecte/déconnecte
   * - Le token est rafraîchi
   * @param true - Déclenche le callback immédiatement avec l'état actuel
   */
  const initializeAuthState = () => {
    authRecord.value = pb.authStore.model;
    authToken.value = pb.authStore.token;
    isAuthValid.value = pb.authStore.isValid;

    pb.authStore.onChange((token, model) => {
      authRecord.value = model;
      authToken.value = token;
      isAuthValid.value = pb.authStore.isValid;
    }, true);
  };

  initializeAuthState();

  return {
    pb,           // Client PocketBase pour les requêtes
    authRecord,   // Données utilisateur (réactif)
    authToken,    // Token JWT (réactif)
    isAuthValid,  // État de validité (réactif)
  };
});

/**
 * useAlertStore.ts
 * Store Pinia pour les alertes/modales de confirmation.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAlertStore = defineStore('useAlertStore', () => {
  const alert = ref<{ type: string; message: string } | null>(null);
  const onAcceptRef = ref<() => void>();
  const onDenyRef = ref<() => void>();

  /**
   * Ouvre une alerte et attend la réponse
   * @param type - Type d'alerte
   * @param message - Message à afficher
   * @returns Promise<boolean> - true si Accept, false si Deny
   */
  const openAlert = ({ type, message }: { type: string; message: string }): Promise<boolean> => {
    return new Promise(resolve => {
      alert.value = { type, message };

      onAcceptRef.value = () => {
        resolve(true);
        clearAlert();
      };
      onDenyRef.value = () => {
        resolve(false);
        clearAlert();
      };
    });
  };

  const clearAlert = () => {
    alert.value = null;
  };

  return {
    openAlert,
    alert,
    clearAlert,
    onAcceptRef,
    onDenyRef,
  };
});

/**
 * useToastStore.ts
 * Store Pinia pour les notifications toast.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useToastStore = defineStore('useToastStore', () => {
  const toasts = ref<{ id: number; type: string; message: string }[]>([]);

  /**
   * Affiche une notification toast
   * @param type - 'success' | 'error' | 'info' | 'warning'
   * @param message - Message à afficher
   */
  const openToast = ({ type, message }: { type: string; message: string }) => {
    const id = Date.now();
    toasts.value.push({ id, type, message });

    // Auto-dismiss après 3 secondes
    setTimeout(() => {
      toasts.value = toasts.value.filter(toast => toast.id !== id);
    }, 3000);
  };

  const getToasts = computed(() => toasts);

  return {
    openToast,
    toasts,
    getToasts,
  };
});

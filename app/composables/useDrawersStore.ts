/**
 * useDrawersStore.ts
 * Store Pinia pour la gestion des drawers (panneaux latéraux).
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDrawersStore = defineStore('drawersStore', () => {
  const currentDrawer = ref<string>('');
  const isOpen = ref<boolean>(false);

  /**
   * Ouvre un drawer
   * @param name - 'drawerLogin' | 'drawerCreateUser'
   */
  const openDrawer = (name: string) => {
    currentDrawer.value = name;
    isOpen.value = true;
  };

  /** Ferme le drawer en cours */
  const closeDrawer = () => {
    currentDrawer.value = '';
    isOpen.value = false;
  };

  return {
    currentDrawer,
    isOpen,
    openDrawer,
    closeDrawer,
  };
});

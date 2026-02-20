/**
 * useThemeStore.ts
 * Store Pinia pour la gestion du thème (forest/winter).
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from '~/composables/useUserStore';

export const useThemeStore = defineStore('useThemeStore', () => {
  const userStore = useUserStore();
  const activeTheme = ref('forest');

  /**
   * Initialise le thème au démarrage
   * Priorité : 1) userData 2) localStorage 3) défaut 'forest'
   */
  const setTheme = () => {
    if (userStore.userData) {
      activeTheme.value = userStore.userData.themeMode;
    } else {
      activeTheme.value = localStorage.getItem('theme') || 'forest';
    }
    localStorage.setItem('theme', activeTheme.value);
  };

  /** Bascule entre forest et winter */
  const changeTheme = () => {
    activeTheme.value = activeTheme.value === 'forest' ? 'winter' : 'forest';
  };

  return {
    activeTheme,
    setTheme,
    changeTheme,
  };
});

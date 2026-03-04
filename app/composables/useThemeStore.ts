import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from '~/composables/useUserStore';

type ThemeName = 'forest' | 'winter';

export const useThemeStore = defineStore('useThemeStore', () => {
  const userStore = useUserStore();
  const activeTheme = ref<ThemeName>('forest');

  const isValidTheme = (theme: unknown): theme is ThemeName => {
    return theme === 'forest' || theme === 'winter';
  };

  const applyTheme = (theme: ThemeName) => {
    activeTheme.value = theme;

    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  };

  const setTheme = () => {
    const userTheme = (userStore.userData as { themeMode?: string } | null)?.themeMode;
    const localTheme = import.meta.client ? localStorage.getItem('theme') : null;

    if (isValidTheme(userTheme)) {
      applyTheme(userTheme);
      return;
    }

    if (isValidTheme(localTheme)) {
      applyTheme(localTheme);
      return;
    }

    applyTheme('forest');
  };

  const changeTheme = () => {
    const nextTheme: ThemeName = activeTheme.value === 'forest' ? 'winter' : 'forest';
    applyTheme(nextTheme);
  };

  return {
    activeTheme,
    setTheme,
    changeTheme,
  };
});

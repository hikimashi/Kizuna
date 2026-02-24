import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from '~/composables/useUserStore';

export const useThemeStore = defineStore('useThemeStore', () => {
  const userStore = useUserStore();
  const activeTheme = ref('forest');

  const setTheme = () => {
    if (userStore.userData) {
      activeTheme.value = userStore.userData.themeMode;
    } else {
      activeTheme.value = localStorage.getItem('theme') || 'forest';
    }
    localStorage.setItem('theme', activeTheme.value);

  };

const changeTheme = () => {
  activeTheme.value =
    activeTheme.value === 'forest' ? 'winter' : 'forest';
};

  return {
    activeTheme,
    setTheme,
    changeTheme,
  };
});

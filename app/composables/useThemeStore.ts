import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from '~/composables/useUserStore';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


type ThemeName = 'forest' | 'winter';

export const useThemeStore = defineStore('useThemeStore', () => {
  const userStore = useUserStore();
  const activeTheme = ref<ThemeName>('forest');

  /**
   * Indique si valid theme.
   *
   * @param theme - Valeur utilisée par le traitement « is valid theme ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const isValidTheme = (theme: unknown): theme is ThemeName => {
    return theme === 'forest' || theme === 'winter';
  };

  /**
   * Applique theme.
   *
   * @param theme - Valeur utilisée par le traitement « apply theme ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif, lit ou écrit dans le stockage du navigateur, interagit avec le navigateur ou le DOM.
   */
  const applyTheme = (theme: ThemeName) => {
    activeTheme.value = theme;

    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  };

  /**
   * Définit theme.
   *
   * @returns Aucune valeur.
   * @sideEffects lit ou écrit dans le stockage du navigateur.
   */
  const setTheme = () => {
    const userTheme = (userStore.userData as { theme?: string; themeMode?: string } | null)?.theme
      || (userStore.userData as { theme?: string; themeMode?: string } | null)?.themeMode;
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

  /**
   * Calcule la valeur « change theme ».
   *
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const changeTheme = () => {
    const nextTheme: ThemeName = activeTheme.value === 'forest' ? 'winter' : 'forest';
    applyTheme(nextTheme);
  };

  /**
   * Définit theme by name.
   *
   * @param theme - Valeur utilisée par le traitement « set theme by name ».
   * @returns Aucune valeur.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const setThemeByName = (theme: ThemeName) => {
    applyTheme(theme);
  };

  return {
    activeTheme,
    setTheme,
    changeTheme,
    setThemeByName,
  };
});

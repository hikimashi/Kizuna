import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from '~/composables/useUserStore';

type ThemeName = 'forest' | 'winter';

// Ce store gere le theme visuel de l'application.
// Il choisit le theme au demarrage puis permet de le modifier.
export const useThemeStore = defineStore('useThemeStore', () => {
  // Donnees utilisateur locales, utiles pour retrouver le theme prefere.
  const userStore = useUserStore();
  const activeTheme = ref<ThemeName>('forest');

  // Verifie qu'une valeur correspond bien a un theme supporte par l'application.
  const isValidTheme = (theme: unknown): theme is ThemeName => {
    // On protege le code contre une valeur invalide venant du localStorage ou de la base.
    return theme === 'forest' || theme === 'winter';
  };

  // Applique le theme a l'etat local et au document HTML cote navigateur.
  const applyTheme = (theme: ThemeName) => {
    activeTheme.value = theme;

    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  };

  // Priorite : theme utilisateur en base, puis theme local, puis theme par defaut.
  const setTheme = () => {
    // Certains anciens enregistrements semblent utiliser themeMode plutot que theme.
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

  // Bascule entre les deux themes disponibles.
  const changeTheme = () => {
    const nextTheme: ThemeName = activeTheme.value === 'forest' ? 'winter' : 'forest';
    applyTheme(nextTheme);
  };

  // Force l'application d'un theme connu.
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

/*
Definition des termes techniques :
- theme : ensemble de couleurs et styles appliques a l'interface.
- type guard : fonction TypeScript qui confirme le type reel d'une valeur.
- localStorage : stockage persistant simple disponible dans le navigateur.
- document HTML : racine de la page manipulee par JavaScript dans le navigateur.
*/

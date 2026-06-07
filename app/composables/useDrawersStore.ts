import { defineStore } from 'pinia';
import { ref } from 'vue';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export type DrawerName = 'drawerLogin' | 'drawerCreateUser';

export const useDrawersStore = defineStore('drawersStore', () => {
  const currentDrawer = ref<DrawerName | ''>('');
  const isOpen = ref<boolean>(false);

  /**
   * Ouvre drawer.
   *
   * @param name - Valeur utilisée par le traitement « open drawer ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const openDrawer = (name: DrawerName) => {
    currentDrawer.value = name;
    isOpen.value = true;
  };

  /**
   * Ferme drawer.
   *
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
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
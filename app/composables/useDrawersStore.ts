import { defineStore } from 'pinia';
import { ref } from 'vue';

export type DrawerName = 'drawerLogin' | 'drawerCreateUser';

export const useDrawersStore = defineStore('drawersStore', () => {
  const currentDrawer = ref<DrawerName | ''>('');
  const isOpen = ref<boolean>(false);

  const openDrawer = (name: DrawerName) => {
    currentDrawer.value = name;
    isOpen.value = true;
  };

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
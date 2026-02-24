import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDrawersStore = defineStore('drawersStore', () => {
  const currentDrawer = ref<string>('');
  const isOpen = ref<boolean>(false);

  const openDrawer = (name: string) => {
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

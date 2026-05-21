import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ToastType, ToastTypeValue } from '#shared/types/ToastType';

export const useToastStore = defineStore('useToastStore', () => {
  const toasts = ref<ToastType[]>([]);
  const lastToastKey = ref('');
  const lastToastAt = ref(0);

  const openToast = ({ type, message }: { type: ToastTypeValue; message: string }) => {
    const key = `${type}:${message}`;
    const now = Date.now();

    // Évite les toasts dupliqués émis presque au même moment (ex. clic + middleware).
    if (lastToastKey.value === key && now - lastToastAt.value < 800) return;
    lastToastKey.value = key;
    lastToastAt.value = now;

    const id = Date.now();

    toasts.value.push({ id, type, message });

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

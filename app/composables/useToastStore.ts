import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('useToastStore', () => {
  const toasts = ref<{ id: number; type: string; message: string }[]>([]);
  const lastToastKey = ref('');
  const lastToastAt = ref(0);

  const openToast = ({ type, message }: { type: string; message: string }) => {
    const key = `${type}:${message}`;
    const now = Date.now();

    // Prevent duplicate toasts fired almost at the same time (e.g. click + middleware)
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

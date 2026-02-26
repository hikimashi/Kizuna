import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAlertStore = defineStore('useAlertStore', () => {
  const alert = ref<{ type: string; message: string } | null>(null);

  const onAcceptRef = ref<() => void>();
  const onDenyRef = ref<() => void>();
  const showDenyButton = ref(true);

  const openAlert = ({ type, message, showDeny = true }: { type: string; message: string; showDeny?: boolean }): Promise<boolean> => {
    return new Promise(resolve => {
      alert.value = { type, message };
      showDenyButton.value = showDeny;

      onAcceptRef.value = () => {
        resolve(true);
        clearAlert();
      };
      onDenyRef.value = () => {
        resolve(false);
        clearAlert();
      };
    });
  };

  const clearAlert = () => {
    alert.value = null;
  };

  return {
    openAlert,
    alert,
    clearAlert,
    onAcceptRef,
    onDenyRef,
    showDenyButton,
  };
});

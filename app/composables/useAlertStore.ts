import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AlertType, AlertTypeValue } from '#shared/types/AlertType';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export const useAlertStore = defineStore('useAlertStore', () => {
  const alert = ref<AlertType | null>(null);

  const onAcceptRef = ref<() => void>();
  const onDenyRef = ref<() => void>();
  const showDenyButton = ref(true);

  /**
   * Ouvre alert.
   *
   * @param options - Valeur utilisée par le traitement « open alert ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects modifie l'état réactif.
   */
  const openAlert = ({ type, message, showDeny = true }: { type: AlertTypeValue; message: string; showDeny?: boolean }): Promise<boolean> => {
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

  /**
   * Efface alert.
   *
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const clearAlert = () => {
    alert.value = null;
    onAcceptRef.value = undefined;
    onDenyRef.value = undefined;
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
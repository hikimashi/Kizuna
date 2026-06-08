<template>
  <div class="toast toast-top toast-end z-[220] mt-15 w-72 max-w-[calc(100vw-2rem)]">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="toastClass(toast.type)"
      class="alert border-2 bg-base-100/95 text-base-content font-semibold align-middle shadow-lg backdrop-blur-sm"
    >
      <component
        :is="toastIconMap[toast.type]"
        :class="toastColor(toast.type)"
        class="h-6 w-6 shrink-0"
      />
      <span class="text-sm leading-5">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '~/composables/useToastStore';
import type { ToastTypeValue } from '#shared/types/ToastType';
import { storeToRefs } from 'pinia';
import SuccessIcon from '~/components/icons/successIcon.vue';
import ErrorIcon from '~/components/icons/errorIcon.vue';
import InfoIcon from '~/components/icons/infoIcon.vue';
import WarningIcon from '~/components/icons/warningIcon.vue';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);
const toastClassMap: Record<ToastTypeValue, string> = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
};

const toastIconMap = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const toastColorMap: Record<ToastTypeValue, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
  warning: 'text-warning',
};

/**
 * Calcule la valeur « toast class ».
 *
 * @param type - Valeur utilisée par le traitement « toast class ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const toastClass = (type: ToastTypeValue) => toastClassMap[type];
/**
 * Calcule la valeur « toast color ».
 *
 * @param type - Valeur utilisée par le traitement « toast color ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const toastColor = (type: ToastTypeValue) => toastColorMap[type];
</script>

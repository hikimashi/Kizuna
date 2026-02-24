<template>
  <div class="toast toast-top toast-end w-56 mt-15 z-100">
    <div
      v-for="toast in toasts"
      :class="toastClass(toast.type)"
      class="alert bg-base-100 border-2 text-base-content font-semibold align-middle"
    >
      <component
        :is="toastIconMap[toast.type] ?? toastIconMap['info']"
        :class="toastColor(toast.type)"
        class="w-6 h-6"
      />
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Stores
 */

import { useToastStore } from '~/composables/useToastStore';
import { storeToRefs } from 'pinia';
import SuccessIcon from '~/components/icons/successIcon.vue';
import ErrorIcon from '~/components/icons/errorIcon.vue';
import InfoIcon from '~/components/icons/infoIcon.vue';
import WarningIcon from '~/components/icons/warningIcon.vue';

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);

/**
 * Props/Emits
 */

/**
 * References
 */

/**
 * Computed Properties
 */

/**
 * Methods
 */
const toastClassMap = {
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

const toastColorMap = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
  warning: 'text-warning',
};

const toastClass = (type: string) => toastClassMap[type] ?? 'alert-info';
const toastColor = (type: string) => toastColorMap[type] ?? 'text-info';

/**
 * Watchers
 */

/**
 * Mounted/Unmounted
 */
</script>
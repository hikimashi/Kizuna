<template>
  <div v-if="alert !== null" class="fixed p-4 top-0 w-screen h-screen backdrop-blur-xs z-60">
    <div :class="alertClassMap[alert.type]" class="flex flex-col lg:flex-row justify-between alert alert-outline bg-base-100 mt-20 z-50"
      role="alert">
      <div class="flex items-center gap-2">
        <component :is="alertIconMap[alert.type] ?? alertIconMap['info']" :class="alertColor(alert.type)"
          class="size-16" />

        <span class="font-semibold text-xs md:text-lg lg:text-xl px-4">{{ alert.message }}</span>
      </div>
      <!-- Buttons -->
      <div class="flex items-center" >
        <div class="flex gap-2">
          <button @click="alertStore.onDenyRef?.()" class="btn btn-outline btn-error rounded-md">
            Deny
          </button>
          <button @click="alertStore.onAcceptRef?.()" class="btn btn-outline btn-success rounded-md">
            Accept
          </button>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Stores
 */
import { storeToRefs } from 'pinia';
import { useAlertStore } from '~/composables/useAlertStore';
import SuccessIcon from '~/components/icons/successIcon.vue';
import ErrorIcon from '~/components/icons/errorIcon.vue';
import InfoIcon from '~/components/icons/infoIcon.vue';
import WarningIcon from '~/components/icons/warningIcon.vue';

const alertStore = useAlertStore();
const { alert } = storeToRefs(alertStore);
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

const alertClassMap = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
};

const alertIconMap = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const alertColorMap = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
  warning: 'text-warning',
};

const alertClass = (type: string) => alertClassMap[type] ?? 'alert-info';
const alertColor = (type: string) => alertColorMap[type] ?? 'text-info';

/**
 * Watchers
 */

/**
 * Mounted/Unmounted
 */
</script>
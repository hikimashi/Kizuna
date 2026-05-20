<template>
  <div v-if="alert !== null" class="fixed inset-0 z-[230] p-4 backdrop-blur-xs">
    <div :class="alertClassMap[alert.type]" class="relative z-[240] mt-20 flex flex-col justify-between alert alert-outline bg-base-100 lg:flex-row"
      role="alert">
      <div class="flex items-center gap-2">
        <component :is="alertIconMap[alert.type]" :class="alertColor(alert.type)"
          class="size-16" />

        <span class="font-semibold text-xs md:text-lg lg:text-xl px-4 whitespace-pre-line">{{ alert.message }}</span>
      </div>
      <!-- Boutons -->
      <div class="flex items-center" >
        <div class="flex gap-2">
          <button v-if="alertStore.showDenyButton" @click="alertStore.onDenyRef?.()" class="btn btn-outline btn-error rounded-md">
            Refuser
          </button>
          <button @click="alertStore.onAcceptRef?.()" class="btn btn-outline btn-success rounded-md">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAlertStore } from '~/composables/useAlertStore';
import type { AlertTypeValue } from '#shared/types/AlertType';
import SuccessIcon from '~/components/icons/successIcon.vue';
import ErrorIcon from '~/components/icons/errorIcon.vue';
import InfoIcon from '~/components/icons/infoIcon.vue';
import WarningIcon from '~/components/icons/warningIcon.vue';

const alertStore = useAlertStore();
const { alert } = storeToRefs(alertStore);

const alertClassMap: Record<AlertTypeValue, string> = {
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

const alertColorMap: Record<AlertTypeValue, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
  warning: 'text-warning',
};

const alertColor = (type: AlertTypeValue) => alertColorMap[type];
</script>

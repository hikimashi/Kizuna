<template>
  <component
    :is="activeDrawer"
    v-if="drawerStore.isOpen && activeDrawer"
    :open="drawerStore.isOpen"
    @close="drawerStore.closeDrawer"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDrawersStore } from '~/composables/useDrawersStore';
import drawerLogin from '@/components/drawers/drawerLogin.vue';
import drawerCreateUser from '@/components/drawers/drawerCreateUser.vue';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


const drawerStore = useDrawersStore();

const drawers = {
  drawerLogin,
  drawerCreateUser,
} as const;

const activeDrawer = computed(() => {
  if (!drawerStore.currentDrawer) return null;
  return drawers[drawerStore.currentDrawer];
});
</script>
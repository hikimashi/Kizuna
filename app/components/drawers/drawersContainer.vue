<template>
  <component
    :is="drawers[drawerStore.currentDrawer]"
    v-if="drawerStore.isOpen && drawers[drawerStore.currentDrawer]"
    :open="drawerStore.isOpen"
    @close="drawerStore.closeDrawer"
  />
</template>

<script setup lang="ts">
import { useDrawersStore } from '~/composables/useDrawersStore';
import drawerLogin from '@/components/drawers/drawerLogin.vue';
import drawerCreateUser from '@/components/drawers/drawerCreateUser.vue';

const drawerStore = useDrawersStore();

// Registre des drawers disponibles.
const drawers = {
  drawerLogin,
  drawerCreateUser,
};
</script>

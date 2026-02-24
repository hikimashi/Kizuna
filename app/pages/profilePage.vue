<template>
  <Profile />
</template>

<script setup lang="ts">
import Profile  from '@/components/profile.vue';
definePageMeta({
  middleware: ['auth'],
});
</script>
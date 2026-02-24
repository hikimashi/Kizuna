<template>
  <div class="w-full min-h-screen flex flex-col">
    <Header />
    <main class="flex-grow">
      <NuxtPage />
      <DrawersContainer />
      <Toast />
      <Alert />
    </main>
    <Footer class="mt-auto" />

  </div>

</template>

<script setup lang="ts">
import Header from './components/header.vue';
import Footer from './components/footer.vue';
import DrawersContainer from './components/drawers/drawersContainer.vue';
import Toast from './components/toast/toast.vue';
import Alert from './components/alerts/alert.vue';

</script>

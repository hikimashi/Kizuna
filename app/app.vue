<template>
  <div class="w-full min-h-screen flex flex-col">
    <NuxtLoadingIndicator color="#3db4f2" :height="3" :throttle="0" />
    <ClientOnly>
      <Header />
    </ClientOnly>
    <main class="flex-grow">
      <NuxtPage />
      <DrawersContainer />
      <Toast />
      <Alert />
    </main>
    <ScrollToTop />
    <Footer class="mt-auto" />

  </div>

</template>

<script setup lang="ts">
import Header from './components/header.vue';
import Footer from './components/footer.vue';
import DrawersContainer from './components/drawers/drawersContainer.vue';
import Toast from './components/toast/toast.vue';
import Alert from './components/alerts/alert.vue';
import ScrollToTop from './components/scrollToTop.vue';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────

</script>

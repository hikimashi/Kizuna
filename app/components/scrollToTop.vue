<template>
  <button
    v-if="showButton"
    type="button"
    @click="scrollToTop"
    class="fixed bottom-16 right-2.5 z-50 flex size-9 items-center justify-center rounded-md border border-[var(--kz-hover-border)] bg-[var(--kz-soft-accent-bg)] text-[var(--kz-text-primary)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--kz-soft-accent-bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--kz-accent)]"
    aria-label="Scroll to top"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-4"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
  </button>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


const showButton = ref(false);

/**
 * Traite scroll.
 *
 * @returns Aucune valeur.
 * @sideEffects modifie l'état réactif, interagit avec le navigateur ou le DOM.
 */
const handleScroll = () => {
  showButton.value = window.scrollY > 300;
};

/**
 * Fait défiler to top.
 *
 * @returns Aucune valeur.
 * @sideEffects interagit avec le navigateur ou le DOM.
 */
const scrollToTop = () => {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  window.scrollTo({
    top: 0,
    behavior,
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

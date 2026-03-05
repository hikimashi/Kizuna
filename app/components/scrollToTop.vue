<template>
  <div
    v-if="showButton"
    @click="scrollToTop"
    class="scroll-to-top-btn"
    aria-label="Scroll to top"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="scroll-to-top-icon"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const showButton = ref(false);

const handleScroll = () => {
  showButton.value = window.scrollY > 300;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
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

<style scoped>
.scroll-to-top-btn {
  position: fixed;
  bottom: 62px;
  right: 10px;
  z-index: 50;
  width: 36px;
  height: 36px;
  background: rgba(61, 180, 242, 0.10);
  border: 1px solid rgba(61, 180, 242, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.scroll-to-top-btn:hover {
  background: rgba(61, 180, 242, 0.25);
  transform: translateY(-2px);
}

.scroll-to-top-icon {
  width: 16px;
  height: 16px;
  color: rgba(232, 240, 255, 0.6);
}
</style>

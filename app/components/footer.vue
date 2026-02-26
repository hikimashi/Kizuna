<template>
  <footer
    class="footer footer-center p-6 bg-base-100 text-base-content rounded-t-lg"
    role="contentinfo"
  >
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between flex-wrap w-full max-w-4xl mx-auto"
    >
      <nav class="flex flex-wrap justify-center gap-6 mb-4 lg:mb-0" aria-label="footer-navigation">
        <h3 id="footer-navigation" class="sr-only">Navigation</h3>
        <NuxtLink
          to="/#hero"
          class="link link-hover hover:text-primary transition-colors duration-200"
          >Home</NuxtLink
        >
        <NuxtLink
          to="/#about"
          class="link link-hover hover:text-primary transition-colors duration-200"
          >About</NuxtLink
        >
        <NuxtLink
          to="/#skills"
          class="link link-hover hover:text-primary transition-colors duration-200"
          >My Stack</NuxtLink
        >
        <NuxtLink
          to="/#projects"
          class="link link-hover hover:text-primary transition-colors duration-200"
          >Projects</NuxtLink
        >
        <NuxtLink
          to="/#contact"
          class="link link-hover hover:text-primary transition-colors duration-200"
          >Contact</NuxtLink
        >
      </nav>

      <p class="text-sm">© {{ currentYear }} Kizuna</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = ref(new Date().getFullYear());
</script>

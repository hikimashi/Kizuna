<template>
  <div class="skeleton-grid">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton-card"
    >
      <div class="skeleton-cover"></div>
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
        <div class="skeleton-genres">
          <div class="skeleton-tag"></div>
          <div class="skeleton-tag"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 12
})
</script>

<style scoped>
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.skeleton-card {
  background: #131a26;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.skeleton-cover {
  aspect-ratio: 2/3;
  background: linear-gradient(
    90deg,
    rgba(61, 180, 242, 0.05) 25%,
    rgba(61, 180, 242, 0.15) 50%,
    rgba(61, 180, 242, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-info {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-title {
  height: 16px;
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(61, 180, 242, 0.05) 25%,
    rgba(61, 180, 242, 0.15) 50%,
    rgba(61, 180, 242, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-meta {
  height: 12px;
  width: 60%;
  background: linear-gradient(
    90deg,
    rgba(61, 180, 242, 0.05) 25%,
    rgba(61, 180, 242, 0.15) 50%,
    rgba(61, 180, 242, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-genres {
  display: flex;
  gap: 6px;
}

.skeleton-tag {
  height: 18px;
  width: 50px;
  background: linear-gradient(
    90deg,
    rgba(61, 180, 242, 0.05) 25%,
    rgba(61, 180, 242, 0.15) 50%,
    rgba(61, 180, 242, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Adaptation mobile */
@media (max-width: 768px) {
  .skeleton-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}
</style>

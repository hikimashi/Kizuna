<template>
  <div v-if="variant === 'anime-detail'" class="anime-skeleton" aria-hidden="true">
    <div class="banner banner-empty anime-skeleton-banner" />

    <div class="container">
      <div class="two-col-layout">
        <aside class="sidebar-left">
          <div class="cover anime-skeleton-block anime-skeleton-cover" />

          <div class="sidebar-section anime-skeleton-section">
            <div class="anime-skeleton-line anime-skeleton-line-title short" />
            <div class="anime-skeleton-line" />
            <div class="anime-skeleton-line" />
            <div class="anime-skeleton-line medium" />
          </div>
        </aside>

        <div>
          <div class="media-content anime-skeleton-section">
            <div class="anime-skeleton-line anime-skeleton-line-kicker short" />
            <div class="anime-skeleton-pill-row">
              <span class="anime-skeleton-pill" />
              <span class="anime-skeleton-pill" />
              <span class="anime-skeleton-pill long" />
            </div>
            <div class="anime-skeleton-line anime-skeleton-line-heading long" />
            <div class="anime-skeleton-chip-row">
              <span class="anime-skeleton-chip" />
              <span class="anime-skeleton-chip" />
              <span class="anime-skeleton-chip" />
            </div>
            <div class="anime-skeleton-paragraph">
              <div class="anime-skeleton-line" />
              <div class="anime-skeleton-line" />
              <div class="anime-skeleton-line medium" />
            </div>
            <div class="anime-skeleton-actions">
              <div class="anime-skeleton-button" />
              <div class="anime-skeleton-icon-button" />
            </div>
          </div>

          <div class="tabs">
            <div class="tabs-nav anime-skeleton-tabs">
              <span class="anime-skeleton-tab" />
              <span class="anime-skeleton-tab" />
              <span class="anime-skeleton-tab" />
              <span class="anime-skeleton-tab" />
            </div>
          </div>

          <div class="overview-stats-grid">
            <article v-for="n in 4" :key="`anime-skeleton-stat-${n}`" class="overview-stat-card anime-skeleton-section">
              <div class="anime-skeleton-line anime-skeleton-line-title short" />
              <div class="anime-skeleton-line anime-skeleton-line-stat short" />
              <div class="anime-skeleton-line medium" />
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="skeleton-grid">
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
  variant?: 'grid' | 'anime-detail'
}>(), {
  count: 12,
  variant: 'grid'
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

.skeleton-cover,
.skeleton-title,
.skeleton-meta,
.skeleton-tag,
.anime-skeleton-section,
.anime-skeleton-block {
  background: linear-gradient(
    90deg,
    rgba(61, 180, 242, 0.05) 25%,
    rgba(61, 180, 242, 0.15) 50%,
    rgba(61, 180, 242, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-cover {
  aspect-ratio: 2/3;
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
  border-radius: 4px;
}

.skeleton-meta {
  height: 12px;
  width: 60%;
  border-radius: 4px;
}

.skeleton-genres {
  display: flex;
  gap: 6px;
}

.skeleton-tag {
  height: 18px;
  width: 50px;
  border-radius: 4px;
}

.anime-skeleton-banner {
  min-height: calc(clamp(170px, 20vw, 260px) + var(--header-offset, 64px));
}

.anime-skeleton-section,
.anime-skeleton-block {
  background:
    linear-gradient(110deg, rgba(255, 255, 255, 0.03) 8%, rgba(255, 255, 255, 0.12) 18%, rgba(255, 255, 255, 0.03) 33%),
    rgba(20, 28, 39, 0.92);
  background-size: 220% 100%, auto;
  animation: animeDetailShimmer 1.4s ease-in-out infinite;
}

.anime-skeleton-cover {
  border-radius: 3px;
}

.anime-skeleton-line,
.anime-skeleton-pill,
.anime-skeleton-chip,
.anime-skeleton-button,
.anime-skeleton-icon-button,
.anime-skeleton-tab {
  display: block;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.anime-skeleton-line {
  height: 12px;
  width: 100%;
}

.anime-skeleton-line.short {
  width: 32%;
}

.anime-skeleton-line.medium {
  width: 64%;
}

.anime-skeleton-line.long {
  width: 82%;
}

.anime-skeleton-line-kicker {
  margin-bottom: 18px;
}

.anime-skeleton-line-heading {
  height: 32px;
  margin-bottom: 18px;
}

.anime-skeleton-line-stat {
  height: 30px;
  margin: 10px 0 14px;
}

.anime-skeleton-line-title {
  margin-bottom: 14px;
}

.anime-skeleton-paragraph,
.anime-skeleton-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.anime-skeleton-pill-row,
.anime-skeleton-chip-row,
.anime-skeleton-actions,
.anime-skeleton-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.anime-skeleton-pill {
  height: 28px;
  width: 120px;
}

.anime-skeleton-pill.long {
  width: 210px;
}

.anime-skeleton-chip {
  height: 24px;
  width: 88px;
}

.anime-skeleton-actions {
  margin-top: 10px;
}

.anime-skeleton-button {
  height: 42px;
  width: 190px;
  border-radius: 2px;
}

.anime-skeleton-icon-button {
  height: 42px;
  width: 42px;
  border-radius: 2px;
}

.anime-skeleton-tabs {
  padding: 0 8px;
}

.anime-skeleton-tab {
  width: 108px;
  height: 36px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes animeDetailShimmer {
  0% {
    background-position: 200% 0, 0 0;
  }
  100% {
    background-position: -20% 0, 0 0;
  }
}

@media (max-width: 768px) {
  .skeleton-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}
</style>

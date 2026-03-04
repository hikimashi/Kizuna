<template>
  <div class="animeList-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
          Browse Anime
        </h1>
        <p class="page-subtitle">Discover popular anime from AniList</p>
      </div>

      <!-- Filter Controls -->
      <div class="filter-controls">
        <div class="sort-dropdown">
          <label class="dropdown-label">Sort by</label>
          <select v-model="sortBy" class="dropdown-select">
            <option value="POPULARITY_DESC">Popularity</option>
            <option value="TRENDING_DESC">Trending</option>
            <option value="SCORE_DESC">Score</option>
            <option value="TITLE_ROMAJI">Title</option>
            <option value="START_DATE_DESC">Release Date</option>
          </select>
        </div>

        <div class="format-filter">
          <label class="filter-label">Format</label>
          <div class="format-buttons">
            <button
              :class="{ active: format === 'ALL' }"
              @click="format = 'ALL'"
              class="format-btn"
            >
              All
            </button>
            <button
              :class="{ active: format === 'TV' }"
              @click="format = 'TV'"
              class="format-btn"
            >
              TV
            </button>
            <button
              :class="{ active: format === 'MOVIE' }"
              @click="format = 'MOVIE'"
              class="format-btn"
            >
              Movies
            </button>
            <button
              :class="{ active: format === 'OVA' }"
              @click="format = 'OVA'"
              class="format-btn"
            >
              OVA
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Anime List with Infinite Scroll -->
    <AnimeList
      :sort-by="sortBy"
      :format="format"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AnimeList from '~/components/animeList.vue'

// Reactive state for filters
const sortBy = ref('POPULARITY_DESC')
const format = ref('ALL')

definePageMeta({
  middleware: [] // Optional: add auth middleware if needed
})
</script>

<style scoped>
.anime-list-page {
  min-height: 100vh;
  background: #0a0e1a;
  padding: 24px;
}

/* Page Header */
.page-header {
  max-width: 1400px;
  margin: 0 auto 32px;
}

.header-content {
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: rgba(232, 240, 255, 0.95);
  margin: 0 0 8px;
}

.title-icon {
  width: 32px;
  height: 32px;
  color: #3db4f2;
}

.page-subtitle {
  font-size: 15px;
  color: rgba(139, 168, 196, 0.8);
  margin: 0;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 20px;
  background: #131a26;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* Sort Dropdown */
.sort-dropdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dropdown-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(139, 168, 196, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-select {
  padding: 10px 16px;
  background: rgba(61, 180, 242, 0.12);
  border: 1px solid rgba(61, 180, 242, 0.3);
  border-radius: 8px;
  color: rgba(232, 240, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;
}

.dropdown-select:hover {
  background: rgba(61, 180, 242, 0.18);
  border-color: rgba(61, 180, 242, 0.5);
}

.dropdown-select:focus {
  outline: none;
  border-color: #3db4f2;
  box-shadow: 0 0 0 3px rgba(61, 180, 242, 0.15);
}

/* Format Filter */
.format-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(139, 168, 196, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.format-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.format-btn {
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(139, 168, 196, 0.8);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.format-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.format-btn.active {
  background: rgba(61, 180, 242, 0.15);
  border-color: rgba(61, 180, 242, 0.4);
  color: rgba(61, 180, 242, 0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .anime-list-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .title-icon {
    width: 24px;
    height: 24px;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .format-buttons {
    justify-content: flex-start;
  }
}
</style>

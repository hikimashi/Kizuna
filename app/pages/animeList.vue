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

// Etat reactif des filtres de la page
const sortBy = ref('POPULARITY_DESC')
const format = ref('ALL')
</script>

<style scoped src="~/assets/css/pages/animeList.css"></style>

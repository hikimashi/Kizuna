<template>
  <div class="infinite-scroll-container">
    <!-- Loading State (Initial) -->
    <div v-if="loading && items.length === 0" class="initial-loading">
      <SkeletonLoader :count="12" />
    </div>

    <!-- Items Grid -->
    <div v-else class="anime-grid">
      <div
        v-for="anime in items"
        :key="anime.id"
        class="anime-card"
      >
        <div class="anime-cover">
          <img :src="anime.coverImage.large" :alt="anime.title.romaji" />
          <div class="anime-score">
            {{ anime.averageScore || 'N/A' }}
          </div>
        </div>
        <div class="anime-info">
          <h3 class="anime-title">{{ anime.title.romaji || anime.title.english }}</h3>
          <p class="anime-meta">
            <span>{{ anime.format }}</span>
            <span v-if="anime.episodes">• {{ anime.episodes }} eps</span>
            <span v-if="anime.seasonYear">• {{ anime.seasonYear }}</span>
          </p>
          <div class="anime-genres">
            <span
              v-for="genre in anime.genres.slice(0, 3)"
              :key="genre"
              class="genre-tag"
            >
              {{ genre }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading More Indicator -->
    <div v-if="loading && items.length > 0" class="loading-more">
      <div class="spinner-ring"></div>
      <p>Loading more...</p>
    </div>

    <!-- End of List Message -->
    <div v-if="!hasMore && items.length > 0" class="end-of-list">
      <p>🎉 You've reached the end!</p>
    </div>

    <!-- Sentinel Element for IntersectionObserver -->
    <div ref="sentinelRef" class="sentinel-element"></div>

    <!-- Manual Load More Button (optional fallback) -->
    <div v-if="!hasMore && items.length > 0" class="load-more-container">
      <button @click="loadMore" :disabled="loading" class="btn-load-more">
        <span v-if="!loading">Load More</span>
        <span v-else>Loading...</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'

// Props de filtrage recues depuis la page.
const props = defineProps<{
  sortBy?: string
  format?: string
}>()

// Tri et format actifs avec valeurs par defaut.
const currentSort = computed(() => props.sortBy || 'POPULARITY_DESC')
const currentFormat = computed(() => props.format || 'ALL')
const anilistGraphql = useAnilistGraphql()

// Requete AniList GraphQL.
const fetchAnimeList = async (page: number, perPage: number) => {
  const sort = currentSort.value
  const formatFilter = currentFormat.value

  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $format: MediaFormat) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort, format: $format) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          averageScore
          format
          episodes
          seasonYear
          genres
          description
        }
      }
    }
  `

  const variables: Record<string, any> = { page, perPage, sort }
  if (formatFilter !== 'ALL') {
    variables.format = formatFilter
  }

  const data = await anilistGraphql.request<any>(
    query,
    variables,
    { cacheTtlMs: 60_000 }
  )

  if (data?.errors?.length) {
    throw new Error(data.errors[0]?.message || 'Failed to fetch anime list')
  }

  return data.data.Page.media
}

// Gestion du chargement progressif (infinite scroll).
const {
  items,
  loading,
  hasMore,
  sentinelRef,
  loadMore,
  reset
} = useInfiniteScroll(fetchAnimeList, {
  threshold: 300,
  initialPage: 1,
  perPage: 20,
  immediate: true
})

// Reinitialise la liste quand les filtres changent.
watch([currentSort, currentFormat], () => {
  reset()
})
</script>

<style scoped>
.infinite-scroll-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Initial Loading */
.initial-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-spinner,
.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(232, 240, 255, 0.8);
}

.loading-more {
  padding: 32px;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(61, 180, 242, 0.12);
  border-top-color: #3db4f2;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Anime Grid */
.anime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

/* Anime Card */
.anime-card {
  background: #131a26;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.anime-card:hover {
  transform: translateY(-4px);
  border-color: rgba(61, 180, 242, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Anime Cover */
.anime-cover {
  position: relative;
  aspect-ratio: 2/3;
  overflow: hidden;
}

.anime-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.anime-card:hover .anime-cover img {
  transform: scale(1.05);
}

.anime-score {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(61, 180, 242, 0.9);
  color: #0a0e1a;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

/* Anime Info */
.anime-info {
  padding: 14px;
}

.anime-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(232, 240, 255, 0.95);
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 40px;
}

.anime-meta {
  font-size: 12px;
  color: rgba(139, 168, 196, 0.8);
  margin: 0 0 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Genre Tags */
.anime-genres {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.genre-tag {
  background: rgba(61, 180, 242, 0.12);
  color: rgba(61, 180, 242, 0.9);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* End of List */
.end-of-list {
  text-align: center;
  padding: 40px 20px;
  color: rgba(139, 168, 196, 0.7);
  font-size: 15px;
}

/* Load More Button */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.btn-load-more {
  padding: 12px 32px;
  background: rgba(61, 180, 242, 0.12);
  border: 1px solid rgba(61, 180, 242, 0.3);
  border-radius: 8px;
  color: rgba(61, 180, 242, 0.9);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  background: rgba(61, 180, 242, 0.2);
  transform: translateY(-2px);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sentinel Element */
.sentinel-element {
  height: 1px;
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .anime-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .anime-title {
    font-size: 13px;
    min-height: 36px;
  }

  .anime-info {
    padding: 10px;
  }
}
</style>

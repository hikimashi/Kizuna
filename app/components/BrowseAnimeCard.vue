<script setup lang="ts">
type CardAnime = {
  id?: number | null
  title?: { romaji?: string | null; english?: string | null } | null
  coverImage?: { medium?: string | null; large?: string | null } | null
  averageScore?: number | null
  format?: string | null
  episodes?: number | null
  seasonYear?: number | null
  genres?: string[] | null
}

const props = withDefaults(defineProps<{
  anime: CardAnime
  to?: string
}>(), {
  to: ''
})

const animeTitle = (anime: CardAnime) =>
  anime.title?.romaji || anime.title?.english || 'Titre inconnu'

const formatLabel = (format?: string | null) => {
  if (!format) return 'Anime'
  if (format === 'TV_SHORT') return 'TV court'
  return format.replaceAll('_', ' ')
}

const formatScore = (score?: number | null) => {
  if (!score) return 'N/D'
  return score % 1 === 0 ? String(score) : score.toFixed(1)
}

const episodesLabel = (episodes?: number | null) => {
  if (!episodes) return 'Episodes inconnus'
  return `${episodes} eps`
}

const coverSrc = (anime: CardAnime) =>
  anime.coverImage?.large || anime.coverImage?.medium || ''

const cardSubmeta = (anime: CardAnime) => {
  const parts = [
    anime.genres?.[0],
    anime.seasonYear ? String(anime.seasonYear) : '',
    formatLabel(anime.format)
  ].filter(Boolean)
  return parts.join(' / ')
}
</script>

<template>
  <NuxtLink :to="to || `/anime/${anime.id}`" class="anime-card anime-card-link">
    <div class="card-media">
      <img
        v-if="coverSrc(anime)"
        :src="coverSrc(anime)"
        :alt="animeTitle(anime)"
        class="card-cover"
      >
      <div v-else class="card-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </div>

      <span class="card-format">{{ formatLabel(anime.format) }}</span>

      <div class="card-overlay">
        <div class="card-title">{{ animeTitle(anime) }}</div>
        <div class="card-meta">
          <span class="card-score">{{ formatScore(anime.averageScore) }}</span>
          <span class="card-eps">{{ episodesLabel(anime.episodes) }}</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template> 

<style scoped>
.anime-card-link {
  --results-surface: var(--kz-card-bg);
  --results-border: var(--kz-border);
  --results-accent: var(--kz-accent);
  --results-text-dim: var(--kz-text-dim);
  --results-text-secondary: var(--kz-text-secondary);
  --results-text: var(--kz-text-primary);
  display: block;
  border: 1px solid var(--results-border);
  border-radius: 2.5px;
  overflow: hidden;
  background: color-mix(in srgb, var(--results-surface) 92%, #0d1a27 8%);
  text-decoration: none;
  transition: border-color 0.16s, background 0.16s, box-shadow 0.16s;
}

.anime-card-link:hover {
  border-color: rgba(61, 180, 242, 0.18);
  background: color-mix(in srgb, var(--results-surface) 89%, #173049 11%);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

.card-media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2 / 3;
}

.card-cover,
.card-placeholder {
  width: 100%;
  height: 100%;
  display: block;
}

.card-cover {
  object-fit: cover;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, #172436 0%, #0d1a27 100%);
}

.card-format {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  padding: 2px 6px;
  border-radius: 2.5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(11, 22, 34, 0.92);
  color: #9fadbd;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.card-overlay {
  position: absolute;
  inset: auto 0 0 0;
  min-height: 66px;
  padding: 9px 9px 8px;
  background: rgba(0, 0, 0, 0.74);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  color: #e8f0ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-score {
  color: var(--results-accent);
  font-family: 'Overpass Mono', monospace;
  font-size: 9px;
  font-weight: 700;
}

.card-eps {
  color: var(--results-text-dim);
  font-size: 9px;
  font-weight: 600;
}

.card-body {
  padding: 10px 11px 12px;
}

.body-title {
  color: var(--results-text);
  text-shadow: none;
  margin: 0 0 4px;
}

.card-submeta {
  color: var(--results-text-secondary);
  font-size: 11px;
  line-height: 1.4;
}
</style>

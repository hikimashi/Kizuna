<template>
  <div class="browse-page" @keydown.esc="closeDropdown">
    <section class="browse-shell">
      <div class="filters-bar">
        <label class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model.trim="searchInput" type="text" placeholder="Search anime..." />
        </label>

        <div class="filter-group" :class="{ open: openDropdown === 'genre' }">
          <button
            class="filter-pill"
            :class="{ 'has-value': selectedGenres.length > 0 }"
            type="button"
            :aria-expanded="openDropdown === 'genre'"
            @click.stop="toggleDropdown('genre')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            <span>{{ genrePillLabel }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
              <path stroke-linecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div class="dropdown genre-dropdown" @click.stop>
            <div class="dropdown-title">Genres</div>
            <div class="genre-chips">
              <button
                v-for="genreOption in genreOptions"
                :key="genreOption"
                class="genre-chip"
                :class="{ selected: selectedGenres.includes(genreOption) }"
                :style="genreChipStyle(genreOption)"
                type="button"
                @click.stop="toggleGenre(genreOption)"
              >
                {{ genreOption }}
              </button>
            </div>
          </div>
        </div>

        <div class="filter-group" :class="{ open: openDropdown === 'year' }">
          <button
            class="filter-pill"
            :class="{ 'has-value': Boolean(year) }"
            type="button"
            :aria-expanded="openDropdown === 'year'"
            @click.stop="toggleDropdown('year')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{{ yearPillLabel }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
              <path stroke-linecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div class="dropdown" @click.stop>
            <button
              v-for="yearOption in yearOptions"
              :key="yearOption.value"
              class="dropdown-item"
              :class="{ selected: year === yearOption.value }"
              type="button"
              @click.stop="setYear(yearOption.value)"
            >
              {{ yearOption.label }}
            </button>
          </div>
        </div>

        <div class="filter-group" :class="{ open: openDropdown === 'season' }">
          <button
            class="filter-pill"
            :class="{ 'has-value': Boolean(season) }"
            type="button"
            :aria-expanded="openDropdown === 'season'"
            @click.stop="toggleDropdown('season')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773-1.591-1.591M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" />
            </svg>
            <span>{{ seasonPillLabel }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
              <path stroke-linecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div class="dropdown" @click.stop>
            <button
              v-for="seasonOption in seasonOptions"
              :key="seasonOption.value"
              class="dropdown-item"
              :class="{ selected: season === seasonOption.value }"
              type="button"
              @click.stop="setSeason(seasonOption.value)"
            >
              {{ seasonOption.label }}
            </button>
          </div>
        </div>

        <div class="filter-group" :class="{ open: openDropdown === 'format' }">
          <button
            class="filter-pill"
            :class="{ 'has-value': format !== 'ALL' }"
            type="button"
            :aria-expanded="openDropdown === 'format'"
            @click.stop="toggleDropdown('format')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-1.5-3.75" />
            </svg>
            <span>{{ formatPillLabel }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
              <path stroke-linecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div class="dropdown" @click.stop>
            <button
              v-for="formatOption in formatOptions"
              :key="formatOption.value"
              class="dropdown-item"
              :class="{ selected: format === formatOption.value }"
              type="button"
              @click.stop="setFormat(formatOption.value)"
            >
              {{ formatOption.label }}
            </button>
          </div>
        </div>

        <div class="filter-group" :class="{ open: openDropdown === 'status' }">
          <button
            class="filter-pill"
            :class="{ 'has-value': Boolean(status) }"
            type="button"
            :aria-expanded="openDropdown === 'status'"
            @click.stop="toggleDropdown('status')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path stroke-linecap="round" d="M12 6v6l4 2" />
            </svg>
            <span>{{ statusPillLabel }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
              <path stroke-linecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div class="dropdown" @click.stop>
            <button
              v-for="statusOption in statusOptions"
              :key="statusOption.value"
              class="dropdown-item"
              :class="{ selected: status === statusOption.value }"
              type="button"
              @click.stop="setStatus(statusOption.value)"
            >
              {{ statusOption.label }}
            </button>
          </div>
        </div>

        <div class="filter-spacer"></div>

        <label class="sort-field">
          <span class="sort-label">Sort</span>
          <select v-model="sortBy" class="sort-select">
            <option v-for="sortOption in sortOptions" :key="sortOption.value" :value="sortOption.value">
              {{ sortOption.label }}
            </option>
          </select>
        </label>

        <div class="view-btns">
          <button class="vbtn" :class="{ active: viewMode === 'grid' }" type="button" title="Grid" @click="viewMode = 'grid'">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
              <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
            </svg>
          </button>
          <button class="vbtn" :class="{ active: viewMode === 'list' }" type="button" title="List" @click="viewMode = 'list'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
              <path d="M9 6h13M9 12h13M9 18h13M4 6h.01M4 12h.01M4 18h.01" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="activeFilters.length > 0" class="active-filters">
        <button
          v-for="filterItem in activeFilters"
          :key="filterItem.key"
          class="active-tag"
          type="button"
          @click="removeFilter(filterItem)"
        >
          <span>{{ filterItem.label }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10" aria-hidden="true">
            <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <button class="clear-filters-btn" type="button" @click="clearAllFilters">
          Clear all
        </button>
      </div>
    </section>

    <AnimeList
      :sort-by="sortBy"
      :format="format"
      :search="searchTerm"
      :genres="selectedGenres"
      :season="season"
      :year="year"
      :status="status"
      :view-mode="viewMode"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AnimeList from '~/components/animeList.vue'

type DropdownKey = 'genre' | 'year' | 'season' | 'format' | 'status' | null
type ViewMode = 'grid' | 'list'
type FilterOption = {
  value: string
  label: string
}

const currentYear = new Date().getFullYear()

const sortOptions: FilterOption[] = [
  { value: 'POPULARITY_DESC', label: 'Popularity' },
  { value: 'SCORE_DESC', label: 'Score' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'TITLE_ROMAJI', label: 'Title A-Z' }
]

const formatOptions: FilterOption[] = [
  { value: 'ALL', label: 'All formats' },
  { value: 'TV', label: 'TV' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' }
]

const seasonOptions: FilterOption[] = [
  { value: '', label: 'All seasons' },
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' }
]

const statusOptions: FilterOption[] = [
  { value: '', label: 'Any status' },
  { value: 'RELEASING', label: 'Airing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Not Yet Released' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

const yearOptions = computed<FilterOption[]>(() => [
  { value: '', label: 'Any year' },
  ...Array.from({ length: 4 }, (_, index) => ({
    value: String(currentYear - index),
    label: String(currentYear - index)
  })),
  { value: '2020s', label: '2020s' },
  { value: '2010s', label: '2010s' },
  { value: '2000s', label: '2000s' },
  { value: 'older', label: 'Older' }
])

const genreOptions = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Mystery',
  'Psychological',
  'Supernatural',
  'Slice of Life',
  'Sports',
  'Thriller',
  'Mecha',
  'Music'
]

const genreStyleMap: Record<string, { background: string; color?: string }> = {
  Action: { background: '#f77f00' },
  Adventure: { background: '#4cc9f0', color: '#0b1622' },
  Comedy: { background: '#68d639', color: '#0b1622' },
  Drama: { background: '#02a9ff', color: '#0b1622' },
  Fantasy: { background: '#9256f3' },
  Horror: { background: '#d62828' },
  Romance: { background: '#f779a4', color: '#0b1622' },
  'Sci-Fi': { background: '#4361ee' },
  'Slice of Life': { background: '#a8dadc', color: '#0b1622' },
  Sports: { background: '#06d6a0', color: '#0b1622' },
  Mystery: { background: '#7b2d8b' },
  Supernatural: { background: '#6a0572' },
  Psychological: { background: '#9b2335' },
  Thriller: { background: '#e85d75' },
  Mecha: { background: '#6c8ebf' },
  Music: { background: '#ffbe0b', color: '#0b1622' }
}

const sortBy = ref('POPULARITY_DESC')
const format = ref('ALL')
const season = ref('')
const status = ref('')
const year = ref('')
const viewMode = ref<ViewMode>('grid')
const selectedGenres = ref<string[]>([])
const searchInput = ref('')
const searchTerm = ref('')
const openDropdown = ref<DropdownKey>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const currentFormatLabel = computed(() => formatOptions.find((option) => option.value === format.value)?.label || 'Format')
const currentSeasonLabel = computed(() => seasonOptions.find((option) => option.value === season.value)?.label || 'Season')
const currentStatusLabel = computed(() => statusOptions.find((option) => option.value === status.value)?.label || 'Status')

const genrePillLabel = computed(() => {
  if (selectedGenres.value.length === 0) return 'Genres'
  const [firstGenre, ...remainingGenres] = selectedGenres.value
  return remainingGenres.length > 0 ? `Genres: ${firstGenre} +${remainingGenres.length}` : `Genres: ${firstGenre}`
})

const yearPillLabel = computed(() => year.value ? `Year: ${year.value}` : 'Year')
const seasonPillLabel = computed(() => season.value ? `Season: ${currentSeasonLabel.value}` : 'Season')
const formatPillLabel = computed(() => format.value !== 'ALL' ? `Format: ${currentFormatLabel.value}` : 'Format')
const statusPillLabel = computed(() => status.value ? `Status: ${currentStatusLabel.value}` : 'Status')

type ActiveFilter = {
  key: string
  type: 'search' | 'genre' | 'year' | 'season' | 'format' | 'status'
  value: string
  label: string
}

const activeFilters = computed<ActiveFilter[]>(() => {
  const nextFilters: ActiveFilter[] = []

  if (searchTerm.value) {
    nextFilters.push({
      key: `search:${searchTerm.value}`,
      type: 'search',
      value: searchTerm.value,
      label: `Search: ${searchTerm.value}`
    })
  }

  selectedGenres.value.forEach((genre) => {
    nextFilters.push({
      key: `genre:${genre}`,
      type: 'genre',
      value: genre,
      label: genre
    })
  })

  if (year.value) {
    nextFilters.push({
      key: `year:${year.value}`,
      type: 'year',
      value: year.value,
      label: `Year: ${year.value}`
    })
  }

  if (season.value) {
    nextFilters.push({
      key: `season:${season.value}`,
      type: 'season',
      value: season.value,
      label: `Season: ${currentSeasonLabel.value}`
    })
  }

  if (format.value !== 'ALL') {
    nextFilters.push({
      key: `format:${format.value}`,
      type: 'format',
      value: format.value,
      label: `Format: ${currentFormatLabel.value}`
    })
  }

  if (status.value) {
    nextFilters.push({
      key: `status:${status.value}`,
      type: 'status',
      value: status.value,
      label: `Status: ${currentStatusLabel.value}`
    })
  }

  return nextFilters
})

const closeDropdown = () => {
  openDropdown.value = null
}

const toggleDropdown = (dropdownKey: Exclude<DropdownKey, null>) => {
  openDropdown.value = openDropdown.value === dropdownKey ? null : dropdownKey
}

const setYear = (value: string) => {
  year.value = value
  closeDropdown()
}

const setSeason = (value: string) => {
  season.value = value
  closeDropdown()
}

const setFormat = (value: string) => {
  format.value = value
  closeDropdown()
}

const setStatus = (value: string) => {
  status.value = value
  closeDropdown()
}

const toggleGenre = (genreValue: string) => {
  selectedGenres.value = selectedGenres.value.includes(genreValue)
    ? selectedGenres.value.filter((entry) => entry !== genreValue)
    : [...selectedGenres.value, genreValue]
}

const removeFilter = (filterItem: ActiveFilter) => {
  if (filterItem.type === 'search') {
    searchInput.value = ''
    searchTerm.value = ''
    return
  }

  if (filterItem.type === 'genre') {
    selectedGenres.value = selectedGenres.value.filter((genreValue) => genreValue !== filterItem.value)
    return
  }

  if (filterItem.type === 'year') {
    year.value = ''
    return
  }

  if (filterItem.type === 'season') {
    season.value = ''
    return
  }

  if (filterItem.type === 'format') {
    format.value = 'ALL'
    return
  }

  status.value = ''
}

const clearAllFilters = () => {
  searchInput.value = ''
  searchTerm.value = ''
  selectedGenres.value = []
  year.value = ''
  season.value = ''
  format.value = 'ALL'
  status.value = ''
  closeDropdown()
}

const genreChipStyle = (genreValue: string) => {
  const genreStyle = genreStyleMap[genreValue]
  if (!selectedGenres.value.includes(genreValue) || !genreStyle) return {}

  return {
    background: genreStyle.background,
    color: genreStyle.color || '#ffffff',
    borderColor: 'transparent'
  }
}

const handleDocumentClick = () => {
  closeDropdown()
}

watch(searchInput, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchTerm.value = value.trim()
  }, 250)
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped src="~/assets/css/pages/browse.css"></style>

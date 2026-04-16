<template>
  <div class="favorites-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="page">
      <div class="favorites-toolbar">
        <button
          class="favorites-tab"
          :class="{ active: activeTab === 'anime' }"
          type="button"
          @click="activeTab = 'anime'"
        >
          Anime
          <span class="favorites-count">{{ animeItems.length }}</span>
        </button>
        <button
          class="favorites-tab"
          :class="{ active: activeTab === 'characters' }"
          type="button"
          @click="activeTab = 'characters'"
        >
          Characters
          <span class="favorites-count">{{ characterItems.length }}</span>
        </button>
      </div>

      <div v-if="initialLoading" class="favorites-empty">
        <div class="spinner"></div>
        Loading favorites...
      </div>

      <div v-else-if="errorMessage" class="favorites-empty error">
        {{ errorMessage }}
      </div>

      <div v-else-if="activeItems.length === 0" class="favorites-empty">
        No favorites found for this tab.
      </div>

      <div v-else class="favorites-grid">
        <article v-for="item in activeItems" :key="item.id" class="favorite-card">
          <a
            :href="item.siteUrl || '#'"
            class="favorite-link"
            :class="{ disabled: !item.siteUrl }"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="openItem(item.siteUrl)"
          >
            <div class="favorite-cover-wrap">
              <img
                v-if="item.image"
                :src="item.image"
                :srcset="item.imageSrcSet"
                :alt="item.title"
                class="favorite-cover"
                loading="lazy"
                decoding="async"
              >
              <div v-else class="favorite-cover placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </div>
            </div>
            <div class="favorite-meta">
              <div class="favorite-title">{{ item.title }}</div>
              <div class="favorite-subtitle">{{ item.subtitle }}</div>
            </div>
          </a>
        </article>
      </div>

      <div ref="sentinelRef" class="load-sentinel">
        <div v-if="loadingMore" class="spinner small"></div>
        <span v-else-if="!activeHasNext && activeItems.length">No more results</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { getAnilistCoverSrc, getAnilistCoverSrcSet, type AnilistCoverImage } from '~/composables/useAnilistCoverImage'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

definePageMeta({ middleware: ['auth'] })

type FavoriteTab = 'anime' | 'characters'

type FavoriteCard = {
  id: number
  title: string
  subtitle: string
  image: string
  imageSrcSet?: string
  siteUrl: string
}

const favoriteAnimePageQuery = `
query ($userId: Int, $userName: String, $page: Int, $perPage: Int) {
  User(id: $userId, name: $userName) {
    favourites {
      anime(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        nodes {
          id
          title { romaji english native }
          coverImage { medium large extraLarge }
          seasonYear
          format
          meanScore
          siteUrl
        }
      }
    }
  }
}
`

const viewerFavoriteAnimePageQuery = `
query ($page: Int, $perPage: Int) {
  Viewer {
    favourites {
      anime(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        nodes {
          id
          title { romaji english native }
          coverImage { medium large extraLarge }
          seasonYear
          format
          meanScore
          siteUrl
        }
      }
    }
  }
}
`

const favoriteCharacterPageQuery = `
query ($userId: Int, $userName: String, $page: Int, $perPage: Int) {
  User(id: $userId, name: $userName) {
    favourites {
      characters(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        nodes {
          id
          name { full userPreferred native }
          image { medium large }
          favourites
          siteUrl
        }
      }
    }
  }
}
`

const viewerFavoriteCharacterPageQuery = `
query ($page: Int, $perPage: Int) {
  Viewer {
    favourites {
      characters(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        nodes {
          id
          name { full userPreferred native }
          image { medium large }
          favourites
          siteUrl
        }
      }
    }
  }
}
`

const pocketbaseStore = usePocketbaseStore()
const anilistGraphql = useAnilistGraphql()
const activeTab = ref<FavoriteTab>('anime')
const initialLoading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const animeItems = ref<FavoriteCard[]>([])
const characterItems = ref<FavoriteCard[]>([])
const animePage = ref(1)
const characterPage = ref(1)
const animeHasNext = ref(true)
const characterHasNext = ref(true)
const animeLoaded = ref(false)
const characterLoaded = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))
const anilistUserId = computed(() => Number(authRecord.value.anilist_user_id ?? 0))
const anilistUsername = computed(() => String(authRecord.value.anilist_username ?? ''))

const profileTabs = [
  { key: 'anime-list', label: 'Anime List', to: '/animeList' },
  { key: 'favorites', label: 'Favorites', to: '/favorites', active: true },
  { key: 'friends', label: 'Friends', to: '/friends' },
  { key: 'shared-lists', label: 'Shared Lists', to: '/sharedLists' }
]

const activeItems = computed(() => activeTab.value === 'anime' ? animeItems.value : characterItems.value)
const activeHasNext = computed(() => activeTab.value === 'anime' ? animeHasNext.value : characterHasNext.value)

const normalizeAnime = (node: any): FavoriteCard => {
  const title = node?.title?.romaji || node?.title?.english || node?.title?.native || 'Unknown title'
  const format = node?.format ? String(node.format).replaceAll('_', ' ') : 'ANIME'
  const year = node?.seasonYear ? String(node.seasonYear) : ''
  const score = node?.meanScore ? `${Number(node.meanScore)}%` : 'No score'
  const subtitle = [format, year, score].filter(Boolean).join(' - ')

  return {
    id: Number(node?.id ?? 0),
    title,
    subtitle,
    image: getAnilistCoverSrc(node?.coverImage as AnilistCoverImage | null, 'card'),
    imageSrcSet: getAnilistCoverSrcSet(node?.coverImage as AnilistCoverImage | null, 'card'),
    siteUrl: String(node?.siteUrl || '')
  }
}

const normalizeCharacter = (node: any): FavoriteCard => {
  const title = node?.name?.userPreferred || node?.name?.full || node?.name?.native || 'Unknown character'
  const favCount = Number(node?.favourites ?? 0)

  return {
    id: Number(node?.id ?? 0),
    title,
    subtitle: favCount ? `${favCount.toLocaleString('en-US')} favorites` : 'Character',
    image: String(node?.image?.large || node?.image?.medium || ''),
    siteUrl: String(node?.siteUrl || '')
  }
}

const loadNextPage = async () => {
  if (loadingMore.value || initialLoading.value || !activeHasNext.value) return
  const hasToken = Boolean(token.value)
  if (!hasToken && !anilistUserId.value && !anilistUsername.value) {
    errorMessage.value = 'AniList account not linked. Please reconnect in Settings.'
    return
  }

  const isAnime = activeTab.value === 'anime'
  const page = isAnime ? animePage.value : characterPage.value
  const query = hasToken
    ? (isAnime ? viewerFavoriteAnimePageQuery : viewerFavoriteCharacterPageQuery)
    : (isAnime ? favoriteAnimePageQuery : favoriteCharacterPageQuery)
  const field = isAnime ? 'anime' : 'characters'
  const isFirst = page === 1

  if (isFirst) initialLoading.value = true
  else loadingMore.value = true
  errorMessage.value = ''

  try {
    const response = await anilistGraphql.request<any>(
      query,
      hasToken
        ? { page, perPage: 24 }
        : {
          userId: anilistUserId.value || null,
          userName: anilistUsername.value || null,
          page,
          perPage: 24
        },
      { token: token.value, cacheTtlMs: 90_000 }
    )

    if (response?.errors?.length) {
      throw new Error(response.errors[0]?.message || 'Unable to load favorites.')
    }

    const connection = response?.data?.Viewer?.favourites?.[field] || response?.data?.User?.favourites?.[field]
    const nodes = Array.isArray(connection?.nodes) ? connection.nodes : []
    const pageInfo = connection?.pageInfo ?? {}

    if (isAnime) {
      animeItems.value.push(...nodes.map(normalizeAnime))
      animeHasNext.value = Boolean(pageInfo?.hasNextPage)
      animePage.value = Number(pageInfo?.currentPage ?? page) + 1
      animeLoaded.value = true
    } else {
      characterItems.value.push(...nodes.map(normalizeCharacter))
      characterHasNext.value = Boolean(pageInfo?.hasNextPage)
      characterPage.value = Number(pageInfo?.currentPage ?? page) + 1
      characterLoaded.value = true
    }
  } catch (error: any) {
    errorMessage.value = error?.message || 'Unable to load favorites.'
  } finally {
    initialLoading.value = false
    loadingMore.value = false
  }
}

const ensureActiveTabLoaded = async () => {
  if (activeTab.value === 'anime' && !animeLoaded.value) {
    await loadNextPage()
    return
  }
  if (activeTab.value === 'characters' && !characterLoaded.value) {
    await loadNextPage()
  }
}

let observer: IntersectionObserver | null = null
const bindObserver = () => {
  if (!import.meta.client) return
  observer?.disconnect()
  if (!sentinelRef.value) return

  observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadNextPage()
    }
  }, { rootMargin: '220px 0px' })

  observer.observe(sentinelRef.value)
}

const openItem = (url: string) => {
  if (!url || !import.meta.client) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

watch(activeTab, async () => {
  await ensureActiveTabLoaded()
  await nextTick()
  bindObserver()
})

onMounted(async () => {
  await ensureActiveTabLoaded()
  await nextTick()
  bindObserver()
})

watch(sentinelRef, async () => {
  await nextTick()
  bindObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped src="~/assets/css/pages/favorites.css"></style>

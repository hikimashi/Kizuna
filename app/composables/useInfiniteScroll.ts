import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface UseInfiniteScrollOptions {
  /** Distance from bottom (in pixels) to trigger load more */
  threshold?: number
  /** Initial page number */
  initialPage?: number
  /** Items per page */
  perPage?: number
  /** Whether to start loading immediately on mount */
  immediate?: boolean
}

export interface UseInfiniteScrollReturn<T> {
  /** Array of loaded items */
  items: Ref<T[]>
  /** Current page number */
  currentPage: Ref<number>
  /** Whether currently loading */
  loading: Ref<boolean>
  /** Whether all items have been loaded */
  hasMore: Ref<boolean>
  /** Reference to the sentinel element */
  sentinelRef: Ref<HTMLElement | null>
  /** Load more items (can be called manually) */
  loadMore: () => Promise<void>
  /** Reset and reload from beginning */
  reset: () => Promise<void>
  /** Set items data directly */
  setItems: (items: T[]) => void
  /** Set hasMore state */
  setHasMore: (hasMore: boolean) => void
}

/**
 * Composable for implementing infinite scroll with sentinel pattern
 * Similar to AniList's lazy loading behavior
 *
 * @param loadFn - Async function to load items for a given page
 * @param options - Configuration options
 *
 * @example
 * ```ts
 * const { items, loading, hasMore, sentinelRef } = useInfiniteScroll(
 *   async (page) => {
 *     const response = await fetch(`/api/anime?page=${page}&limit=25`)
 *     return response.data
 *   },
 *   { perPage: 25, immediate: true }
 * )
 * ```
 *
 * @example
 * ```vue
 * <template>
 *   <div>
 *     <div v-for="item in items" :key="item.id">
 *       {{ item.title }}
 *     </div>
 *     <div v-if="loading" class="loading-spinner">Loading...</div>
 *     <div v-if="!hasMore" class="end-message">End of list</div>
 *     <div ref="sentinelRef" style="height: 1px"></div>
 *   </div>
 * </template>
 * ```
 */
export function useInfiniteScroll<T>(
  loadFn: (page: number, perPage: number) => Promise<T[]>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const {
    threshold = 200,
    initialPage = 1,
    perPage = 25,
    immediate = true
  } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(initialPage)
  const loading = ref(false)
  const hasMore = ref(true)
  const sentinelRef = ref<HTMLElement | null>(null)

  let observer: IntersectionObserver | null = null

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return

    loading.value = true

    try {
      const newItems = await loadFn(currentPage.value, perPage)

      if (newItems.length < perPage) {
        hasMore.value = false
      }

      items.value = [...items.value, ...newItems]
      currentPage.value++
    } catch (error) {
      console.error('Error loading more items:', error)
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  const reset = async () => {
    items.value = []
    currentPage.value = initialPage
    hasMore.value = true
    
    // Disconnect old observer
    if (observer) {
      observer.disconnect()
    }
    
    await loadMore()
    
    // Re-setup observer after reset
    setTimeout(() => {
      setupObserver()
    }, 0)
  }

  const setItems = (newItems: T[]) => {
    items.value = newItems
  }

  const setHasMore = (value: boolean) => {
    hasMore.value = value
  }

  const setupObserver = () => {
    if (!sentinelRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMore.value && !loading.value) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0
      }
    )

    observer.observe(sentinelRef.value)
  }

  onMounted(() => {
    if (immediate) {
      loadMore()
    }
    // Setup observer after initial render
    setTimeout(() => {
      setupObserver()
    }, 0)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    items,
    currentPage,
    loading,
    hasMore,
    sentinelRef,
    loadMore,
    reset,
    setItems,
    setHasMore
  }
}

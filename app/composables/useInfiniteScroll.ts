import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface UseInfiniteScrollOptions {
  /** Distance depuis le bas (en pixels) pour declencher le chargement */
  threshold?: number
  /** Numero de page initial */
  initialPage?: number
  /** Nombre d'elements par page */
  perPage?: number
  /** Indique s'il faut charger immediatement au montage */
  immediate?: boolean
}

export interface UseInfiniteScrollReturn<T> {
  /** Tableau des elements charges */
  items: Ref<T[]>
  /** Numero de page courant */
  currentPage: Ref<number>
  /** Indique si un chargement est en cours */
  loading: Ref<boolean>
  /** Indique si tous les elements ont ete charges */
  hasMore: Ref<boolean>
  /** Reference vers l'element sentinelle */
  sentinelRef: Ref<HTMLElement | null>
  /** Charge plus d'elements (peut etre appele manuellement) */
  loadMore: () => Promise<void>
  /** Reinitialise puis recharge depuis le debut */
  reset: () => Promise<void>
  /** Definit directement les elements */
  setItems: (items: T[]) => void
  /** Definit l'etat hasMore */
  setHasMore: (hasMore: boolean) => void
}

/**
 * Composable pour implementer un scroll infini avec sentinelle
 * Proche du comportement de chargement progressif d'AniList
 *
 * @param loadFn - Fonction asynchrone qui charge les elements d'une page
 * @param options - Options de configuration
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
 *     <div v-if="loading" class="loading-spinner">Chargement...</div>
 *     <div v-if="!hasMore" class="end-message">Fin de liste</div>
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
      console.error('Erreur lors du chargement de nouveaux elements :', error)
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  const reset = async () => {
    items.value = []
    currentPage.value = initialPage
    hasMore.value = true
    
    // Coupe l'ancien observer
    if (observer) {
      observer.disconnect()
    }
    
    await loadMore()
    
    // Reconfigure l'observer apres la reinitialisation
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
        if (!entry) return
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
    // Configure l'observer apres le rendu initial
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

import { nextTick, onMounted, onUnmounted, ref, type Ref } from 'vue'
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export interface UseInfiniteScrollOptions {
  /** Distance depuis le bas (en pixels) pour declencher le chargement */
  threshold?: number
  /** Numero de page initial */
  initialPage?: number
  /** Nombre d'éléments par page */
  perPage?: number
  /** Indique s'il faut charger immediatement au montage */
  immediate?: boolean
}

export interface UseInfiniteScrollReturn<T> {
  /** Tableau des éléments chargés */
  items: Ref<T[]>
  /** Numero de page courant */
  currentPage: Ref<number>
  /** Indique si un chargement est en cours */
  loading: Ref<boolean>
  /** Indique si tous les éléments ont été chargés */
  hasMore: Ref<boolean>
  /** Référence vers l'élément sentinelle */
  sentinelRef: Ref<HTMLElement | null>
  /** Charge plus d'éléments (peut être appelé manuellement) */
  loadMore: () => Promise<void>
  /** Réinitialise puis recharge depuis le début */
  reset: () => Promise<void>
  /** Définit directement les éléments */
  setItems: (items: T[]) => void
  /** Définit l'état hasMore */
  setHasMore: (hasMore: boolean) => void
}

/**
 * Composable pour implementer un scroll infini avec sentinelle
 * Proche du comportement de chargement progressif d'AniList
 *
 * @param loadFn - Fonction asynchrone qui charge les éléments d'une page
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
/**
 * Calcule la valeur « infinite scroll ».
 *
 * @param loadFn - Valeur utilisée par le traitement « infinite scroll ».
 * @param options - Valeur utilisée par le traitement « infinite scroll ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects modifie l'état réactif, interagit avec le navigateur ou le DOM, peut écrire dans les journaux, gère une temporisation.
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
  let checkViewportTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Calcule la valeur « sentinel is visible ».
   *
   * @returns Le résultat calculé par la fonction.
   * @sideEffects interagit avec le navigateur ou le DOM.
   */
  const sentinelIsVisible = () => {
    if (!sentinelRef.value) return false

    // Check manuel utilisé après chaque chargement si la page ne remplit pas encore le viewport.
    const rect = sentinelRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const triggerOffset = Math.max(threshold, 0)

    return rect.top <= viewportHeight + triggerOffset
  }

  /**
   * Calcule la valeur « schedule viewport check ».
   *
   * @returns Le résultat calculé par la fonction.
   * @sideEffects gère une temporisation.
   */
  const scheduleViewportCheck = () => {
    if (checkViewportTimer) {
      clearTimeout(checkViewportTimer)
    }

    // Decale le check au prochain tour pour laisser Vue poser les nouveaux items dans le DOM.
    checkViewportTimer = setTimeout(async () => {
      checkViewportTimer = null

      if (!hasMore.value || loading.value) return
      if (!sentinelIsVisible()) return

      await loadMore()
    }, 0)
  }

  /**
   * Charge more.
   *
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects modifie l'état réactif, peut écrire dans les journaux.
   */
  const loadMore = async () => {
    if (loading.value || !hasMore.value) return

    loading.value = true

    try {
      // loadFn decide quoi charger; le composable ne connait que page/perPage.
      const newItems = await loadFn(currentPage.value, perPage)

      if (newItems.length < perPage) {
        // Moins d'éléments que perPage indique normalement la dernière page.
        hasMore.value = false
      }

      items.value = [...items.value, ...newItems]
      currentPage.value++
    } catch (error) {
      console.error('Erreur lors du chargement de nouveaux éléments :', error)
      hasMore.value = false
    } finally {
      loading.value = false
      await nextTick()
      scheduleViewportCheck()
    }
  }

  /**
   * Réinitialise reset.
   *
   * @returns Une promesse résolue une fois le traitement terminé.
   * @sideEffects modifie l'état réactif, gère une temporisation.
   */
  const reset = async () => {
    items.value = []
    currentPage.value = initialPage
    hasMore.value = true
    
    // Coupe l'ancien observer
    if (observer) {
      observer.disconnect()
      observer = null
    }
    
    await loadMore()
    
    // Reconfigure l'observer après la réinitialisation
    setTimeout(() => {
      setupObserver()
    }, 0)
  }

  /**
   * Définit items.
   *
   * @param newItems - Valeur utilisée par le traitement « set items ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const setItems = (newItems: T[]) => {
    items.value = newItems
  }

  /**
   * Définit has more.
   *
   * @param value - Valeur utilisée par le traitement « set has more ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const setHasMore = (value: boolean) => {
    hasMore.value = value
  }

  /**
   * Définit up observer.
   *
   * @returns Le résultat calculé par la fonction.
   * @sideEffects interagit avec le navigateur ou le DOM.
   */
  const setupObserver = () => {
    if (!sentinelRef.value) return

    if (observer) {
      // Un seul observer actif à la fois, surtout après reset ou changement de filtres.
      observer.disconnect()
    }

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
        // rootMargin permet d'anticiper le chargement avant que la sentinelle soit visible.
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
    // Configure l'observer après le rendu initial
    setTimeout(() => {
      setupObserver()
    }, 0)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
    if (checkViewportTimer) {
      clearTimeout(checkViewportTimer)
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

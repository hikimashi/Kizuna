import { ref, onMounted, onUnmounted, type Ref } from 'vue'

// Ce composable implemente un defilement infini generique.
// On lui donne une fonction loadFn(page, perPage), et lui s'occupe :
// - de memoriser les elements deja charges,
// - de savoir s'il faut charger la suite,
// - d'ecouter l'arrivee d'une sentinelle dans l'ecran.

export interface UseInfiniteScrollOptions {
  /** Distance depuis le bas, en pixels, avant de declencher un nouveau chargement. */
  threshold?: number
  /** Numero de page de depart. */
  initialPage?: number
  /** Nombre d'elements demandes a chaque page. */
  perPage?: number
  /** Indique si le premier chargement doit partir des le montage du composable. */
  immediate?: boolean
}

export interface UseInfiniteScrollReturn<T> {
  /** Tableau reactif des elements deja charges. */
  items: Ref<T[]>
  /** Numero de la page actuellement atteinte. */
  currentPage: Ref<number>
  /** Indique si un chargement est en cours. */
  loading: Ref<boolean>
  /** Indique s'il reste encore des donnees a recuperer. */
  hasMore: Ref<boolean>
  /** Reference vers l'element sentinelle observe dans le DOM. */
  sentinelRef: Ref<HTMLElement | null>
  /** Lance manuellement le chargement de la page suivante. */
  loadMore: () => Promise<void>
  /** Reinitialise l'etat puis recharge depuis la premiere page. */
  reset: () => Promise<void>
  /** Remplace directement les elements charges. */
  setItems: (items: T[]) => void
  /** Met a jour manuellement l'indicateur de fin de liste. */
  setHasMore: (hasMore: boolean) => void
}

/**
 * Composable pour implementer un defilement infini avec le motif de sentinelle.
 * Le comportement est proche d'un chargement progressif de type AniList.
 *
 * @param loadFn - Fonction asynchrone chargeant les elements d'une page.
 * @param options - Options de configuration du comportement.
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
  // On applique ici les valeurs par defaut si l'appelant ne fournit rien.
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

  // Observer du navigateur qui detecte l'arrivee de la sentinelle dans la zone visible.
  let observer: IntersectionObserver | null = null

  // Charge une page supplementaire et fusionne les nouveaux elements avec ceux deja presents.
  const loadMore = async () => {
    // On stoppe si un chargement est deja en cours ou si on sait qu'il n'y a plus rien.
    if (loading.value || !hasMore.value) return

    // Ce drapeau peut servir a afficher un spinner dans l'interface.
    loading.value = true

    try {
      // loadFn est fourni par le composant parent.
      // Ce composable ne sait pas d'ou viennent les donnees, il gere seulement le mecanisme.
      const newItems = await loadFn(currentPage.value, perPage)

      // Si on recoit moins d'elements que prevu, on suppose que la fin est atteinte.
      if (newItems.length < perPage) {
        hasMore.value = false
      }

      // On conserve les anciens elements et on ajoute les nouveaux a la fin.
      items.value = [...items.value, ...newItems]
      // La prochaine fois, on demandera la page suivante.
      currentPage.value++
    } catch (error) {
      console.error('Error loading more items:', error)
      // En cas d'erreur, on coupe le mode "hasMore" pour eviter une boucle d'appels.
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  // Remet la liste a zero puis recree l'observation pour repartir proprement.
  const reset = async () => {
    items.value = []
    currentPage.value = initialPage
    hasMore.value = true

    // Coupe l'observateur precedent avant de reconstruire l'etat.
    if (observer) {
      observer.disconnect()
    }

    await loadMore()

    // Rebranche l'observateur apres le rendu suivant.
    setTimeout(() => {
      setupObserver()
    }, 0)
  }

  // Permet a un composant parent d'injecter directement une nouvelle liste.
  const setItems = (newItems: T[]) => {
    items.value = newItems
  }

  // Permet a l'appelant de forcer l'etat "il reste des elements".
  const setHasMore = (value: boolean) => {
    hasMore.value = value
  }

  // Branche l'IntersectionObserver sur l'element sentinelle.
  const setupObserver = () => {
    // Tant que le composant n'a pas reference l'element DOM, on ne peut rien observer.
    if (!sentinelRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        // Quand la sentinelle entre dans la zone visible,
        // on demande une nouvelle page si c'est pertinent.
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

  // Au montage, charge si necessaire puis attend le rendu DOM pour observer la sentinelle.
  onMounted(() => {
    if (immediate) {
      loadMore()
    }

    setTimeout(() => {
      setupObserver()
    }, 0)
  })

  // Coupe l'observation a la destruction pour eviter les fuites.
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

/*
Definition des termes techniques :
- composable : fonction Vue reutilisable qui encapsule de la logique reactive.
- infinite scroll : chargement progressif de contenu pendant le defilement.
- sentinelle : element DOM invisible observe pour savoir quand charger plus.
- DOM : structure en memoire de la page HTML manipulee par le navigateur.
- IntersectionObserver : API navigateur qui detecte quand un element entre dans la zone visible.
- montage : moment ou un composant Vue est insere dans la page.
- fuite memoire : ressource non liberee qui reste active inutilement.
*/

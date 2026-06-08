import { computed, unref } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export type EditableAniListStatus =
  | 'CURRENT'
  | 'COMPLETED'
  | 'PAUSED'
  | 'DROPPED'
  | 'PLANNING'
  | 'REPEATING'

export type EditableFuzzyDate = {
  year?: number | null
  month?: number | null
  day?: number | null
}

export type SaveAniListEntryInput = {
  entryId?: number | null
  mediaId?: number | null
  status?: EditableAniListStatus
  score?: number | null
  progress?: number | null
  startedAt?: EditableFuzzyDate | null
  completedAt?: EditableFuzzyDate | null
}

export type SyncSharedListEntryMode = 'create' | 'update'

export type SyncSharedListEntryInput = {
  mediaId: number
  status?: EditableAniListStatus | null
  progress?: number | null
  score?: number | null
  mode?: SyncSharedListEntryMode
}

type AniListMediaListEntryLookup = {
  data?: {
    Media?: {
      id?: number | null
      episodes?: number | null
      mediaListEntry?: {
        id?: number | null
        status?: EditableAniListStatus | string | null
        score?: number | null
        progress?: number | null
      } | null
    } | null
  }
  errors?: Array<{ message?: string | null }> | null
}

const EDITABLE_STATUS_SET = new Set<EditableAniListStatus>([
  'CURRENT',
  'COMPLETED',
  'PAUSED',
  'DROPPED',
  'PLANNING',
  'REPEATING'
])

// ─────────────────────────────────────────
// SECTION : Validation des entrées AniList
// ─────────────────────────────────────────

const SAVE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation (
    $id: Int
    $mediaId: Int
    $status: MediaListStatus
    $score: Float
    $progress: Int
    $startedAt: FuzzyDateInput
    $completedAt: FuzzyDateInput
  ) {
    SaveMediaListEntry(
      id: $id
      mediaId: $mediaId
      status: $status
      score: $score
      progress: $progress
      startedAt: $startedAt
      completedAt: $completedAt
    ) {
      id
      status
      score
      progress
      updatedAt
      startedAt {
        year
        month
        day
      }
      completedAt {
        year
        month
        day
      }
      media {
        id
        episodes
        title {
          romaji
          english
          native
        }
        coverImage {
          medium
          large
        }
      }
    }
  }
`

const MEDIA_LIST_ENTRY_QUERY = `
  query ($mediaId: Int) {
    Media(id: $mediaId, type: ANIME) {
      id
      episodes
      mediaListEntry {
        id
        status
        score
        progress
      }
    }
  }
`

const DELETE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation ($id: Int) {
    DeleteMediaListEntry(id: $id) {
      deleted
    }
  }
`

/**
 * Normalise positive int.
 *
 * @param value - Valeur utilisée par le traitement « normalize positive int ».
 * @param fieldName - Valeur utilisée par le traitement « normalize positive int ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizePositiveInt = (value: unknown, fieldName: string) => {
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  // AniList attend des ids strictement positifs pour les entrées et les médias.
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`)
  }
  return normalized
}

/**
 * Normalise non negative int.
 *
 * @param value - Valeur utilisée par le traitement « normalize non negative int ».
 * @param fieldName - Valeur utilisée par le traitement « normalize non negative int ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeNonNegativeInt = (value: unknown, fieldName: string) => {
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  // La progression peut être 0, mais jamais négative.
  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`)
  }
  return normalized
}

/**
 * Normalise score.
 *
 * @param value - Valeur utilisée par le traitement « normalize score ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeScore = (value: unknown) => {
  if (value === '') return null
  if (value == null) return undefined
  const normalized = Number(value)
  // Le projet utilise l'échelle AniList 0-100 pour éviter les conversions ambiguës.
  if (!Number.isFinite(normalized)) {
    throw new Error('La note doit être un nombre valide.')
  }
  if (normalized < 0 || normalized > 100) {
    throw new Error('La note doit être comprise entre 0 et 100.')
  }
  return normalized
}

/**
 * Normalise editable status.
 *
 * @param value - Valeur utilisée par le traitement « normalize editable status ».
 * @param fallback - Valeur utilisée par le traitement « normalize editable status ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const normalizeEditableStatus = (value: unknown, fallback: EditableAniListStatus) => {
  const normalized = String(value || '').trim().toUpperCase() as EditableAniListStatus
  return EDITABLE_STATUS_SET.has(normalized) ? normalized : fallback
}

/**
 * Calcule la valeur « to finite number ».
 *
 * @param value - Valeur utilisée par le traitement « to finite number ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const toFiniteNumber = (value: unknown) => {
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : undefined
}

/**
 * Indique si rewatch candidate status.
 *
 * @param status - Valeur utilisée par le traitement « is rewatch candidate status ».
 * @returns Le résultat calculé par la fonction.
 * @sideEffects Aucun effet de bord direct identifié.
 */
const isRewatchCandidateStatus = (status: EditableAniListStatus) =>
  status === 'CURRENT' || status === 'PLANNING' || status === 'REPEATING'

/**
 * Calcule la valeur « anilist sync ».
 *
 * @returns Le résultat calculé par la fonction.
 * @sideEffects effectue des appels réseau ou persistants.
 */
export const useAnilistSync = () => {
  const pocketbaseStore = usePocketbaseStore()
  const anilistGraphql = useAnilistGraphql()

  const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)

  /**
   * Retourne token.
   *
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const getToken = () => {
    const token = String(authRecord.value.anilist_token ?? '')
    if (!token) {
      throw new Error('Le compte AniList n\'est pas lié. Reconnectez-le dans les paramètres.')
    }
    return token
  }

  /**
   * Retourne media list entry.
   *
   * @param mediaIdInput - Valeur utilisée par le traitement « get media list entry ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const getMediaListEntry = async (mediaIdInput: number) => {
    const mediaId = normalizePositiveInt(mediaIdInput, 'Media id')
    if (!mediaId) {
      throw new Error('Media id is required.')
    }

    const response = await anilistGraphql.request<AniListMediaListEntryLookup>(
      MEDIA_LIST_ENTRY_QUERY,
      { mediaId },
      {
        token: getToken(),
        skipCache: true
      }
    )

    if (response?.errors?.length) {
      throw new Error(response.errors[0]?.message || 'Impossible de lire l\'entrée AniList.')
    }

    const media = response?.data?.Media
    if (!media?.id) {
      throw new Error('Anime AniList introuvable.')
    }

    return {
      mediaId: Number(media.id),
      episodes: Number(media.episodes || 0) || 0,
      entry: media.mediaListEntry || null
    }
  }

  /**
   * Enregistre entry.
   *
   * @param input - Valeur utilisée par le traitement « save entry ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const saveEntry = async (input: SaveAniListEntryInput) => {
    const entryId = normalizePositiveInt(input.entryId, 'Entry id')
    const mediaId = normalizePositiveInt(input.mediaId, 'Media id')

    // Une mise à jour passe par entryId; une création peut passer seulement par mediaId.
    if (!entryId && !mediaId) {
      throw new Error('Entry id or media id is required.')
    }

    // Normaliser le statut et la progression
    const targetStatus = normalizeEditableStatus(input.status, 'PLANNING')
    const inputProgress = normalizeNonNegativeInt(input.progress, 'Progress')

    // [ATTENTION] : le statut demandé peut être corrigé selon la progression avant envoi à AniList.
    // Logique intelligente de changement de statut basée sur la progression:
    // - Si on a une progression > 0 avec statut PLANNING → passer en CURRENT
    // - Si on a une progression = 0 avec statut CURRENT → passer en PLANNING
    let finalStatus = targetStatus
    if (targetStatus === 'PLANNING' && inputProgress !== undefined && inputProgress > 0) {
      finalStatus = 'CURRENT'
    } else if (targetStatus === 'CURRENT' && (inputProgress === 0 || inputProgress === undefined)) {
      finalStatus = 'PLANNING'
    }

    // AniList accepte soit l'id d'entrée existante, soit le mediaId pour créer/mettre à jour une entrée.
    const response = await anilistGraphql.request<any>(
      SAVE_MEDIA_LIST_ENTRY_MUTATION,
      {
        id: entryId,
        mediaId,
        status: finalStatus,
        score: normalizeScore(input.score),
        progress: inputProgress,
        startedAt: input.startedAt,
        completedAt: input.completedAt
      },
      {
        token: getToken(),
        skipCache: true
      }
    )

    if (response?.errors?.length) {
      throw new Error(response.errors[0]?.message || 'Impossible d\'enregistrer l\'entrée AniList.')
    }

    const savedEntry = response?.data?.SaveMediaListEntry
    // Sans id, l'UI ne peut pas réutiliser cette entrée pour les prochaines modifications.
    if (!savedEntry?.id) {
      throw new Error('AniList n\'a pas renvoyé l\'entrée mise à jour.')
    }

    return savedEntry
  }

  /**
   * Synchronise shared list entry.
   *
   * @param input - Valeur utilisée par le traitement « sync shared list entry ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const syncSharedListEntry = async (input: SyncSharedListEntryInput) => {
    // ─────────────────────────────────────────
    // SECTION : Fusion liste partagée / entrée AniList
    // ─────────────────────────────────────────
    const mode: SyncSharedListEntryMode = input.mode === 'update' ? 'update' : 'create'
    const lookup = await getMediaListEntry(input.mediaId)
    const existingEntry = lookup.entry
    const targetStatus = normalizeEditableStatus(input.status, 'PLANNING')
    const existingStatus = existingEntry?.status
      ? normalizeEditableStatus(existingEntry.status, targetStatus)
      : ''
    const status: EditableAniListStatus = existingStatus === 'COMPLETED' && isRewatchCandidateStatus(targetStatus)
      ? 'REPEATING'
      : targetStatus

    const inputProgress = toFiniteNumber(input.progress)
    const existingProgress = toFiniteNumber(existingEntry?.progress)
    const progress = (() => {
      if (status === 'COMPLETED') {
        if (inputProgress !== undefined && inputProgress > 0) return inputProgress
        if (existingProgress !== undefined && existingProgress > 0) return existingProgress
        if (lookup.episodes > 0) return lookup.episodes
        return inputProgress
      }

      if (inputProgress === undefined) return undefined
      if (inputProgress > 0) return inputProgress
      if (!existingEntry || mode === 'update' || status === 'REPEATING') return 0
      return undefined
    })()

    const inputScore = toFiniteNumber(input.score)
    const score = (() => {
      if (inputScore === undefined) return undefined
      if (inputScore > 0) return inputScore
      if (mode === 'update') return 0
      return undefined
    })()

    return await saveEntry({
      entryId: existingEntry?.id || undefined,
      mediaId: lookup.mediaId,
      status,
      progress,
      score
    })
  }

  /**
   * Supprime entry.
   *
   * @param entryId - Valeur utilisée par le traitement « delete entry ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const deleteEntry = async (entryId: number) => {
    const normalizedEntryId = normalizePositiveInt(entryId, 'Entry id')
    if (!normalizedEntryId) {
      throw new Error('Entry id is required.')
    }

    // Les mutations contournent le cache du proxy afin de voir l'état AniList le plus récent.
    const response = await anilistGraphql.request<any>(
      DELETE_MEDIA_LIST_ENTRY_MUTATION,
      { id: normalizedEntryId },
      {
        token: getToken(),
        skipCache: true
      }
    )

    if (response?.errors?.length) {
      throw new Error(response.errors[0]?.message || 'Impossible de supprimer l\'entrée AniList.')
    }

    const deleted = Boolean(response?.data?.DeleteMediaListEntry?.deleted)
    // AniList peut renvoyer une réponse GraphQL valide mais sans confirmation de suppression.
    if (!deleted) {
      throw new Error('AniList n\'a pas confirmé la suppression.')
    }

    return true
  }

  return {
    getMediaListEntry,
    saveEntry,
    syncSharedListEntry,
    deleteEntry
  }
}

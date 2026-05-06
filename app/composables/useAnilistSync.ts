import { computed, unref } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

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

const DELETE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation ($id: Int) {
    DeleteMediaListEntry(id: $id) {
      deleted
    }
  }
`

const normalizePositiveInt = (value: unknown, fieldName: string) => {
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`)
  }
  return normalized
}

const normalizeNonNegativeInt = (value: unknown, fieldName: string) => {
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`)
  }
  return normalized
}

const normalizeScore = (value: unknown) => {
  if (value === '') return null
  if (value == null) return undefined
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) {
    throw new Error('La note doit être un nombre valide.')
  }
  if (normalized < 0 || normalized > 100) {
    throw new Error('La note doit être comprise entre 0 et 100.')
  }
  return normalized
}

export const useAnilistSync = () => {
  const pocketbaseStore = usePocketbaseStore()
  const anilistGraphql = useAnilistGraphql()

  const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)

  const getToken = () => {
    const token = String(authRecord.value.anilist_token ?? '')
    if (!token) {
      throw new Error('Le compte AniList n\'est pas lié. Reconnectez-le dans les paramètres.')
    }
    return token
  }

  const saveEntry = async (input: SaveAniListEntryInput) => {
    const entryId = normalizePositiveInt(input.entryId, 'Entry id')
    const mediaId = normalizePositiveInt(input.mediaId, 'Media id')

    if (!entryId && !mediaId) {
      throw new Error('Entry id or media id is required.')
    }

    const response = await anilistGraphql.request<any>(
      SAVE_MEDIA_LIST_ENTRY_MUTATION,
      {
        id: entryId,
        mediaId,
        status: input.status,
        score: normalizeScore(input.score),
        progress: normalizeNonNegativeInt(input.progress, 'Progress'),
        startedAt: input.startedAt,
        completedAt: input.completedAt
      },
      {
        token: getToken(),
        skipCache: true
      }
    )

    if (response?.errors?.length) {
      throw new Error(response.errors[0]?.message || 'Impossible d\'enregistrer l\'entree AniList.')
    }

    const savedEntry = response?.data?.SaveMediaListEntry
    if (!savedEntry?.id) {
      throw new Error('AniList n\'a pas renvoyé l\'entrée mise à jour.')
    }

    return savedEntry
  }

  const deleteEntry = async (entryId: number) => {
    const normalizedEntryId = normalizePositiveInt(entryId, 'Entry id')
    if (!normalizedEntryId) {
      throw new Error('Entry id is required.')
    }

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
    if (!deleted) {
      throw new Error('AniList n\'a pas confirme la suppression.')
    }

    return true
  }

  return {
    saveEntry,
    deleteEntry
  }
}

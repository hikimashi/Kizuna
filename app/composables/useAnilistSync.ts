import { computed, unref } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

// Ce composable sert a modifier la liste anime d'un utilisateur sur AniList.
// Il expose deux actions :
// - saveEntry() pour creer ou mettre a jour une entree,
// - deleteEntry() pour la supprimer.

// Etats AniList modifiables par l'utilisateur pour une entree de liste.
export type EditableAniListStatus =
  | 'CURRENT'
  | 'COMPLETED'
  | 'PAUSED'
  | 'DROPPED'
  | 'PLANNING'

export type EditableFuzzyDate = {
  // AniList accepte des dates partielles.
  // Exemple : seulement l'annee, ou l'annee + le mois.
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

// Mutation GraphQL de creation ou mise a jour d'une entree AniList.
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

// Mutation GraphQL de suppression d'une entree AniList.
const DELETE_MEDIA_LIST_ENTRY_MUTATION = `
  mutation ($id: Int) {
    DeleteMediaListEntry(id: $id) {
      deleted
    }
  }
`

// Valide un entier strictement positif avant envoi a l'API.
const normalizePositiveInt = (value: unknown, fieldName: string) => {
  // undefined veut dire : "ne pas envoyer cette valeur".
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`)
  }
  return normalized
}

// Valide un entier positif ou nul, utile pour la progression.
const normalizeNonNegativeInt = (value: unknown, fieldName: string) => {
  if (value == null || value === '') return undefined
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`)
  }
  return normalized
}

// Convertit et borne la note avant la mutation GraphQL.
const normalizeScore = (value: unknown) => {
  // Chaine vide => l'utilisateur veut effacer la note.
  if (value === '') return null
  // undefined => l'utilisateur n'a rien modifie, donc on n'envoie pas ce champ.
  if (value == null) return undefined
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) {
    throw new Error('Score must be a valid number.')
  }
  if (normalized < 0 || normalized > 100) {
    throw new Error('Score must be between 0 and 100.')
  }
  return normalized
}

export const useAnilistSync = () => {
  const pocketbaseStore = usePocketbaseStore()
  const anilistGraphql = useAnilistGraphql()

  // Lecture centralisee du compte local pour recuperer le token AniList.
  const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)

  const getToken = () => {
    const token = String(authRecord.value.anilist_token ?? '')
    // Sans token, AniList refusera la mutation.
    if (!token) {
      throw new Error('AniList account not linked. Please reconnect in Settings.')
    }
    return token
  }

  // Cree ou met a jour une entree de liste en validant les champs avant l'appel reseau.
  const saveEntry = async (input: SaveAniListEntryInput) => {
    // On nettoie et valide les ids avant toute requete distante.
    const entryId = normalizePositiveInt(input.entryId, 'Entry id')
    const mediaId = normalizePositiveInt(input.mediaId, 'Media id')

    // AniList a besoin soit de l'id d'une entree existante,
    // soit de l'id du media a creer dans la liste.
    if (!entryId && !mediaId) {
      throw new Error('Entry id or media id is required.')
    }

    // On envoie ensuite une mutation avec seulement des valeurs deja verifiees.
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
      throw new Error(response.errors[0]?.message || 'Unable to save AniList entry.')
    }

    // La mutation doit nous renvoyer l'entree finale ; sinon on considere que quelque chose s'est mal passe.
    const savedEntry = response?.data?.SaveMediaListEntry
    if (!savedEntry?.id) {
      throw new Error('AniList did not return the updated entry.')
    }

    return savedEntry
  }

  // Supprime une entree de liste et verifie qu'AniList confirme bien la suppression.
  const deleteEntry = async (entryId: number) => {
    // Meme principe : on refuse de partir en requete avec un id invalide.
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
      throw new Error(response.errors[0]?.message || 'Unable to delete AniList entry.')
    }

    const deleted = Boolean(response?.data?.DeleteMediaListEntry?.deleted)
    if (!deleted) {
      throw new Error('AniList did not confirm the deletion.')
    }

    return true
  }

  return {
    saveEntry,
    deleteEntry
  }
}

/*
Definition des termes techniques :
- mutation : requete GraphQL qui modifie une donnee distante.
- normaliser : convertir une valeur dans un format valide et attendu.
- API : interface permettant a deux logiciels d'echanger des donnees.
- token : jeton d'autorisation necessaire pour agir sur le compte AniList.
- payload : contenu de donnees envoye a l'API.
- validation : controle des valeurs avant traitement pour eviter les erreurs.
*/

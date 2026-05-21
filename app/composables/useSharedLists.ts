import { computed, unref } from 'vue'
import { useAnilistSync, type EditableAniListStatus } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

export type SharedListPrivacy = 'private' | 'friends' | 'public'
export type SharedListRole = 'owner' | 'member'
export type SharedListAnimeStatus = 'CURRENT' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REPEATING'
export type SharedListPermission = 'admin' | 'editor' | 'viewer'

type SharedListRecord = {
  id: string
  name?: string
  privacy_level?: SharedListPrivacy
  fk_owner_user_id?: string | string[]
  image?: string
  banner?: string
  created?: string
  updated?: string
}

type UserSharedListRecord = {
  id: string
  fk_user_id?: string | string[]
  fk_shared_list_id?: string | string[]
  fk_permission_id?: string | string[]
  permission?: SharedListPermission
  expand?: {
    fk_permission_id?: PermissionRecord | PermissionRecord[]
  }
  created?: string
  updated?: string
}

type PermissionRecord = {
  id: string
  name?: SharedListPermission
  fk_user_id?: string | string[]
  fk_granted_by_user_id?: string | string[]
  add?: boolean
  modify?: boolean
  delete?: boolean
  suggest_modification?: boolean
  add_user?: boolean
  delete_user?: boolean
  suggest_add_user?: boolean
  created?: string
  updated?: string
}

type AnimeRecord = {
  id: string
  anilist_media_id?: number
  aniilist_media_name?: string
  fetch_link?: string
  created?: string
  updated?: string
}

type AnimeSharedListRecord = {
  id: string
  fk_user_id?: string | string[]
  fk_anime_id?: string | string[]
  fk_shared_list_id?: string | string[]
  status?: SharedListAnimeStatus
  progress?: number
  score?: number
  created?: string
  updated?: string
}

type UserRecord = {
  id: string
  anilist_username?: string
  anilist_avatar_url_medium?: string
  anilist_avatar_url_large?: string
}

export type SharedListMember = {
  id: string
  name: string
  shortName: string
  initials: string
  avatar?: string
  color: string
  role: SharedListRole
  permission: SharedListPermission
  canRead: boolean
  canAddAnime: boolean
  canEditAnime: boolean
  canDeleteAnime: boolean
  canManageMembers: boolean
  joinedAt?: string
  membershipId?: string
  isCurrentUser: boolean
}

export type SharedListAnimeEntry = {
  id: string
  relationId: string
  title: string
  mediaId: number
  fetchLink?: string
  addedByUserId?: string
  status: SharedListAnimeStatus
  progress: number
  score: number
  createdAt?: string
  updatedAt?: string
}

export type SharedListSummary = {
  id: string
  title: string
  privacy: SharedListPrivacy
  ownerId: string
  ownerName: string
  ownerAvatar?: string
  createdAt?: string
  updatedAt?: string
  updatedLabel: string
  isOwner: boolean
  isMember: boolean
  memberCount: number
  animeCount: number
  imageUrl?: string
  bannerUrl?: string
  members: SharedListMember[]
  membersVisibilityLimited: boolean
  animeVisibilityLimited: boolean
}

export type SharedListDetail = SharedListSummary & {
  ownMembershipId?: string
  canManageMembers: boolean
  animeEntries: SharedListAnimeEntry[]
}

const normalizeRelationValue = (value?: string | string[]) => {
  // PocketBase peut exposer une relation simple comme string ou comme tableau selon l'expand.
  if (Array.isArray(value)) return String(value[0] || '')
  return String(value || '')
}

const normalizeRelationValues = (value?: string | string[]) => {
  // Variante multi-valeurs pour les anciens schémas où une relation était stockée en tableau.
  if (Array.isArray(value)) return value.map(item => String(item || '')).filter(Boolean)
  const single = String(value || '')
  return single ? [single] : []
}

// Les filtres PocketBase sont construits en texte, donc les valeurs utilisateur sont toujours échappées.
const escapeFilterValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const buildOrIdFilter = (ids: string[], field = 'id') =>
  // Construit un filtre OR PocketBase reutilisable pour les lots d'ids.
  ids.map(id => `${field}="${escapeFilterValue(id)}"`).join(' || ')
const sharedListContentIsPubliclyReadable = (privacy?: SharedListPrivacy) => privacy === 'public' || privacy === 'friends'
const isUniqueConstraintError = (error: any) => {
  const message = String(error?.message || '').toLowerCase()
  // PocketBase, SQLite et certains proxies ne nomment pas toujours l'erreur d'unicite pareil.
  return message.includes('unique') || message.includes('duplicate') || message.includes('already exists')
}
const isUnknownFieldError = (error: any) => {
  const message = String(error?.message || '').toLowerCase()
  const responseMessage = String(error?.response?.message || '').toLowerCase()
  // PocketBase place parfois les details de validation dans response.data, parfois dans le message racine.
  const fieldData = error?.response?.data && typeof error.response.data === 'object'
    ? Object.values(error.response.data).map((value: any) => `${value?.code || ''} ${value?.message || ''}`.toLowerCase()).join(' ')
    : ''
  const haystack = `${message} ${responseMessage} ${fieldData}`
  return haystack.includes('unknown field')
    || haystack.includes('cannot find field')
    || haystack.includes('failed to find field')
    || haystack.includes('validation_unknown')
}
const isPocketbaseValidationError = (error: any) => Number(error?.status || error?.response?.status || 0) === 400
const isPocketbaseAccessError = (error: any) => {
  const status = Number(error?.status || error?.response?.status || 0)
  return status === 401 || status === 403
}
const isPocketbaseNotFoundError = (error: any) => Number(error?.status || error?.response?.status || 0) === 404

const getDisplayName = (user?: Partial<UserRecord> | null, fallbackId = '') => {
  const label = String(user?.anilist_username || '').trim()
  if (label) return label
  // Fallback volontairement court pour ne pas exposer un id complet dans les cartes.
  return fallbackId ? `Utilisateur ${fallbackId.slice(0, 4)}` : 'Inconnu'
}

const getAvatar = (user?: Partial<UserRecord> | null) => {
  return String(user?.anilist_avatar_url_large || user?.anilist_avatar_url_medium || '').trim() || undefined
}

const getInitials = (value: string) => {
  // Deux initiales lisibles pour les avatars générés, même si le pseudo contient des symboles.
  const parts = value
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 2)
  const initials = parts.map(part => part[0]?.toUpperCase() || '').join('')
  return initials || value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 2) || 'SL'
}

const shortName = (value: string) => value.length <= 12 ? value : value.slice(0, 12)

const hueFromString = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
  // Petit hash déterministe pour garder la même couleur d'avatar entre deux rendus.
    hash = (hash * 31 + value.charCodeAt(index)) % 360
  }
  return hash
}

const memberColor = (value: string) => `hsl(${hueFromString(value)} 72% 52%)`

const formatRelativeDate = (value?: string) => {
  if (!value) return 'Mis à jour récemment'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Mis à jour récemment'
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.max(Math.floor(diffMs / 3600000), 0)
  if (diffHours < 1) return 'Mis à jour à l\'instant'
  if (diffHours < 24) return `Mis à jour il y a ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Mis à jour il y a ${diffDays} j`
  return `Mis à jour le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}

const formatDateLabel = (value?: string) => {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const pocketbaseErrorDetails = (error: any) => {
  // Regroupe les messages utiles de PocketBase pour produire une erreur actionnable côté UI.
  const responseData = error?.response?.data && typeof error.response.data === 'object'
    ? Object.values(error.response.data).map((value: any) => `${value?.code || ''} ${value?.message || ''}`.trim()).filter(Boolean).join(' | ')
    : ''
  return [String(error?.message || '').trim(), String(error?.response?.message || '').trim(), responseData]
    .filter(Boolean)
    .join(' | ')
}

const noAutoCancel = {
  requestKey: null as null
}

const sharedListMediaFieldError = () => new Error(
  'La collection PocketBase `shared_list` doit encore contenir les champs fichiers `image` et `banner`.'
)

const fetchUsersByIds = async (pb: PocketBaseClient, ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (!uniqueIds.length) return new Map<string, UserRecord>()

  // Charge les profils en un appel groupé pour éviter un aller-retour PocketBase par membre.
  const users = await pb.collection('user').getFullList<UserRecord>({
    filter: buildOrIdFilter(uniqueIds),
    ...noAutoCancel
  })

  return new Map(users.map(user => [user.id, user]))
}

const normalizeSharedListPermission = (value: unknown): SharedListPermission | null => {
  const normalized = String(value || '').trim().toLowerCase()
  // "moderator" est conserve comme alias historique de l'ancien prototype.
  if (normalized === 'admin') return 'admin'
  if (normalized === 'editor' || normalized === 'moderator') return 'editor'
  if (normalized === 'viewer') return 'viewer'
  return null
}

const permissionDefaults = (permission: SharedListPermission) => ({
  // Matrice de base côté UI; les flags PocketBase explicites peuvent ensuite la surcharger.
  canRead: true,
  canAddAnime: permission !== 'viewer',
  canEditAnime: permission !== 'viewer',
  canDeleteAnime: permission === 'admin',
  canManageMembers: permission === 'admin'
})

const getPermissionRecord = (membership?: UserSharedListRecord | null) => {
  const expanded = membership?.expand?.fk_permission_id
  // Selon la relation PocketBase, l'expand peut revenir comme objet ou tableau.
  if (Array.isArray(expanded)) return expanded[0]
  return expanded
}

// Les anciennes données peuvent ne pas avoir de nom de permission; on reconstruit le rôle via les flags.
const inferPermissionFromRecord = (permissionRecord?: PermissionRecord | null) => {
  const namedPermission = normalizeSharedListPermission(permissionRecord?.name)
  if (namedPermission) return namedPermission

  if (permissionRecord?.add_user || permissionRecord?.delete_user || permissionRecord?.delete) {
    return 'admin'
  }

  if (permissionRecord?.add || permissionRecord?.modify || permissionRecord?.suggest_modification) {
    return 'editor'
  }

  if (typeof permissionRecord?.add === 'boolean') {
    return 'viewer'
  }

  return null
}

const getPermissionName = (
  membership?: UserSharedListRecord | null,
  role: SharedListRole = 'member'
): SharedListPermission => {
  if (role === 'owner') return 'admin'
  const recordPermission = inferPermissionFromRecord(getPermissionRecord(membership))
  if (recordPermission) return recordPermission
  const membershipPermission = normalizeSharedListPermission(membership?.permission)
  if (membershipPermission) return membershipPermission
  return 'viewer'
}

const getPermissionCapabilities = (
  membership?: UserSharedListRecord | null,
  role: SharedListRole = 'member'
) => {
  const permission = getPermissionName(membership, role)
  const defaults = permissionDefaults(permission)
  const permissionRecord = getPermissionRecord(membership)
  const hasMemberManagementFlags = typeof permissionRecord?.add_user === 'boolean' || typeof permissionRecord?.delete_user === 'boolean'

  // Les flags explicites de PocketBase priment sur les defaults calcules depuis admin/editor/viewer.
  return {
    permission,
    canRead: defaults.canRead,
    canAddAnime: typeof permissionRecord?.add === 'boolean' ? permissionRecord.add : defaults.canAddAnime,
    canEditAnime: typeof permissionRecord?.modify === 'boolean' ? permissionRecord.modify : defaults.canEditAnime,
    canDeleteAnime: typeof permissionRecord?.delete === 'boolean' ? permissionRecord.delete : defaults.canDeleteAnime,
    canManageMembers: hasMemberManagementFlags
      ? Boolean(permissionRecord?.add_user || permissionRecord?.delete_user)
      : defaults.canManageMembers
  }
}

const permissionFlags = (permission: SharedListPermission) => {
  if (permission === 'admin') {
    // Admin: gestion complete des animes, membres et suggestions.
    return {
      add: true,
      modify: true,
      delete: true,
      suggest_modification: true,
      add_user: true,
      delete_user: true,
      suggest_add_user: true
    }
  }

  if (permission === 'editor') {
    // Editor: peut enrichir la liste mais pas supprimer ou gérer les membres.
    return {
      add: true,
      modify: true,
      delete: false,
      suggest_modification: true,
      add_user: false,
      delete_user: false,
      suggest_add_user: false
    }
  }

  // Viewer: acces lecture uniquement.
  return {
    add: false,
    modify: false,
    delete: false,
    suggest_modification: false,
    add_user: false,
    delete_user: false,
    suggest_add_user: false
  }
}

const buildMember = (
  memberId: string,
  currentUserId: string,
  currentUserProfile: Partial<UserRecord>,
  userMap: Map<string, UserRecord>,
  membership?: UserSharedListRecord,
  role: SharedListRole = 'member'
): SharedListMember => {
  const isCurrentUser = memberId === currentUserId
  // Le profil courant vient du store auth, les autres sont lus dans le userMap groupe.
  const user = isCurrentUser
    ? ({ id: currentUserId, ...currentUserProfile } as UserRecord)
    : userMap.get(memberId)
  const name = isCurrentUser
    ? getDisplayName({ ...currentUserProfile, id: currentUserId }, currentUserId)
    : getDisplayName(user, memberId)
  const capabilities = getPermissionCapabilities(membership, role)

  // Modele unique consomme par les pages hub, detail et profil social.
  return {
    id: memberId,
    name,
    shortName: shortName(name),
    initials: getInitials(name),
    avatar: isCurrentUser ? getAvatar(currentUserProfile) : getAvatar(user),
    color: isCurrentUser ? '#3db4f2' : memberColor(memberId),
    role,
    permission: capabilities.permission,
    canRead: capabilities.canRead,
    canAddAnime: capabilities.canAddAnime,
    canEditAnime: capabilities.canEditAnime,
    canDeleteAnime: capabilities.canDeleteAnime,
    canManageMembers: capabilities.canManageMembers,
    joinedAt: membership?.created,
    membershipId: membership?.id,
    isCurrentUser
  }
}

export const useSharedLists = () => {
  const pocketbaseStore = usePocketbaseStore()
  const anilistSync = useAnilistSync()
  const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
  const currentUserId = computed(() => String(authRecord.value.id || ''))
  const currentUserProfile = computed<Partial<UserRecord>>(() => ({
    id: currentUserId.value,
    anilist_username: String(authRecord.value.anilist_username || ''),
    anilist_avatar_url_medium: String(authRecord.value.anilist_avatar_url_medium || ''),
    anilist_avatar_url_large: String(authRecord.value.anilist_avatar_url_large || '')
  }))

  const sharedListFileUrl = (
    record?: SharedListRecord | null,
    field?: string,
    options?: { thumb?: string }
  ) => {
    const fileName = String(field || '').trim()
    if (!record || !fileName) return undefined
    // Délègue l'URL signée/thumbnail à PocketBase pour rester compatible avec ses règles fichiers.
    return pocketbaseStore.pb.files.getURL(record as Record<string, any>, fileName, options)
  }

  const buildSharedListPayload = (
    input: {
      name?: string
      privacy?: SharedListPrivacy
      groupImageFile?: File | null
      bannerImageFile?: File | null
    },
    options: {
      includeName?: boolean
      includePrivacy?: boolean
      includeMedia?: boolean
    } = {}
  ) => {
    const payload = new FormData()

    // FormData est nécessaire ici car les images et les champs texte partagent la même requête.
    if (options.includeName !== false && typeof input.name === 'string') {
      payload.append('name', input.name.trim())
    }

    if (options.includePrivacy !== false && input.privacy) {
      payload.append('privacy_level', input.privacy)
    }

    if (options.includeMedia !== false) {
      if (input.groupImageFile) payload.append('image', input.groupImageFile)
      if (input.bannerImageFile) payload.append('banner', input.bannerImageFile)
    }

    return payload
  }

  const buildMembershipPayload = (
    listId: string,
    userId: string,
    options: {
      permissionId?: string
    } = {}
  ) => {
    const payload = new FormData()
    // Les relations sont passees par FormData pour rester homogene avec les schemas PocketBase relationnels.
    payload.append('fk_user_id', userId)
    payload.append('fk_shared_list_id', listId)

    if (options.permissionId) payload.append('fk_permission_id', options.permissionId)

    return payload
  }

  const buildPermissionPayload = (
    userId: string,
    grantedByUserId: string,
    permission: SharedListPermission
  ) => ({
    name: permission,
    fk_user_id: userId,
    fk_granted_by_user_id: grantedByUserId,
    // Les flags denormalises sont utilises directement par les rules PocketBase.
    ...permissionFlags(permission)
  })

  const createMembershipRecord = async (
    listId: string,
    userId: string,
    permission: SharedListPermission
  ) => {
    const grantedByUserId = requireCurrentUserId()
    // Une appartenance depend d'abord d'une permission partageable entre les rules PocketBase et l'UI.
    const permissionRecord = await pocketbaseStore.pb.collection('permission').create<PermissionRecord>(
      buildPermissionPayload(userId, grantedByUserId, permission)
    )

    try {
      return await pocketbaseStore.pb.collection('user_shared_list').create<UserSharedListRecord>(
        buildMembershipPayload(listId, userId, { permissionId: permissionRecord.id })
      )
    } catch (error: any) {
      try {
        await pocketbaseStore.pb.collection('permission').delete(permissionRecord.id)
      } catch {
        // Nettoyage de secours si la création de l'appartenance échoue après la permission.
      }
      throw error
    }
  }

  const requireCurrentUserId = () => {
    const userId = String(currentUserId.value || '')
    if (!userId) {
      throw new Error('Vous devez être connecté pour gérer les listes partagées.')
    }
    return userId
  }

  const getOwnerId = (sharedList?: SharedListRecord | null) => normalizeRelationValue(sharedList?.fk_owner_user_id)

  const membershipHasUser = (membership?: Pick<UserSharedListRecord, 'fk_user_id'> | null, userId = '') => {
    if (!userId || !membership) return false
    return normalizeRelationValues(membership.fk_user_id).includes(userId)
  }

  const buildUserMembershipFilter = (userId: string) => {
    const safeUserId = escapeFilterValue(userId)
    // Supporte à la fois relation simple (=) et ancienne relation multiple (?=).
    return `(fk_user_id ?= "${safeUserId}" || fk_user_id="${safeUserId}")`
  }

  const buildMembershipFilter = (listId: string, userId: string) => {
    const safeListId = escapeFilterValue(listId)
    return `fk_shared_list_id="${safeListId}" && ${buildUserMembershipFilter(userId)}`
  }

  const buildTargetParticipationFilter = (userId: string) => {
    const safeUserId = escapeFilterValue(userId)
    // Participation = propriétaire direct ou membre via la relation inverse PocketBase.
    return `(fk_owner_user_id="${safeUserId}" || user_shared_list_via_fk_shared_list_id.fk_user_id ?= "${safeUserId}")`
  }

  // Transforme des records shared_list bruts en cartes riches pour les pages liste/profil.
  const loadSummaryRecords = async (
    records: SharedListRecord[],
    viewerUserId = String(currentUserId.value || '')
  ) => {
    // Déduplique les listes qui peuvent arriver à la fois via propriétaire et via membership.
    const listRecords = Array.from(
      new Map(
        records
          .filter(record => record.id)
          .map(record => [record.id, record] as const)
      ).values()
    )

    if (!listRecords.length) return []

    const accessibleListIds = listRecords.map(record => record.id)
    // Les memberships et les compteurs anime sont optionnels pour l'affichage; un échec partiel ne bloque pas tout.
    const [membershipResult, animeRelationsResult] = await Promise.allSettled([
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({
        filter: buildOrIdFilter(accessibleListIds, 'fk_shared_list_id'),
        sort: '-updated',
        expand: 'fk_permission_id',
        ...noAutoCancel
      }),
      pocketbaseStore.pb.collection('anime_shared_list').getFullList<AnimeSharedListRecord>({
        filter: buildOrIdFilter(accessibleListIds, 'fk_shared_list_id'),
        sort: '-updated',
        ...noAutoCancel
      })
    ])

    const membershipRecords = membershipResult.status === 'fulfilled' ? membershipResult.value : []
    const animeRelations = animeRelationsResult.status === 'fulfilled' ? animeRelationsResult.value : []

    const membershipsByList = new Map<string, UserSharedListRecord[]>()
    for (const membership of membershipRecords) {
      const listId = normalizeRelationValue(membership.fk_shared_list_id)
      if (!listId) continue
      // Regroupe les memberships par liste pour éviter de filtrer tout le tableau dans chaque carte.
      const current = membershipsByList.get(listId) ?? []
      current.push(membership)
      membershipsByList.set(listId, current)
    }

    const animeCountByList = new Map<string, number>()
    for (const relation of animeRelations) {
      const listId = normalizeRelationValue(relation.fk_shared_list_id)
      if (!listId) continue
      // Compteur local suffisant pour les cartes resumees.
      animeCountByList.set(listId, Number(animeCountByList.get(listId) || 0) + 1)
    }

    const visibleUserIds = new Set<string>()
    for (const record of listRecords) {
      const ownerId = getOwnerId(record)
      if (ownerId) visibleUserIds.add(ownerId)
    }
    for (const membership of membershipRecords) {
      for (const memberId of normalizeRelationValues(membership.fk_user_id)) {
        visibleUserIds.add(memberId)
      }
    }

    // Charge uniquement les utilisateurs visibles pour éviter un appel PocketBase par carte.
    const userMap = await fetchUsersByIds(pocketbaseStore.pb, Array.from(visibleUserIds))

    return listRecords.map((record) => {
      const ownerId = getOwnerId(record)
      const privacy = (record.privacy_level || 'friends') as SharedListPrivacy
      const memberships = membershipsByList.get(record.id) ?? []
      // ownMembership determine si le viewer peut voir les infos completes de la liste.
      const ownMembership = viewerUserId
        ? memberships.find(membership => membershipHasUser(membership, viewerUserId))
        : undefined
      const isOwner = Boolean(viewerUserId) && ownerId === viewerUserId
      const isMember = isOwner || Boolean(ownMembership)
      const memberIds = Array.from(new Set([
        ownerId,
        ...memberships.flatMap(membership => normalizeRelationValues(membership.fk_user_id))
      ].filter(Boolean)))

      const ownerUser = isOwner
        ? ({ id: ownerId, ...currentUserProfile.value } as UserRecord)
        : userMap.get(ownerId)
      const ownerName = isOwner
        ? getDisplayName(currentUserProfile.value, ownerId)
        : getDisplayName(ownerUser, ownerId)

      const members = memberIds.slice(0, 5).map((memberId) => {
        const membership = memberships.find(item => membershipHasUser(item, memberId))
        const role: SharedListRole = memberId === ownerId ? 'owner' : 'member'
        return buildMember(memberId, viewerUserId, currentUserProfile.value, userMap, membership, role)
      })

      return {
        id: record.id,
        title: String(record.name || 'Liste partagée sans titre'),
        privacy,
        ownerId,
        ownerName,
        ownerAvatar: isOwner ? getAvatar(currentUserProfile.value) : getAvatar(ownerUser),
        createdAt: record.created,
        updatedAt: record.updated,
        updatedLabel: formatRelativeDate(record.updated),
        isOwner,
        isMember,
        memberCount: Math.max(memberIds.length, ownerId ? 1 : 0),
        animeCount: Number(animeCountByList.get(record.id) || 0),
        imageUrl: sharedListFileUrl(record, record.image),
        bannerUrl: sharedListFileUrl(record, record.banner),
        members,
        membersVisibilityLimited: !isMember && !sharedListContentIsPubliclyReadable(privacy),
        animeVisibilityLimited: !isMember && !sharedListContentIsPubliclyReadable(privacy)
      } satisfies SharedListSummary
    })
  }

  const getSharedListRecord = async (listId: string) => {
    return await pocketbaseStore.pb.collection('shared_list').getOne<SharedListRecord>(listId, {
      ...noAutoCancel
    })
  }

  const getMembershipRecord = async (membershipId: string) => {
    return await pocketbaseStore.pb.collection('user_shared_list').getOne<UserSharedListRecord>(membershipId, {
      expand: 'fk_permission_id',
      ...noAutoCancel
    })
  }

  const getAnimeSharedListRecord = async (relationId: string) => {
    return await pocketbaseStore.pb.collection('anime_shared_list').getOne<AnimeSharedListRecord>(relationId, {
      ...noAutoCancel
    })
  }

  const findMembership = async (listId: string, userId: string) => {
    if (!listId || !userId) return null

    const existing = await pocketbaseStore.pb.collection('user_shared_list').getList<UserSharedListRecord>(1, 1, {
      filter: buildMembershipFilter(listId, userId),
      expand: 'fk_permission_id',
      ...noAutoCancel
    })

    return existing.items[0] || null
  }

  const getListAccessContext = async (listId: string) => {
    const userId = requireCurrentUserId()
    const sharedList = await getSharedListRecord(listId)
    const ownerId = getOwnerId(sharedList)
    const membership = await findMembership(listId, userId)
    const isOwner = ownerId === userId

    // Centralise les infos d'accès pour que chaque assertion partage la même lecture PocketBase.
    return {
      userId,
      sharedList,
      ownerId,
      membership,
      isOwner,
      isMember: isOwner || Boolean(membership)
    }
  }

  const assertSharedListAccess = async (listId: string) => {
    const access = await getListAccessContext(listId)
    if (!access.isMember) {
      throw new Error('Vous n\'avez pas accès à cette liste partagée.')
    }
    return access
  }

  const assertSharedListOwner = async (listId: string) => {
    const access = await assertSharedListAccess(listId)
    // Certaines actions restent réservées au propriétaire, même si un admin peut gérer les membres.
    if (!access.isOwner) {
      throw new Error('Seul le propriétaire peut gérer cette liste partagée.')
    }
    return access
  }

  const assertCanManageMembersInList = async (listId: string) => {
    const access = await assertSharedListAccess(listId)
    if (access.isOwner) return access

    if (!getPermissionCapabilities(access.membership).canManageMembers) {
      throw new Error('Vous n\'avez pas la permission de gérer les membres de cette liste partagée.')
    }

    return access
  }

  const assertCanAddAnimeToList = async (listId: string) => {
    const access = await assertSharedListAccess(listId)
    if (access.isOwner) return access

    if (!getPermissionCapabilities(access.membership).canAddAnime) {
      throw new Error('Vous n\'avez pas la permission d\'ajouter des animes à cette liste partagée.')
    }

    return access
  }

  const assertCanEditAnimeInList = async (listId: string) => {
    const access = await assertSharedListAccess(listId)
    if (access.isOwner) return access

    if (!getPermissionCapabilities(access.membership).canEditAnime) {
      throw new Error('Vous n\'avez pas la permission de modifier les entrées anime de cette liste partagée.')
    }

    return access
  }

  const assertCanDeleteAnimeFromList = async (listId: string) => {
    const access = await assertSharedListAccess(listId)
    if (access.isOwner) return access

    if (!getPermissionCapabilities(access.membership).canDeleteAnime) {
      throw new Error('Vous n\'avez pas la permission de retirer des animes de cette liste partagée.')
    }

    return access
  }

  const repairMembershipRecord = async (membership: UserSharedListRecord, listId: string, userId: string) => {
    const memberIds = normalizeRelationValues(membership.fk_user_id)
    if (memberIds.length === 1 && memberIds[0] === userId) {
      return membership
    }

    try {
      // Corrige les anciens records ou PocketBase renvoyait parfois une relation sous forme de tableau.
      return await pocketbaseStore.pb.collection('user_shared_list').update<UserSharedListRecord>(
        membership.id,
        buildMembershipPayload(listId, userId)
      )
    } catch {
      return membership
    }
  }

  const ensureMembership = async (
    listId: string,
    userId: string,
    permission: SharedListPermission = 'viewer'
  ) => {
    const existing = await findMembership(listId, userId)
    if (existing) return await repairMembershipRecord(existing, listId, userId)

    try {
      return await createMembershipRecord(listId, userId, permission)
    } catch (error: any) {
      if (!isUniqueConstraintError(error)) throw error
      // Si deux appels créent la même appartenance en parallèle, on relit le record gagné par l'autre appel.
      const retried = await findMembership(listId, userId)
      return retried ? await repairMembershipRecord(retried, listId, userId) : retried
    }
  }

  const recreateMembershipWithPermission = async (
    membership: UserSharedListRecord,
    listId: string,
    userId: string,
    permission: SharedListPermission
  ) => {
    const previousPermission = getPermissionName(membership)
    const previousPermissionId = normalizeRelationValue(membership.fk_permission_id)

    // Certains schemas/rules ne permettent pas de modifier fk_permission_id; on recrée alors l'appartenance.
    await pocketbaseStore.pb.collection('user_shared_list').delete(membership.id)

    try {
      const recreated = await createMembershipRecord(listId, userId, permission)

      if (previousPermissionId) {
        try {
          await pocketbaseStore.pb.collection('permission').delete(previousPermissionId)
        } catch {
          // Le nettoyage des anciennes permissions reste un effort de secours.
        }
      }

      return recreated
    } catch (error: any) {
      try {
        if (previousPermissionId) {
          await pocketbaseStore.pb.collection('user_shared_list').create<UserSharedListRecord>(
            buildMembershipPayload(listId, userId, { permissionId: previousPermissionId })
          )
        } else {
          await createMembershipRecord(listId, userId, previousPermission)
        }
      } catch {
        // Retour arrière de secours si la recréation échoue avec la nouvelle permission.
      }
      throw error
    }
  }

  const updateMembershipPermission = async (membershipId: string, permission: SharedListPermission) => {
    const membership = await getMembershipRecord(membershipId)
    const listId = normalizeRelationValue(membership.fk_shared_list_id)
    const userId = normalizeRelationValue(membership.fk_user_id)
    if (!listId) {
      throw new Error('Cette fiche d\'appartenance n\'a pas de liste partagée associée.')
    }
    if (!userId) {
      throw new Error('Cette fiche d\'appartenance n\'a pas de membre associé.')
    }

    const access = await assertCanManageMembersInList(listId)
    const permissionId = normalizeRelationValue(membership.fk_permission_id)

    if (!permissionId) {
      return await recreateMembershipWithPermission(membership, listId, userId, permission)
    }

    try {
      return await pocketbaseStore.pb.collection('permission').update<PermissionRecord>(
        permissionId,
        buildPermissionPayload(userId, access.userId, permission)
      )
    } catch (error: any) {
      if (isPocketbaseValidationError(error) || isPocketbaseAccessError(error) || isPocketbaseNotFoundError(error)) {
        return await recreateMembershipWithPermission(membership, listId, userId, permission)
      }
      throw error
    }
  }

  const ensureOwnerMembership = async (listId: string) => {
    if (!currentUserId.value) return null

    const sharedList = await getSharedListRecord(listId)
    const ownerId = getOwnerId(sharedList)
    if (!ownerId || ownerId !== currentUserId.value) return null

    return await ensureMembership(listId, currentUserId.value, 'admin')
  }

  const migrateLegacyMemberships = async (listId: string) => {
    const access = await assertSharedListOwner(listId)
    let changed = false
    const failedMembershipIds: string[] = []

    // Les listes créées avant les permissions explicites peuvent ne pas avoir de membership propriétaire.
    if (access.ownerId === access.userId && !access.membership) {
      await ensureMembership(listId, access.userId, 'admin')
      changed = true
    }

    const membershipRecords = await pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({
      filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
      sort: '-created',
      expand: 'fk_permission_id',
      ...noAutoCancel
    })

    for (const membership of membershipRecords) {
      const memberId = normalizeRelationValue(membership.fk_user_id)
      const permissionId = normalizeRelationValue(membership.fk_permission_id)
      const permissionRecord = getPermissionRecord(membership)

      if (!memberId) continue
      if (permissionId && permissionRecord) continue

      const role: SharedListRole = memberId === access.ownerId ? 'owner' : 'member'
      const permission = getPermissionName(membership, role)

      try {
        await recreateMembershipWithPermission(membership, listId, memberId, permission)
        changed = true
      } catch (error) {
        failedMembershipIds.push(membership.id)
        console.warn('Echec de la migration d une ancienne appartenance de liste partagée.', {
          listId,
          membershipId: membership.id,
          memberId,
          permission,
          error
        })
      }
    }

    return {
      changed,
      failedMembershipIds
    }
  }

  const buildAnimeCreateValidationError = async (listId: string, error: any) => {
    let ownerId = ''
    let membership: UserSharedListRecord | null = null

    // Ajoute du contexte fonctionnel aux erreurs PocketBase, souvent trop génériques côté API.
    try {
      const sharedList = await getSharedListRecord(listId)
      ownerId = normalizeRelationValue(sharedList.fk_owner_user_id)
    } catch {
      ownerId = ''
    }

    try {
      membership = await findMembership(listId, currentUserId.value)
    } catch {
      membership = null
    }

    const details = pocketbaseErrorDetails(error)

    if (ownerId === currentUserId.value && !membership) {
      return new Error(`L'appartenance du propriétaire est absente sur cette liste partagée. ${details}`.trim())
    }

    if (ownerId === currentUserId.value) {
      return new Error(`PocketBase a refusé la création de l'anime pour le propriétaire. ${details || 'Création de fiche impossible.'}`.trim())
    }

    const permission = getPermissionName(membership)
    if (permission !== 'viewer') {
      return new Error(
        `PocketBase refuse encore la creation de l'anime pour un membre ${permission} sur cette liste partagée. ` +
        `${details || 'Verifiez anime_shared_list.createRule et permission.add.'}`
      )
    }

    return new Error(`PocketBase a refusé la création d'un anime sur cette liste partagée. ${details || 'Création de fiche impossible.'}`.trim())
  }

  const loadSummaries = async () => {
    if (!currentUserId.value) return []

    const userId = requireCurrentUserId()
    // Les listes visibles du viewer viennent de deux sources: propriétaire et memberships.
    const [ownedListRecords, ownMembershipRecords] = await Promise.all([
      pocketbaseStore.pb.collection('shared_list').getFullList<SharedListRecord>({
        filter: `fk_owner_user_id="${escapeFilterValue(userId)}"`,
        sort: '-updated',
        ...noAutoCancel
      }),
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({
        filter: buildUserMembershipFilter(userId),
        sort: '-updated',
        expand: 'fk_permission_id',
        ...noAutoCancel
      })
    ])

    const ownedListIds = new Set(ownedListRecords.map(record => record.id).filter(Boolean))
    // Évite les doublons quand le propriétaire possède aussi un membership admin.
    const joinedListIds = Array.from(new Set(
      ownMembershipRecords
        .map(record => normalizeRelationValue(record.fk_shared_list_id))
        .filter(listId => Boolean(listId) && !ownedListIds.has(listId))
    ))

    const joinedListRecords = joinedListIds.length
      ? await pocketbaseStore.pb.collection('shared_list').getFullList<SharedListRecord>({
          filter: buildOrIdFilter(joinedListIds),
          sort: '-updated',
          ...noAutoCancel
        })
      : []

    // La normalisation finale rajoute owner, membres, compteurs et URLs fichiers.
    return await loadSummaryRecords(
      [...ownedListRecords, ...joinedListRecords],
      userId
    )
  }

  const loadProfileSummaries = async (input: {
    targetUserId: string
    viewerIsFriend?: boolean
  }) => {
    const viewerUserId = requireCurrentUserId()
    const targetUserId = String(input.targetUserId || '').trim()
    if (!targetUserId) return []

    // Commence par les listes déjà visibles par la session pour respecter les droits personnels du viewer.
    const visibleFromSession = await loadSummaries()
    const overlappingLists = visibleFromSession.filter(list =>
      list.ownerId === targetUserId || list.members.some(member => member.id === targetUserId)
    )
    const overlapIds = new Set(overlappingLists.map(list => list.id))

    const publicRecordsPromise = pocketbaseStore.pb.collection('shared_list').getFullList<SharedListRecord>({
      // Les listes publiques du profil cible peuvent être montrées même sans relation mutuelle.
      filter: `privacy_level="public" && ${buildTargetParticipationFilter(targetUserId)}`,
      sort: '-updated',
      ...noAutoCancel
    })

    const friendRecordsPromise = input.viewerIsFriend
      ? pocketbaseStore.pb.collection('shared_list').getFullList<SharedListRecord>({
          // Les listes "friends" sont ajoutees seulement si AniList confirme la relation d'amis.
          filter: `privacy_level="friends" && ${buildTargetParticipationFilter(targetUserId)}`,
          sort: '-updated',
          ...noAutoCancel
        }).catch((error: any) => {
          if (isPocketbaseAccessError(error) || isPocketbaseNotFoundError(error)) {
            return []
          }
          throw error
        })
      : Promise.resolve([] as SharedListRecord[])

    const [publicRecords, friendRecords] = await Promise.all([
      publicRecordsPromise,
      friendRecordsPromise
    ])

    // Ajoute seulement les listes publiques/amis qui ne sont pas déjà dans les listes de la session.
    const supplementalSummaries = await loadSummaryRecords(
      [...publicRecords, ...friendRecords].filter(record => !overlapIds.has(record.id)),
      viewerUserId
    )

    return [...overlappingLists, ...supplementalSummaries]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
  }

  const loadDetail = async (listId: string) => {
    const userId = requireCurrentUserId()
    const record = await pocketbaseStore.pb.collection('shared_list').getOne<SharedListRecord>(listId, {
      ...noAutoCancel
    })
    const ownerId = getOwnerId(record)
    const ownMembership = await findMembership(listId, userId)
    const isOwner = ownerId === userId
    const isMember = isOwner || Boolean(ownMembership)

    // Le détail a besoin des membres et des animes; allSettled laisse la page afficher ce qui est disponible.
    const [membershipResult, animeRelationsResult] = await Promise.allSettled([
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({
        filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
        sort: '-created',
        expand: 'fk_permission_id',
        ...noAutoCancel
      }),
      pocketbaseStore.pb.collection('anime_shared_list').getFullList<AnimeSharedListRecord>({
        filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
        sort: '-created',
        ...noAutoCancel
      })
    ])

    const membershipRecords = membershipResult.status === 'fulfilled' ? membershipResult.value : []
    const animeRelations = animeRelationsResult.status === 'fulfilled' ? animeRelationsResult.value : []

    const memberIds = Array.from(new Set([
      ownerId,
      ...membershipRecords.flatMap(membership => normalizeRelationValues(membership.fk_user_id))
    ].filter(Boolean)))

    // Deux maps de lookup évitent de chercher les users/animes pendant chaque rendu d'entrée.
    const animeIds = Array.from(new Set(animeRelations.map(relation => normalizeRelationValue(relation.fk_anime_id)).filter(Boolean)))
    const userIds = Array.from(new Set(memberIds.filter(Boolean)))

    const [userMap, animeMap] = await Promise.all([
      fetchUsersByIds(pocketbaseStore.pb, userIds),
      animeIds.length
        ? pocketbaseStore.pb.collection('anime').getFullList<AnimeRecord>({
            filter: buildOrIdFilter(animeIds),
            ...noAutoCancel
          }).then(records => new Map(records.map(item => [item.id, item])))
        : Promise.resolve(new Map<string, AnimeRecord>())
    ])

    // Les records relationnels sont convertis en modèles UI avec permissions et identité affichée.
    const members = memberIds.map((memberId) => {
      const membership = membershipRecords.find(item => membershipHasUser(item, memberId))
      return buildMember(
        memberId,
        userId,
        currentUserProfile.value,
        userMap,
        membership,
        memberId === ownerId ? 'owner' : 'member'
      )
    })

    const ownerUser = ownerId === userId
      ? ({ id: ownerId, ...currentUserProfile.value } as UserRecord)
      : userMap.get(ownerId)
    const privacy = (record.privacy_level || 'friends') as SharedListPrivacy

    const animeEntries = animeRelations.map((relation) => {
      const animeId = normalizeRelationValue(relation.fk_anime_id)
      const anime = animeMap.get(animeId)
      // L'id relationnel reste séparé pour modifier/supprimer l'entrée sans confondre avec l'id anime.
      return {
        id: animeId || relation.id,
        relationId: relation.id,
        title: String(anime?.aniilist_media_name || anime?.anilist_media_id || 'Anime inconnu'),
        mediaId: Number(anime?.anilist_media_id || 0),
        fetchLink: anime?.fetch_link,
        addedByUserId: normalizeRelationValue(relation.fk_user_id) || undefined,
        status: (relation.status || 'PLANNING') as SharedListAnimeStatus,
        progress: Number(relation.progress || 0),
        score: Number(relation.score || 0),
        createdAt: relation.created,
        updatedAt: relation.updated
      } satisfies SharedListAnimeEntry
    })

    return {
      id: record.id,
      title: String(record.name || 'Liste partagée sans titre'),
      privacy,
      ownerId,
      ownerName: ownerId === userId
        ? getDisplayName(currentUserProfile.value, ownerId)
        : getDisplayName(ownerUser, ownerId),
      ownerAvatar: ownerId === userId ? getAvatar(currentUserProfile.value) : getAvatar(ownerUser),
      createdAt: record.created,
      updatedAt: record.updated,
      updatedLabel: formatRelativeDate(record.updated),
      isOwner,
      isMember,
      memberCount: members.length,
      animeCount: animeEntries.length,
      imageUrl: sharedListFileUrl(record, record.image),
      bannerUrl: sharedListFileUrl(record, record.banner),
      members,
      ownMembershipId: ownMembership?.id,
      canManageMembers: isOwner || (isMember && getPermissionCapabilities(ownMembership).canManageMembers),
      membersVisibilityLimited: !isMember && !sharedListContentIsPubliclyReadable(privacy),
      animeVisibilityLimited: !isMember && !sharedListContentIsPubliclyReadable(privacy),
      animeEntries
    } satisfies SharedListDetail
  }

  const createSharedList = async (input: {
    name: string
    privacy: SharedListPrivacy
    groupImageFile?: File | null
    bannerImageFile?: File | null
  }) => {
    const userId = requireCurrentUserId()
    const title = input.name.trim()
    if (!title) {
      throw new Error('Le nom de la liste est obligatoire.')
    }

    let created: SharedListRecord

    try {
      const payload = buildSharedListPayload(
        {
          name: title,
          privacy: input.privacy,
          groupImageFile: input.groupImageFile,
          bannerImageFile: input.bannerImageFile
        },
        { includeMedia: true }
      )
      payload.append('fk_owner_user_id', userId)
      // La liste est créée avant le membership propriétaire, car la relation a besoin de l'id liste.
      created = await pocketbaseStore.pb.collection('shared_list').create<SharedListRecord>(payload)
    } catch (error: any) {
      if (isUnknownFieldError(error) && (input.groupImageFile || input.bannerImageFile)) {
        throw sharedListMediaFieldError()
      }
      throw error
    }

    // Le propriétaire doit aussi exister dans user_shared_list pour réutiliser les mêmes checks que les membres.
    await ensureMembership(created.id, userId, 'admin')

    return created
  }

  const updateSharedList = async (listId: string, patch: {
    name?: string
    privacy?: SharedListPrivacy
    groupImageFile?: File | null
    bannerImageFile?: File | null
  }) => {
    // Même permission que la gestion des membres: owner/admin uniquement.
    await assertCanManageMembersInList(listId)

    try {
      const payload = buildSharedListPayload(
        {
          name: patch.name,
          privacy: patch.privacy,
          groupImageFile: patch.groupImageFile,
          bannerImageFile: patch.bannerImageFile
        },
        { includeMedia: true }
      )
      return await pocketbaseStore.pb.collection('shared_list').update(listId, payload)
    } catch (error: any) {
      if (isUnknownFieldError(error) && (patch.groupImageFile || patch.bannerImageFile)) {
        throw sharedListMediaFieldError()
      }
      throw error
    }
  }

  const addMemberToList = async (listId: string, userId: string) => {
    // ensureMembership gère le cas où le membre existe déjà et les anciennes relations à réparer.
    await assertCanManageMembersInList(listId)
    return await ensureMembership(listId, userId)
  }

  const removeMembership = async (membershipId: string) => {
    const membership = await getMembershipRecord(membershipId)
    const listId = normalizeRelationValue(membership.fk_shared_list_id)
    const memberId = normalizeRelationValue(membership.fk_user_id)

    if (!listId) {
      throw new Error('Cette fiche d\'appartenance n\'a pas de liste partagée associée.')
    }

    const access = await assertSharedListAccess(listId)
    // Un membre peut se retirer lui-même; sinon il faut un droit de gestion des membres.
    if (!access.isOwner && memberId !== access.userId && !getPermissionCapabilities(access.membership).canManageMembers) {
      throw new Error('Vous n\'avez pas la permission de retirer d\'autres membres de cette liste partagée.')
    }
    if (memberId && memberId === access.ownerId) {
      throw new Error('Le propriétaire ne peut pas être retiré de cette liste partagée.')
    }

    return await pocketbaseStore.pb.collection('user_shared_list').delete(membershipId)
  }

  const deleteSharedList = async (listId: string) => {
    await assertSharedListOwner(listId)

    // PocketBase ne cascade pas forcement ces relations, donc on nettoie les dependances avant la liste.
    const [memberships, animeRelations] = await Promise.all([
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({
        filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
        ...noAutoCancel
      }),
      pocketbaseStore.pb.collection('anime_shared_list').getFullList<AnimeSharedListRecord>({
        filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
        ...noAutoCancel
      })
    ])

    for (const relation of animeRelations) {
      // Supprime d'abord les entrées anime pour éviter les relations orphelines.
      await pocketbaseStore.pb.collection('anime_shared_list').delete(relation.id)
    }

    for (const membership of memberships) {
      const permissionId = normalizeRelationValue(membership.fk_permission_id)

      // Supprime l'appartenance avant sa permission pour respecter les rules relationnelles.
      await pocketbaseStore.pb.collection('user_shared_list').delete(membership.id)

      if (permissionId) {
        try {
          await pocketbaseStore.pb.collection('permission').delete(permissionId)
        } catch {
          // Sans gravité si la permission est déjà supprimée ou protégée.
        }
      }
    }

    return await pocketbaseStore.pb.collection('shared_list').delete(listId)
  }

  const ensureAnimeRecord = async (input: { mediaId: number; title: string; fetchLink?: string }) => {
    const mediaId = Number(input.mediaId || 0)
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      throw new Error('Identifiant AniList invalide pour cet anime.')
    }

    const existing = await pocketbaseStore.pb.collection('anime').getList<AnimeRecord>(1, 1, {
      filter: `anilist_media_id=${mediaId}`,
      ...noAutoCancel
    })

    const current = existing.items[0]
    // La fiche anime locale est unique par id AniList pour toutes les listes partagees.
    if (current) return current

    try {
      // Réutilise ou crée une fiche anime locale pour que les listes partagent le même média AniList.
      return await pocketbaseStore.pb.collection('anime').create<AnimeRecord>({
        anilist_media_id: mediaId,
        aniilist_media_name: input.title.trim() || `AniList #${mediaId}`,
        fetch_link: String(input.fetchLink || '').trim() || `/anime/${mediaId}`
      })
    } catch (error: any) {
      if (!isUniqueConstraintError(error)) throw error

      // Gestion de course: un autre client a pu créer la fiche après notre première lecture.
      const retry = await pocketbaseStore.pb.collection('anime').getList<AnimeRecord>(1, 1, {
        filter: `anilist_media_id=${mediaId}`,
        ...noAutoCancel
      })
      const retried = retry.items[0]
      if (retried) return retried
      throw error
    }
  }

  const getAnimeRecord = async (animeRecordId: string) => {
    if (!animeRecordId) {
      throw new Error('Cette entrée anime n\'a pas de fiche anime associée.')
    }

    return await pocketbaseStore.pb.collection('anime').getOne<AnimeRecord>(animeRecordId, {
      ...noAutoCancel
    })
  }

  const syncSharedAnimeToAniList = async (
    animeRecord: Pick<AnimeRecord, 'anilist_media_id'>,
    input: {
      status?: SharedListAnimeStatus
      progress?: number
      score?: number
      mode: 'create' | 'update'
    }
  ) => {
    const mediaId = Number(animeRecord.anilist_media_id || 0)
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      throw new Error('Identifiant AniList introuvable pour cette entrée partagée.')
    }

    return await anilistSync.syncSharedListEntry({
      mediaId,
      status: input.status as EditableAniListStatus | undefined,
      progress: input.progress,
      score: input.score,
      mode: input.mode
    })
  }

  const addAnimeToList = async (
    listId: string,
    input: {
      mediaId: number
      title: string
      fetchLink?: string
      status?: SharedListAnimeStatus
      progress?: number
      score?: number
    }
  ) => {
    const access = await assertCanAddAnimeToList(listId)
    const animeRecord = await ensureAnimeRecord(input)

    const existingRelation = await pocketbaseStore.pb.collection('anime_shared_list').getList<AnimeSharedListRecord>(1, 1, {
      filter: `fk_shared_list_id="${escapeFilterValue(listId)}" && fk_anime_id="${escapeFilterValue(animeRecord.id)}"`,
      ...noAutoCancel
    })

    // Verification explicite pour offrir un message metier avant l'erreur d'unicite PocketBase.
    if (existingRelation.items[0]) {
      throw new Error('Cet anime est déjà dans cette liste partagée.')
    }

    await syncSharedAnimeToAniList(animeRecord, {
      status: input.status || 'PLANNING',
      progress: input.progress,
      score: input.score,
      mode: 'create'
    })

    // withStateFields permet de rester compatible avec un schema anime_shared_list pas encore migre.
    const createRelation = async (withStateFields: boolean) => {
      return await pocketbaseStore.pb.collection('anime_shared_list').create<AnimeSharedListRecord>({
        fk_user_id: access.userId,
        fk_anime_id: animeRecord.id,
        fk_shared_list_id: listId,
        ...(withStateFields
          ? {
              status: input.status || 'PLANNING',
              progress: Number(input.progress || 0),
              score: Number(input.score || 0)
            }
          : {})
      })
    }

    try {
      return await createRelation(true)
    } catch (error: any) {
      if (isUniqueConstraintError(error)) {
        throw new Error('Cet anime est déjà dans cette liste partagée.')
      }

      if (isUnknownFieldError(error)) {
        try {
          // Fallback prototype: creation minimale si status/progress/score n'existent pas encore.
          return await createRelation(false)
        } catch (retryError: any) {
          if (isUniqueConstraintError(retryError)) {
            throw new Error('Cet anime est déjà dans cette liste partagée.')
          }
          if (isPocketbaseValidationError(retryError)) {
            throw await buildAnimeCreateValidationError(listId, retryError)
          }
          throw retryError
        }
      }

      if (isPocketbaseValidationError(error)) {
        throw await buildAnimeCreateValidationError(listId, error)
      }

      const details = pocketbaseErrorDetails(error)
      if (details) {
        throw new Error(details)
      }

      throw error
    }
  }

  const updateAnimeListEntry = async (
    relationId: string,
    patch: {
      status?: SharedListAnimeStatus
      progress?: number
      score?: number
    }
  ) => {
    const relation = await getAnimeSharedListRecord(relationId)
    const listId = normalizeRelationValue(relation.fk_shared_list_id)
    if (!listId) {
      throw new Error('Cette entrée anime n\'a pas de liste partagée associée.')
    }

    await assertCanEditAnimeInList(listId)

    const animeRecordId = normalizeRelationValue(relation.fk_anime_id)
    const animeRecord = await getAnimeRecord(animeRecordId)
    await syncSharedAnimeToAniList(animeRecord, {
      status: patch.status || relation.status || 'PLANNING',
      progress: patch.progress,
      score: patch.score,
      mode: 'update'
    })

    const payload: Record<string, any> = {}
    // Patch partiel: seuls les champs vraiment changés sont envoyés à PocketBase.
    if (patch.status) payload.status = patch.status
    if (typeof patch.progress === 'number') payload.progress = patch.progress
    if (typeof patch.score === 'number') payload.score = patch.score
    try {
      return await pocketbaseStore.pb.collection('anime_shared_list').update<AnimeSharedListRecord>(relationId, payload)
    } catch (error: any) {
      if (isUnknownFieldError(error)) {
        throw new Error('La collection PocketBase `anime_shared_list` doit encore contenir les champs `status`, `progress` et `score`.')
      }
      throw error
    }
  }

  const removeAnimeFromList = async (relationId: string) => {
    const relation = await getAnimeSharedListRecord(relationId)
    const listId = normalizeRelationValue(relation.fk_shared_list_id)
    if (!listId) {
      throw new Error('Cette entrée anime n\'a pas de liste partagée associée.')
    }

    await assertCanDeleteAnimeFromList(listId)
    return await pocketbaseStore.pb.collection('anime_shared_list').delete(relationId)
  }

  const searchUsers = async (query: string, excludeIds: string[] = []) => {
    const needle = query.trim()
    if (needle.length < 2) return []

    const exclusions = Array.from(new Set(excludeIds.filter(Boolean)))
      .map(id => `id != "${escapeFilterValue(id)}"`)
      .join(' && ')
    const textFilter = `anilist_username ~ "${escapeFilterValue(needle)}"`
    // Le filtre combine recherche texte et exclusions déjà présentes dans la liste.
    const filter = exclusions ? `${textFilter} && ${exclusions}` : textFilter

    // La création de liste n'a besoin que de quelques résultats rapides pour le picker.
    const result = await pocketbaseStore.pb.collection('user').getList<UserRecord>(1, 8, {
      filter,
      sort: 'anilist_username'
    })

    return result.items.map(user => ({
      id: user.id,
      name: getDisplayName(user, user.id),
      avatar: getAvatar(user),
      initials: getInitials(getDisplayName(user, user.id)),
      color: memberColor(user.id)
    }))
  }

  return {
    currentUserId,
    currentUserProfile,
    formatDateLabel,
    loadSummaries,
    loadProfileSummaries,
    loadDetail,
    createSharedList,
    updateSharedList,
    addMemberToList,
    addAnimeToList,
    updateAnimeListEntry,
    removeAnimeFromList,
    removeMembership,
    updateMembershipPermission,
    deleteSharedList,
    ensureOwnerMembership,
    migrateLegacyMemberships,
    searchUsers
  }
}
type PocketBaseClient = ReturnType<typeof usePocketbaseStore>['pb']

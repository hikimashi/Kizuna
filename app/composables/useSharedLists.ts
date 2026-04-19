import { computed, unref } from 'vue'
import type PocketBase from 'pocketbase'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

export type SharedListPrivacy = 'private' | 'friends' | 'public'
export type SharedListRole = 'owner' | 'member'
export type SharedListAnimeStatus = 'CURRENT' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REPEATING'

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
  permission?: 'admin' | 'editor' | 'viewer'
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
  permission: 'admin' | 'editor' | 'viewer'
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
}

export type SharedListDetail = SharedListSummary & {
  ownMembershipId?: string
  canManageMembers: boolean
  membersVisibilityLimited: boolean
  animeEntries: SharedListAnimeEntry[]
}

const normalizeRelationValue = (value?: string | string[]) => {
  if (Array.isArray(value)) return String(value[0] || '')
  return String(value || '')
}

const normalizeRelationValues = (value?: string | string[]) => {
  if (Array.isArray(value)) return value.map(item => String(item || '')).filter(Boolean)
  const single = String(value || '')
  return single ? [single] : []
}

const escapeFilterValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const buildOrIdFilter = (ids: string[]) => ids.map(id => `id="${escapeFilterValue(id)}"`).join(' || ')
const isUniqueConstraintError = (error: any) => {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('unique') || message.includes('duplicate') || message.includes('already exists')
}
const isUnknownFieldError = (error: any) => {
  const message = String(error?.message || '').toLowerCase()
  const responseMessage = String(error?.response?.message || '').toLowerCase()
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

const getDisplayName = (user?: Partial<UserRecord> | null, fallbackId = '') => {
  const label = String(user?.anilist_username || '').trim()
  if (label) return label
  return fallbackId ? `User ${fallbackId.slice(0, 4)}` : 'Unknown'
}

const getAvatar = (user?: Partial<UserRecord> | null) => {
  return String(user?.anilist_avatar_url_large || user?.anilist_avatar_url_medium || '').trim() || undefined
}

const getInitials = (value: string) => {
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
    hash = (hash * 31 + value.charCodeAt(index)) % 360
  }
  return hash
}

const memberColor = (value: string) => `hsl(${hueFromString(value)} 72% 52%)`

const formatRelativeDate = (value?: string) => {
  if (!value) return 'Updated recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Updated recently'
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.max(Math.floor(diffMs / 3600000), 0)
  if (diffHours < 1) return 'Updated just now'
  if (diffHours < 24) return `Updated ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Updated ${diffDays}d ago`
  return `Updated ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

const formatDateLabel = (value?: string) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const pocketbaseErrorDetails = (error: any) => {
  const responseData = error?.response?.data && typeof error.response.data === 'object'
    ? Object.values(error.response.data).map((value: any) => `${value?.code || ''} ${value?.message || ''}`.trim()).filter(Boolean).join(' | ')
    : ''
  return [String(error?.message || '').trim(), String(error?.response?.message || '').trim(), responseData]
    .filter(Boolean)
    .join(' | ')
}

const sharedListMediaFieldError = () => new Error(
  'PocketBase shared_list still needs `image` and `banner` file fields.'
)

const fetchUsersByIds = async (pb: PocketBase, ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (!uniqueIds.length) return new Map<string, UserRecord>()

  const users = await pb.collection('user').getFullList<UserRecord>({
    filter: buildOrIdFilter(uniqueIds)
  })

  return new Map(users.map(user => [user.id, user]))
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
  const user = isCurrentUser
    ? ({ id: currentUserId, ...currentUserProfile } as UserRecord)
    : userMap.get(memberId)
  const name = isCurrentUser
    ? getDisplayName({ ...currentUserProfile, id: currentUserId }, currentUserId)
    : getDisplayName(user, memberId)

  return {
    id: memberId,
    name,
    shortName: shortName(name),
    initials: getInitials(name),
    avatar: isCurrentUser ? getAvatar(currentUserProfile) : getAvatar(user),
    color: isCurrentUser ? '#3db4f2' : memberColor(memberId),
    role,
    permission: membership?.permission || (role === 'owner' ? 'admin' : 'viewer'),
    canRead: true,
    canAddAnime: (membership?.permission || (role === 'owner' ? 'admin' : 'viewer')) !== 'viewer',
    canEditAnime: (membership?.permission || (role === 'owner' ? 'admin' : 'viewer')) !== 'viewer',
    canDeleteAnime: (membership?.permission || (role === 'owner' ? 'admin' : 'viewer')) === 'admin',
    canManageMembers: (membership?.permission || (role === 'owner' ? 'admin' : 'viewer')) === 'admin',
    joinedAt: membership?.created,
    membershipId: membership?.id,
    isCurrentUser
  }
}

export const useSharedLists = () => {
  const pocketbaseStore = usePocketbaseStore()
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

  const getSharedListRecord = async (listId: string) => {
    return await pocketbaseStore.pb.collection('shared_list').getOne<SharedListRecord>(listId)
  }

  const findMembership = async (listId: string, userId: string) => {
    if (!listId || !userId) return null

    const existing = await pocketbaseStore.pb.collection('user_shared_list').getList<UserSharedListRecord>(1, 1, {
      filter: `fk_shared_list_id="${escapeFilterValue(listId)}" && fk_user_id ?= "${escapeFilterValue(userId)}"`
    })

    return existing.items[0] || null
  }

  const ensureMembership = async (listId: string, userId: string) => {
    const existing = await findMembership(listId, userId)
    if (existing) return existing

    try {
      const create = async (withPermission: boolean) => {
        return await pocketbaseStore.pb.collection('user_shared_list').create<UserSharedListRecord>({
          fk_user_id: userId,
          fk_shared_list_id: listId,
          ...(withPermission ? { permission: 'viewer' as const } : {})
        })
      }

      try {
        return await create(true)
      } catch (error: any) {
        if (isUnknownFieldError(error)) {
          return await create(false)
        }
        throw error
      }
    } catch (error: any) {
      if (!isUniqueConstraintError(error)) throw error
      return await findMembership(listId, userId)
    }
  }

  const updateMembershipPermission = async (membershipId: string, permission: 'admin' | 'editor' | 'viewer') => {
    try {
      return await pocketbaseStore.pb.collection('user_shared_list').update<UserSharedListRecord>(membershipId, { permission })
    } catch (error: any) {
      if (isUnknownFieldError(error)) {
        throw new Error('PocketBase user_shared_list still needs a `permission` select field (admin/editor/viewer).')
      }
      throw error
    }
  }

  const ensureOwnerMembership = async (listId: string) => {
    if (!currentUserId.value) return null

    const sharedList = await getSharedListRecord(listId)
    const ownerId = normalizeRelationValue(sharedList.fk_owner_user_id)
    if (!ownerId || ownerId !== currentUserId.value) return null

    return await ensureMembership(listId, currentUserId.value)
  }

  const buildAnimeCreateValidationError = async (listId: string, error: any) => {
    let ownerId = ''
    let membership: UserSharedListRecord | null = null

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
      return new Error(`Owner membership is missing on this shared list. ${details}`.trim())
    }

    if (ownerId === currentUserId.value) {
      return new Error(`PocketBase rejected anime creation for the owner. ${details || 'Failed to create record.'}`.trim())
    }

    return new Error(`PocketBase rejected anime creation on this shared list. ${details || 'Failed to create record.'}`.trim())
  }

  const loadSummaries = async () => {
    if (!currentUserId.value) return []

    const [listRecords, membershipRecords, animeRelations] = await Promise.all([
      pocketbaseStore.pb.collection('shared_list').getFullList<SharedListRecord>({ sort: '-updated' }),
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({ sort: '-updated' }),
      pocketbaseStore.pb.collection('anime_shared_list').getFullList<AnimeSharedListRecord>({ sort: '-updated' })
    ])

    const membershipsByList = new Map<string, UserSharedListRecord[]>()
    for (const membership of membershipRecords) {
      const listId = normalizeRelationValue(membership.fk_shared_list_id)
      if (!listId) continue
      const current = membershipsByList.get(listId) ?? []
      current.push(membership)
      membershipsByList.set(listId, current)
    }

    const animeCountByList = new Map<string, number>()
    for (const relation of animeRelations) {
      const listId = normalizeRelationValue(relation.fk_shared_list_id)
      if (!listId) continue
      animeCountByList.set(listId, Number(animeCountByList.get(listId) || 0) + 1)
    }

    const visibleUserIds = new Set<string>()
    for (const record of listRecords) {
      const ownerId = normalizeRelationValue(record.fk_owner_user_id)
      if (ownerId) visibleUserIds.add(ownerId)
    }
    for (const membership of membershipRecords) {
      for (const memberId of normalizeRelationValues(membership.fk_user_id)) {
        visibleUserIds.add(memberId)
      }
    }

    const userMap = await fetchUsersByIds(pocketbaseStore.pb, Array.from(visibleUserIds))

    return listRecords.map((record) => {
      const ownerId = normalizeRelationValue(record.fk_owner_user_id)
      const memberships = membershipsByList.get(record.id) ?? []
      const ownMembership = memberships.find((membership) => normalizeRelationValues(membership.fk_user_id).includes(currentUserId.value))
      const memberIds = Array.from(new Set([
        ownerId,
        ...memberships.flatMap(membership => normalizeRelationValues(membership.fk_user_id))
      ].filter(Boolean)))

      const ownerUser = ownerId === currentUserId.value
        ? ({ id: ownerId, ...currentUserProfile.value } as UserRecord)
        : userMap.get(ownerId)
      const ownerName = ownerId === currentUserId.value
        ? getDisplayName(currentUserProfile.value, ownerId)
        : getDisplayName(ownerUser, ownerId)

      const members = memberIds.slice(0, 5).map((memberId) => {
        const membership = memberships.find(item => normalizeRelationValues(item.fk_user_id).includes(memberId))
        const role: SharedListRole = memberId === ownerId ? 'owner' : 'member'
        return buildMember(memberId, currentUserId.value, currentUserProfile.value, userMap, membership, role)
      })

      return {
        id: record.id,
        title: String(record.name || 'Untitled shared list'),
        privacy: (record.privacy_level || 'friends') as SharedListPrivacy,
        ownerId,
        ownerName,
        ownerAvatar: ownerId === currentUserId.value ? getAvatar(currentUserProfile.value) : getAvatar(ownerUser),
        createdAt: record.created,
        updatedAt: record.updated,
        updatedLabel: formatRelativeDate(record.updated),
        isOwner: ownerId === currentUserId.value,
        isMember: ownerId === currentUserId.value || Boolean(ownMembership),
        memberCount: Math.max(memberIds.length, ownerId ? 1 : 0),
        animeCount: Number(animeCountByList.get(record.id) || 0),
        imageUrl: sharedListFileUrl(record, record.image),
        bannerUrl: sharedListFileUrl(record, record.banner),
        members
      } satisfies SharedListSummary
    })
  }

  const loadDetail = async (listId: string) => {
    const record = await pocketbaseStore.pb.collection('shared_list').getOne<SharedListRecord>(listId)
    const ownerId = normalizeRelationValue(record.fk_owner_user_id)

    const [membershipRecords, animeRelations] = await Promise.all([
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({
        filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
        sort: '-created'
      }),
      pocketbaseStore.pb.collection('anime_shared_list').getFullList<AnimeSharedListRecord>({
        filter: `fk_shared_list_id="${escapeFilterValue(listId)}"`,
        sort: '-created'
      })
    ])

    const ownMembership = membershipRecords.find((membership) => normalizeRelationValues(membership.fk_user_id).includes(currentUserId.value))
    const memberIds = Array.from(new Set([
      ownerId,
      ...membershipRecords.flatMap(membership => normalizeRelationValues(membership.fk_user_id))
    ].filter(Boolean)))

    const animeIds = Array.from(new Set(animeRelations.map(relation => normalizeRelationValue(relation.fk_anime_id)).filter(Boolean)))
    const userIds = Array.from(new Set(memberIds.filter(Boolean)))

    const [userMap, animeMap] = await Promise.all([
      fetchUsersByIds(pocketbaseStore.pb, userIds),
      animeIds.length
        ? pocketbaseStore.pb.collection('anime').getFullList<AnimeRecord>({
            filter: buildOrIdFilter(animeIds)
          }).then(records => new Map(records.map(item => [item.id, item])))
        : Promise.resolve(new Map<string, AnimeRecord>())
    ])

    const members = memberIds.map((memberId) => {
      const membership = membershipRecords.find(item => normalizeRelationValues(item.fk_user_id).includes(memberId))
      return buildMember(
        memberId,
        currentUserId.value,
        currentUserProfile.value,
        userMap,
        membership,
        memberId === ownerId ? 'owner' : 'member'
      )
    })

    const ownerUser = ownerId === currentUserId.value
      ? ({ id: ownerId, ...currentUserProfile.value } as UserRecord)
      : userMap.get(ownerId)

    const animeEntries = animeRelations.map((relation) => {
      const animeId = normalizeRelationValue(relation.fk_anime_id)
      const anime = animeMap.get(animeId)
      return {
        id: animeId || relation.id,
        relationId: relation.id,
        title: String(anime?.aniilist_media_name || anime?.anilist_media_id || 'Unknown anime'),
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
      title: String(record.name || 'Untitled shared list'),
      privacy: (record.privacy_level || 'friends') as SharedListPrivacy,
      ownerId,
      ownerName: ownerId === currentUserId.value
        ? getDisplayName(currentUserProfile.value, ownerId)
        : getDisplayName(ownerUser, ownerId),
      ownerAvatar: ownerId === currentUserId.value ? getAvatar(currentUserProfile.value) : getAvatar(ownerUser),
      createdAt: record.created,
      updatedAt: record.updated,
      updatedLabel: formatRelativeDate(record.updated),
      isOwner: ownerId === currentUserId.value,
      isMember: ownerId === currentUserId.value || Boolean(ownMembership),
      memberCount: members.length,
      animeCount: animeEntries.length,
      imageUrl: sharedListFileUrl(record, record.image),
      bannerUrl: sharedListFileUrl(record, record.banner),
      members,
      ownMembershipId: ownMembership?.id,
      canManageMembers: ownerId === currentUserId.value,
      membersVisibilityLimited: ownerId !== currentUserId.value,
      animeEntries
    } satisfies SharedListDetail
  }

  const createSharedList = async (input: {
    name: string
    privacy: SharedListPrivacy
    groupImageFile?: File | null
    bannerImageFile?: File | null
  }) => {
    const title = input.name.trim()
    if (!title) {
      throw new Error('List name is required.')
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
      payload.append('fk_owner_user_id', currentUserId.value)
      created = await pocketbaseStore.pb.collection('shared_list').create<SharedListRecord>(payload)
    } catch (error: any) {
      if (isUnknownFieldError(error) && (input.groupImageFile || input.bannerImageFile)) {
        throw sharedListMediaFieldError()
      }
      throw error
    }

    if (currentUserId.value) {
      await ensureMembership(created.id, currentUserId.value)
    }

    return created
  }

  const updateSharedList = async (listId: string, patch: {
    name?: string
    privacy?: SharedListPrivacy
    groupImageFile?: File | null
    bannerImageFile?: File | null
  }) => {
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
    return await ensureMembership(listId, userId)
  }

  const removeMembership = async (membershipId: string) => {
    return await pocketbaseStore.pb.collection('user_shared_list').delete(membershipId)
  }

  const deleteSharedList = async (listId: string) => {
    return await pocketbaseStore.pb.collection('shared_list').delete(listId)
  }

  const ensureAnimeRecord = async (input: { mediaId: number; title: string; fetchLink?: string }) => {
    const mediaId = Number(input.mediaId || 0)
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      throw new Error('Invalid AniList media id.')
    }

    const existing = await pocketbaseStore.pb.collection('anime').getList<AnimeRecord>(1, 1, {
      filter: `anilist_media_id=${mediaId}`
    })

    const current = existing.items[0]
    if (current) return current

    try {
      return await pocketbaseStore.pb.collection('anime').create<AnimeRecord>({
        anilist_media_id: mediaId,
        aniilist_media_name: input.title.trim() || `AniList #${mediaId}`,
        fetch_link: String(input.fetchLink || '').trim() || `https://anilist.co/anime/${mediaId}`
      })
    } catch (error: any) {
      if (!isUniqueConstraintError(error)) throw error

      const retry = await pocketbaseStore.pb.collection('anime').getList<AnimeRecord>(1, 1, {
        filter: `anilist_media_id=${mediaId}`
      })
      const retried = retry.items[0]
      if (retried) return retried
      throw error
    }
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
    if (!currentUserId.value) {
      throw new Error('You must be logged in to add anime.')
    }

    const animeRecord = await ensureAnimeRecord(input)

    const existingRelation = await pocketbaseStore.pb.collection('anime_shared_list').getList<AnimeSharedListRecord>(1, 1, {
      filter: `fk_shared_list_id="${escapeFilterValue(listId)}" && fk_anime_id="${escapeFilterValue(animeRecord.id)}"`
    })

    if (existingRelation.items[0]) {
      throw new Error('This anime is already in this shared list.')
    }

    const createRelation = async (withStateFields: boolean) => {
      return await pocketbaseStore.pb.collection('anime_shared_list').create<AnimeSharedListRecord>({
        fk_user_id: currentUserId.value,
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
        throw new Error('This anime is already in this shared list.')
      }

      if (isUnknownFieldError(error)) {
        try {
          return await createRelation(false)
        } catch (retryError: any) {
          if (isUniqueConstraintError(retryError)) {
            throw new Error('This anime is already in this shared list.')
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
    const payload: Record<string, any> = {}
    if (patch.status) payload.status = patch.status
    if (typeof patch.progress === 'number') payload.progress = patch.progress
    if (typeof patch.score === 'number') payload.score = patch.score
    try {
      return await pocketbaseStore.pb.collection('anime_shared_list').update<AnimeSharedListRecord>(relationId, payload)
    } catch (error: any) {
      if (isUnknownFieldError(error)) {
        throw new Error('PocketBase anime_shared_list still needs status, progress and score fields.')
      }
      throw error
    }
  }

  const removeAnimeFromList = async (relationId: string) => {
    return await pocketbaseStore.pb.collection('anime_shared_list').delete(relationId)
  }

  const searchUsers = async (query: string, excludeIds: string[] = []) => {
    const needle = query.trim()
    if (needle.length < 2) return []

    const exclusions = Array.from(new Set(excludeIds.filter(Boolean)))
      .map(id => `id != "${escapeFilterValue(id)}"`)
      .join(' && ')
    const textFilter = `anilist_username ~ "${escapeFilterValue(needle)}"`
    const filter = exclusions ? `${textFilter} && ${exclusions}` : textFilter

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
    searchUsers
  }
}

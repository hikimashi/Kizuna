<template>
  <div class="shared-lists-hub">
    <userHeaderTabs :tabs="profileTabs" />

    <main class="page-shell">
      <section class="top-bar">
        <div>
          <h1 class="page-title">Shared Lists</h1>
          <p class="page-subtitle">Create, manage, and join collaborative anime lists.</p>
        </div>

        <div class="top-actions">
          <label class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input v-model.trim="searchTerm" type="text" placeholder="Search a list" />
          </label>

          <button class="btn-new" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            New list
          </button>
        </div>
      </section>

      <section class="filter-row" aria-label="Shared list filters">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="filter-pill"
          :class="{ active: activeFilter === filter.key }"
          type="button"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }} ({{ filter.count }})
        </button>

        <div class="filter-sep"></div>

        <span class="sort-label">Sort by</span>
        <select v-model="sortBy" class="sort-select">
          <option value="recent">Recent</option>
          <option value="title">Name A-Z</option>
          <option value="animeCount">Anime count</option>
          <option value="members">Members</option>
        </select>
      </section>

      <div v-if="isLoading" class="status-card">
        Loading shared lists...
      </div>

      <div v-else-if="loadError" class="status-card error">
        {{ loadError }}
      </div>

      <section v-for="section in sections" v-else :key="section.key" class="list-section">
        <div v-if="section.items.length" class="section-label">{{ section.label }}</div>

        <div v-if="section.items.length" class="cards-grid">
          <article
            v-for="list in section.items"
            :key="list.id"
            class="list-card"
            :class="{ invite: list.kind === 'invite' }"
            role="link"
            tabindex="0"
            @click="openList(list.id)"
            @keydown.enter.prevent="openList(list.id)"
            @keydown.space.prevent="openList(list.id)"
          >
            <div class="card-strip" :style="{ background: list.strip }"></div>
            <div v-if="list.hasUnread" class="unread-dot"></div>
            <div v-if="list.badge" class="card-badge" :class="list.badge.variant">{{ list.badge.label }}</div>

            <div class="card-body">
              <div class="card-visual">
                <div class="card-emoji">{{ list.emoji }}</div>
                <div class="covers-stack" aria-hidden="true">
                  <div
                    v-for="(tone, index) in list.coverTones.slice(0, 3)"
                    :key="`${list.id}-cover-${index}`"
                    class="cover-thumb"
                    :style="{ background: tone }"
                  >
                    <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)" width="14" height="14">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                  <div class="cover-more">+{{ Math.max(list.animeCount - 3, 0) }}</div>
                </div>
              </div>

              <div class="card-info">
                <div class="card-top">
                  <div class="card-title">{{ list.title }}</div>
                  <div class="privacy-chip" :class="privacyChipClass(list.privacy)">
                    <div class="pc-dot"></div>
                    {{ privacyLabel(list.privacy) }}
                  </div>
                </div>

                <div class="card-desc">{{ list.description }}</div>

                <div class="card-meta">
                  <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    {{ list.animeCount }} anime
                  </div>

                  <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
                      <path stroke-linecap="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ list.updatedLabel }}
                  </div>

                  <div class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
                      <path stroke-linecap="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                    </svg>
                    <div class="card-members">
                      <div
                        v-for="(member, index) in list.members.slice(0, 4)"
                        :key="`${list.id}-member-${member.name}`"
                        class="mini-av"
                        :class="{ stacked: index > 0 }"
                        :style="{ background: member.color }"
                      >
                        {{ member.initials }}
                      </div>
                      <span v-if="list.members.length > 4" class="mini-more">+{{ list.members.length - 4 }}</span>
                    </div>
                    {{ list.members.length }} members
                  </div>

                  <div class="meta-item role-chip" :class="roleChipClass(list.role)">{{ roleLabel(list.role) }}</div>
                </div>

                <div v-if="list.kind !== 'invite'" class="card-prog">
                  <div class="prog-labels">
                    <span>{{ list.role === 'owner' ? 'Group progress' : 'Your progress' }}</span>
                    <span>{{ list.progressLabel }}</span>
                  </div>
                  <div class="prog-track">
                    <div
                      v-for="(segment, index) in list.progressSegments"
                      :key="`${list.id}-segment-${index}`"
                      class="prog-fill"
                      :style="{ width: `${segment.width}%`, background: segment.color }"
                    ></div>
                  </div>
                </div>

                <div v-else class="invite-actions">
                  <button class="invite-btn invite-accept" type="button" @click.prevent>Join</button>
                  <button class="invite-btn invite-ignore" type="button" @click.prevent>Ignore</button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <button v-if="!isLoading && !loadError && !visibleLists.length" class="empty-card" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" aria-hidden="true">
          <path stroke-linecap="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <div class="empty-title">No shared list matches your filters.</div>
        <div class="empty-sub">Try another search or create a new collaborative list.</div>
      </button>

      <button v-else-if="!isLoading && !loadError" class="empty-card" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" aria-hidden="true">
          <path stroke-linecap="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <div class="empty-title">Create a new collaborative list</div>
        <div class="empty-sub">Invite friends and build an anime list together.</div>
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, unref } from 'vue'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

definePageMeta({ middleware: ['auth'] })

type Privacy = 'private' | 'friends' | 'public'
type ListRole = 'owner' | 'member' | 'reader'
type ListKind = 'owned' | 'shared' | 'invite'
type FilterKey = 'all' | 'owned' | 'shared' | 'invites'
type SortKey = 'recent' | 'title' | 'animeCount' | 'members'

type SharedListCard = {
  id: string
  title: string
  emoji: string
  description: string
  privacy: Privacy
  role: ListRole
  kind: ListKind
  animeCount: number
  members: { name: string; initials: string; color: string }[]
  updatedLabel: string
  updatedRank: number
  progressLabel: string
  progressSegments: { width: number; color: string }[]
  coverTones: string[]
  strip: string
  hasUnread?: boolean
  badge?: { label: string; variant: 'cyan' | 'purple' }
}

type SharedListRecord = {
  id: string
  name?: string
  privacy_level?: Privacy
  fk_owner_user_id?: string
  created?: string
  updated?: string
}

type UserSharedListRecord = {
  id: string
  fk_user_id?: string | string[]
  fk_shared_list_id?: string
  fk_permission_id?: string
  created?: string
  updated?: string
}

type AnimeSharedListRecord = {
  id: string
  fk_shared_list_id?: string
  created?: string
}

const profileTabs = [
  { key: 'anime-list', label: 'Anime List', to: '/animeList' },
  { key: 'favorites', label: 'Favorites', to: '/favorites' },
  { key: 'friends', label: 'Friends', to: '/friends' },
  { key: 'shared-lists', label: 'Shared Lists', to: '/sharedLists', active: true }
]

const searchTerm = ref('')
const activeFilter = ref<FilterKey>('all')
const sortBy = ref<SortKey>('recent')
const isLoading = ref(true)
const loadError = ref('')
const lists = ref<SharedListCard[]>([])

const pocketbaseStore = usePocketbaseStore()
const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const currentUserId = computed(() => String(authRecord.value.id ?? ''))

const visibleLists = computed(() => {
  const needle = searchTerm.value.toLowerCase()
  const filtered = lists.value.filter((list) => {
    if (activeFilter.value === 'owned' && list.kind !== 'owned') return false
    if (activeFilter.value === 'shared' && list.kind !== 'shared') return false
    if (activeFilter.value === 'invites' && list.kind !== 'invite') return false
    if (!needle) return true
    return `${list.title} ${list.description}`.toLowerCase().includes(needle)
  })

  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title)
    if (sortBy.value === 'animeCount') return b.animeCount - a.animeCount
    if (sortBy.value === 'members') return b.members.length - a.members.length
    return a.updatedRank - b.updatedRank
  })
})

const sections = computed(() => [
  { key: 'owned', label: 'My lists', items: visibleLists.value.filter((list) => list.kind === 'owned') },
  { key: 'shared', label: 'Shared with me', items: visibleLists.value.filter((list) => list.kind === 'shared' || list.kind === 'invite') }
])

const filters = computed(() => [
  { key: 'all' as FilterKey, label: 'All', count: lists.value.length },
  { key: 'owned' as FilterKey, label: 'My lists', count: lists.value.filter((list) => list.kind === 'owned').length },
  { key: 'shared' as FilterKey, label: 'Shared with me', count: lists.value.filter((list) => list.kind === 'shared').length },
  { key: 'invites' as FilterKey, label: 'Invites', count: lists.value.filter((list) => list.kind === 'invite').length }
])

const normalizeRelationValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] || '' : String(value || '')

const initialsFromValue = (value: string) => {
  const cleaned = value.replace(/[^a-z0-9]/gi, '').toUpperCase()
  return cleaned.slice(0, 2) || 'SL'
}

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

const stripForPrivacy = (privacy: Privacy, owned: boolean) => {
  if (privacy === 'private') return 'linear-gradient(90deg,#9256F3,#F779A4)'
  if (privacy === 'public') return 'linear-gradient(90deg,#4361EE,#4CC9F0)'
  return owned ? 'linear-gradient(90deg,#3db4f2,#1dd3b0)' : 'linear-gradient(90deg,#F77F00,#FFBE0B)'
}

const roleFromMembership = (record: UserSharedListRecord | undefined, ownerId: string): ListRole => {
  if (ownerId === currentUserId.value) return 'owner'
  if (!record) return 'reader'
  return record.fk_permission_id ? 'member' : 'reader'
}

const loadSharedLists = async () => {
  if (!currentUserId.value) {
    lists.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const [sharedListRecords, membershipRecords] = await Promise.all([
      pocketbaseStore.pb.collection('shared_list').getFullList<SharedListRecord>({ sort: '-updated' }),
      pocketbaseStore.pb.collection('user_shared_list').getFullList<UserSharedListRecord>({ sort: '-updated' })
    ])

    const membershipByList = new Map<string, UserSharedListRecord[]>()
    for (const membership of membershipRecords) {
      const listId = normalizeRelationValue(membership.fk_shared_list_id)
      if (!listId) continue
      const current = membershipByList.get(listId) ?? []
      current.push(membership)
      membershipByList.set(listId, current)
    }

    const allowedLists = sharedListRecords.filter((record) => {
      const ownerId = normalizeRelationValue(record.fk_owner_user_id)
      return ownerId === currentUserId.value || membershipByList.has(record.id)
    })

    const ids = allowedLists.map((record) => `"${record.id}"`)
    const animeRecords = ids.length
      ? await pocketbaseStore.pb.collection('anime_shared_list').getFullList<AnimeSharedListRecord>({
          filter: ids.map((id) => `fk_shared_list_id=${id}`).join(' || '),
          sort: '-created'
        })
      : []

    const animeByList = new Map<string, AnimeSharedListRecord[]>()
    for (const animeRecord of animeRecords) {
      const listId = normalizeRelationValue(animeRecord.fk_shared_list_id)
      if (!listId) continue
      const current = animeByList.get(listId) ?? []
      current.push(animeRecord)
      animeByList.set(listId, current)
    }

    lists.value = allowedLists.map((record) => {
      const ownerId = normalizeRelationValue(record.fk_owner_user_id)
      const memberships = membershipByList.get(record.id) ?? []
      const animeCount = (animeByList.get(record.id) ?? []).length
      const ownMembership = memberships.find((membership) => normalizeRelationValue(membership.fk_user_id) === currentUserId.value)
      const role = roleFromMembership(ownMembership, ownerId)
      const kind: ListKind = ownerId === currentUserId.value ? 'owned' : 'shared'
      const memberIds = Array.from(new Set([ownerId, ...memberships.map((membership) => normalizeRelationValue(membership.fk_user_id))].filter(Boolean)))
      const members = memberIds.map((memberId) => ({
        name: memberId === currentUserId.value ? 'You' : `User ${memberId.slice(0, 4)}`,
        initials: memberId === currentUserId.value ? 'YO' : initialsFromValue(memberId),
        color: memberId === currentUserId.value ? '#3db4f2' : memberColor(memberId)
      }))

      const progressSegments = members.slice(0, Math.max(1, Math.min(members.length, 4))).map((member, index, array) => ({
        width: Number((100 / array.length).toFixed(2)),
        color: member.color
      }))

      return {
        id: record.id,
        title: record.name || 'Untitled shared list',
        emoji: (record.name || 'SL').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'SL',
        description: `${animeCount || 0} anime shared with ${Math.max(memberIds.length - 1, 0)} other member${memberIds.length > 2 ? 's' : ''}.`,
        privacy: (record.privacy_level || 'friends') as Privacy,
        role,
        kind,
        animeCount,
        members,
        updatedLabel: formatRelativeDate(record.updated),
        updatedRank: record.updated ? -new Date(record.updated).getTime() : 0,
        progressLabel: animeCount ? `0 / ${animeCount} watched` : '0 anime',
        progressSegments,
        coverTones: [memberColor(`${record.id}-1`), memberColor(`${record.id}-2`), memberColor(`${record.id}-3`)],
        strip: stripForPrivacy((record.privacy_level || 'friends') as Privacy, kind === 'owned')
      } satisfies SharedListCard
    })
  } catch (error: any) {
    loadError.value = error?.message || 'Unable to load shared lists from PocketBase.'
    lists.value = []
  } finally {
    isLoading.value = false
  }
}

const openList = (id: string) => navigateTo(`/sharedLists/${id}`)

const privacyLabel = (privacy: Privacy) => privacy === 'private' ? 'Private' : privacy === 'friends' ? 'Friends Only' : 'Public'
const roleLabel = (role: ListRole) => role === 'owner' ? 'Owner' : role === 'reader' ? 'Reader' : 'Member'
const privacyChipClass = (privacy: Privacy) => ({ 'pc-private': privacy === 'private', 'pc-friends': privacy === 'friends', 'pc-public': privacy === 'public' })
const roleChipClass = (role: ListRole) => ({ owner: role === 'owner', member: role === 'member', reader: role === 'reader' })

onMounted(loadSharedLists)
</script>

<style scoped>
.shared-lists-hub { min-height: 100vh; color: var(--kz-text-primary); }
.page-shell { width: min(100%, 980px); margin: 0 auto; padding: 28px 24px 80px; display: flex; flex-direction: column; gap: 18px; }
.top-bar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: var(--kz-text-primary); }
.page-subtitle { margin: 6px 0 0; font-size: 12px; color: var(--kz-text-secondary); }
.top-actions { display: flex; align-items: center; gap: 8px; }
.search-box { display: flex; align-items: center; gap: 7px; width: 220px; padding: 7px 11px; border-radius: 6px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-dim); transition: border-color .15s ease; }
.search-box:focus-within { border-color: rgba(61,180,242,.35); }
.search-box input { width: 100%; border: 0; background: transparent; outline: none; font-size: 12px; color: var(--kz-text-primary); font-family: 'Overpass', sans-serif; }
.search-box input::placeholder { color: var(--kz-text-dim); }
.btn-new { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 14px; border-radius: 6px; border: 1px solid rgba(61,180,242,.3); background: var(--kz-soft-accent-bg); color: var(--kz-accent); font-size: 12px; font-weight: 700; font-family: 'Overpass', sans-serif; cursor: pointer; transition: background .15s ease; }
.btn-new:hover { background: var(--kz-soft-accent-bg-hover); }
.filter-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.filter-pill { min-height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-dim); font-size: 11px; font-weight: 700; font-family: 'Overpass', sans-serif; cursor: pointer; transition: border-color .12s ease,color .12s ease,background .12s ease; }
.filter-pill:hover { border-color: var(--kz-hover-border); color: var(--kz-text-secondary); }
.filter-pill.active { background: var(--kz-soft-accent-bg); border-color: rgba(61,180,242,.3); color: var(--kz-accent); }
.filter-sep { flex: 1; }
.sort-label { font-size: 11px; color: var(--kz-text-dim); }
.sort-select { min-height: 30px; padding: 0 28px 0 10px; border-radius: 5px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-secondary); font-size: 11px; font-family: 'Overpass', sans-serif; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234a6480' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px; }
.list-section { display: flex; flex-direction: column; gap: 12px; }
.section-label { font-size: 10px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: var(--kz-text-dim); }
.cards-grid { display: grid; gap: 14px; }
.status-card { padding: 16px 18px; border-radius: 10px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-secondary); font-size: 12px; }
.status-card.error { color: #f87171; border-color: rgba(248,113,113,.25); background: rgba(248,113,113,.05); }
.list-card { position: relative; display: block; overflow: hidden; border-radius: 10px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: inherit; text-decoration: none; transition: border-color .15s ease,transform .15s ease,box-shadow .15s ease; }
.list-card:hover { transform: translateY(-1px); border-color: rgba(61,180,242,.25); box-shadow: 0 6px 24px rgba(0,0,0,.3); }
.list-card.invite { border-style: dashed; border-color: rgba(251,191,36,.2); background: rgba(251,191,36,.03); }
.card-strip { width: 100%; height: 4px; }
.card-body { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; }
.card-visual { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.card-emoji { min-width: 36px; font-size: 11px; font-weight: 900; letter-spacing: .12em; color: var(--kz-text-secondary); text-align: center; }
.covers-stack { position: relative; width: 72px; height: 44px; }
.cover-thumb { position: absolute; width: 32px; height: 44px; border-radius: 4px; border: 1.5px solid #0b1622; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cover-thumb:nth-child(1) { left: 0; z-index: 3; }
.cover-thumb:nth-child(2) { left: 18px; z-index: 2; opacity: .85; }
.cover-thumb:nth-child(3) { left: 36px; z-index: 1; opacity: .6; }
.cover-more { position: absolute; right: -2px; bottom: -2px; padding: 1px 4px; border-radius: 3px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-dim); font-size: 8px; font-weight: 700; font-family: 'Overpass Mono', monospace; z-index: 4; }
.card-info { flex: 1; min-width: 0; }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.card-title { font-size: 15px; font-weight: 800; color: var(--kz-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.privacy-chip { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; min-height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid transparent; font-size: 9px; font-weight: 700; }
.pc-dot { width: 5px; height: 5px; border-radius: 999px; background: currentColor; }
.pc-private { background: rgba(248,113,113,.1); border-color: rgba(248,113,113,.2); color: #f87171; }
.pc-friends { background: rgba(251,191,36,.1); border-color: rgba(251,191,36,.2); color: #fbbf24; }
.pc-public { background: rgba(74,222,128,.1); border-color: rgba(74,222,128,.2); color: #4ade80; }
.card-desc { margin-bottom: 10px; font-size: 11px; line-height: 1.5; color: var(--kz-text-dim); }
.card-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--kz-text-dim); }
.meta-item svg { color: var(--kz-text-dim); flex-shrink: 0; }
.card-members { display: inline-flex; align-items: center; }
.mini-av { width: 20px; height: 20px; border-radius: 4px; border: 1.5px solid var(--kz-card-bg); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 8px; font-weight: 800; }
.mini-av.stacked { margin-left: -5px; }
.mini-more { margin-left: 4px; color: var(--kz-text-dim); font-size: 8px; font-weight: 700; font-family: 'Overpass Mono', monospace; }
.role-chip { font-weight: 700; }
.role-chip.owner { color: #fbbf24; }
.role-chip.member { color: var(--kz-accent); }
.role-chip.reader { color: var(--kz-text-dim); }
.card-prog { display: flex; flex-direction: column; gap: 3px; }
.prog-labels { display: flex; justify-content: space-between; gap: 12px; font-size: 9px; color: var(--kz-text-dim); }
.prog-track { display: flex; height: 4px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.05); }
.prog-fill { height: 100%; }
.card-badge { position: absolute; top: 12px; right: 12px; min-height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid transparent; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
.card-badge.cyan { background: rgba(61,180,242,.15); border-color: rgba(61,180,242,.25); color: #3db4f2; }
.card-badge.purple { background: rgba(146,86,243,.15); border-color: rgba(146,86,243,.25); color: #9256f3; }
.unread-dot { position: absolute; top: 14px; left: 14px; width: 8px; height: 8px; border-radius: 999px; background: #3db4f2; box-shadow: 0 0 6px rgba(61,180,242,.6); }
.invite-actions { display: flex; gap: 8px; margin-top: 12px; }
.invite-btn { flex: 1; min-height: 32px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: 'Overpass', sans-serif; cursor: pointer; transition: background .12s ease; }
.invite-accept { border: 1px solid rgba(251,191,36,.25); background: rgba(251,191,36,.12); color: #fbbf24; }
.invite-accept:hover { background: rgba(251,191,36,.2); }
.invite-ignore { border: 1px solid var(--kz-border); background: rgba(255,255,255,.04); color: var(--kz-text-dim); }
.invite-ignore:hover { background: rgba(255,255,255,.08); }
.empty-card { width: 100%; padding: 40px 20px; border-radius: 10px; border: 1px dashed rgba(255,255,255,.08); background: var(--kz-card-bg); color: var(--kz-text-dim); display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: border-color .15s ease,color .15s ease; }
.empty-card:hover { border-color: rgba(61,180,242,.25); color: var(--kz-accent); }
.empty-title { font-size: 13px; font-weight: 600; }
.empty-sub { font-size: 11px; color: var(--kz-text-dim); }
[data-theme='winter'] .shared-lists-hub .search-box,[data-theme='winter'] .shared-lists-hub .sort-select,[data-theme='winter'] .shared-lists-hub .filter-pill,[data-theme='winter'] .shared-lists-hub .list-card,[data-theme='winter'] .shared-lists-hub .empty-card { background: rgba(244,249,254,.9); border-color: rgba(23,52,78,.18); }
[data-theme='winter'] .shared-lists-hub .list-card.invite { background: rgba(251,191,36,.08); }
[data-theme='winter'] .shared-lists-hub .search-box,[data-theme='winter'] .shared-lists-hub .filter-pill,[data-theme='winter'] .shared-lists-hub .sort-select,[data-theme='winter'] .shared-lists-hub .meta-item,[data-theme='winter'] .shared-lists-hub .card-desc,[data-theme='winter'] .shared-lists-hub .empty-sub,[data-theme='winter'] .shared-lists-hub .page-subtitle { color: #5a7693; }
[data-theme='winter'] .shared-lists-hub .page-title,[data-theme='winter'] .shared-lists-hub .card-title,[data-theme='winter'] .shared-lists-hub .empty-title { color: #17344e; }
@media (max-width: 840px) { .page-shell { padding-left: 16px; padding-right: 16px; } .top-bar { flex-direction: column; } .top-actions { width: 100%; } .search-box { flex: 1; width: auto; } }
@media (max-width: 640px) { .page-shell { padding: 18px 12px 56px; } .top-actions { flex-direction: column; align-items: stretch; } .btn-new { justify-content: center; } .filter-row { align-items: stretch; } .filter-sep { display: none; } .card-body { flex-direction: column; } .card-visual { flex-direction: row; justify-content: space-between; width: 100%; } .card-top { flex-direction: column; } .invite-actions { flex-direction: column; } }
</style>

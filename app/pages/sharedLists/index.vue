<template>
  <div class="shared-lists-hub">
    <userHeaderTabs :tabs="profileTabs" />

    <main class="page-shell">
      <section class="top-bar">
        <div>
          <h1 class="page-title">Shared Lists</h1>
          <p class="page-subtitle">Create anime lists, add people, and let members leave whenever they want.</p>
        </div>

        <div class="top-actions">
          <label class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input v-model.trim="searchTerm" type="text" placeholder="Search a list" />
          </label>

          <button class="btn-new" type="button" @click="toggleCreatePanel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            New List
          </button>
        </div>
      </section>

      <section v-if="createPanelOpen" class="create-panel">
        <div class="create-head">
          <div>
            <h2>Create a shared list</h2>
            <p>Create the list and add people immediately. Members can leave on their own later.</p>
          </div>
          <button class="icon-close" type="button" aria-label="Close" @click="createPanelOpen = false">×</button>
        </div>

        <div class="create-grid">
          <label class="field">
            <span>Name</span>
            <input v-model.trim="draftName" type="text" maxlength="20" placeholder="Weekend watchlist" />
          </label>

          <label class="field">
            <span>Privacy</span>
            <select v-model="draftPrivacy">
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
        </div>

        <div class="member-picker">
          <label class="field">
            <span>Add users now</span>
            <input
              v-model.trim="draftMemberQuery"
              type="text"
              placeholder="Search username or AniList username"
              @input="handleCreateMemberSearch"
            />
          </label>

          <div v-if="selectedMembers.length" class="selected-members">
            <div
              v-for="member in selectedMembers"
              :key="member.id"
              class="selected-chip"
            >
              <span class="selected-avatar" :style="{ background: member.color }">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                <span v-else>{{ member.initials }}</span>
              </span>
              <span>{{ member.name }}</span>
              <button type="button" class="chip-remove" @click="removeSelectedMember(member.id)">×</button>
            </div>
          </div>

          <div v-if="isSearchingMembers" class="search-note">Searching users...</div>
          <div v-else-if="draftMemberQuery.length >= 2 && !draftMemberResults.length" class="search-note">No matching user found.</div>

          <div v-if="draftMemberResults.length" class="draft-results">
            <button
              v-for="user in draftMemberResults"
              :key="user.id"
              class="draft-result"
              type="button"
              @click="selectMember(user)"
            >
              <span class="selected-avatar" :style="{ background: user.color }">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <span v-else>{{ user.initials }}</span>
              </span>
              <span class="draft-result-name">{{ user.name }}</span>
              <span class="draft-result-action">Add</span>
            </button>
          </div>
        </div>

        <div v-if="actionError" class="status-card error">{{ actionError }}</div>

        <div class="create-actions">
          <button class="btn-secondary" type="button" @click="resetCreateForm">Reset</button>
          <button class="btn-new" type="button" :disabled="isSubmitting || !draftName" @click="handleCreate">
            {{ isSubmitting ? 'Creating...' : 'Create list' }}
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
          >
            <div class="card-strip" :style="{ background: stripForPrivacy(list.privacy, list.isOwner) }"></div>

            <div
              class="card-body"
              role="link"
              tabindex="0"
              @click="openList(list.id)"
              @keydown.enter.prevent="openList(list.id)"
              @keydown.space.prevent="openList(list.id)"
            >
              <div class="card-visual">
                <div class="card-emoji">{{ emojiFromTitle(list.title) }}</div>
                <div class="covers-stack" aria-hidden="true">
                  <div
                    v-for="member in list.members.slice(0, 3)"
                    :key="`${list.id}-${member.id}`"
                    class="cover-thumb"
                    :style="{ background: member.color }"
                  >
                    <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                    <span v-else>{{ member.initials }}</span>
                  </div>
                  <div class="cover-more">+{{ Math.max(list.memberCount - 3, 0) }}</div>
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

                <div class="card-desc">
                  Owned by {{ list.ownerName }}. {{ list.animeCount }} anime currently in the list list.
                </div>

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
                        :key="`${list.id}-member-${member.id}`"
                        class="mini-av"
                        :class="{ stacked: index > 0 }"
                        :style="{ background: member.color }"
                      >
                        <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                        <span v-else>{{ member.initials }}</span>
                      </div>
                      <span v-if="list.memberCount > 4" class="mini-more">+{{ list.memberCount - 4 }}</span>
                    </div>
                    {{ list.memberCount }} members
                  </div>

                  <div class="meta-item role-chip" :class="list.isOwner ? 'owner' : 'member'">
                    {{ list.isOwner ? 'Owner' : 'Member' }}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <button v-if="!isLoading && !loadError && !visibleLists.length" class="empty-card" type="button" @click="toggleCreatePanel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" aria-hidden="true">
          <path stroke-linecap="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <div class="empty-title">No shared lists match your filters.</div>
        <div class="empty-sub">Create a new list or refine your search.</div>
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSharedLists, type SharedListPrivacy, type SharedListSummary } from '~/composables/useSharedLists'

definePageMeta({ middleware: ['auth'] })

type FilterKey = 'all' | 'owned' | 'joined'
type SortKey = 'recent' | 'title' | 'animeCount' | 'members'

const profileTabs = [
  { key: 'anime-list', label: 'Anime List', to: '/animeList' },
  { key: 'favorites', label: 'Favorites', to: '/favorites' },
  { key: 'friends', label: 'Friends', to: '/friends' },
  { key: 'shared-lists', label: 'Shared Lists', to: '/sharedLists', active: true }
]

const {
  loadSummaries,
  createSharedList,
  addMemberToList,
  searchUsers
} = useSharedLists()

const searchTerm = ref('')
const activeFilter = ref<FilterKey>('all')
const sortBy = ref<SortKey>('recent')
const isLoading = ref(true)
const isSubmitting = ref(false)
const loadError = ref('')
const actionError = ref('')
const createPanelOpen = ref(false)
const draftName = ref('')
const draftPrivacy = ref<SharedListPrivacy>('friends')
const draftMemberQuery = ref('')
const isSearchingMembers = ref(false)
const draftMemberResults = ref<Array<{ id: string; name: string; avatar?: string; initials: string; color: string }>>([])
const selectedMembers = ref<Array<{ id: string; name: string; avatar?: string; initials: string; color: string }>>([])
const lists = ref<SharedListSummary[]>([])

const visibleLists = computed(() => {
  const needle = searchTerm.value.toLowerCase()
  const filtered = lists.value.filter((list) => {
    if (activeFilter.value === 'owned' && !list.isOwner) return false
    if (activeFilter.value === 'joined' && list.isOwner) return false
    if (!needle) return true
    return `${list.title} ${list.ownerName}`.toLowerCase().includes(needle)
  })

  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title)
    if (sortBy.value === 'animeCount') return b.animeCount - a.animeCount
    if (sortBy.value === 'members') return b.memberCount - a.memberCount
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  })
})

const sections = computed(() => [
  { key: 'owned', label: 'My lists', items: visibleLists.value.filter(list => list.isOwner) },
  { key: 'joined', label: 'Joined lists', items: visibleLists.value.filter(list => !list.isOwner) }
])

const filters = computed(() => [
  { key: 'all' as FilterKey, label: 'All', count: lists.value.length },
  { key: 'owned' as FilterKey, label: 'My lists', count: lists.value.filter(list => list.isOwner).length },
  { key: 'joined' as FilterKey, label: 'Joined lists', count: lists.value.filter(list => !list.isOwner).length }
])

const stripForPrivacy = (privacy: SharedListPrivacy, owned: boolean) => {
  if (privacy === 'private') return 'linear-gradient(90deg,#9256F3,#F779A4)'
  if (privacy === 'public') return 'linear-gradient(90deg,#4361EE,#4CC9F0)'
  return owned ? 'linear-gradient(90deg,#3db4f2,#1dd3b0)' : 'linear-gradient(90deg,#F77F00,#FFBE0B)'
}

const privacyLabel = (privacy: SharedListPrivacy) => privacy === 'private' ? 'Private' : privacy === 'friends' ? 'Friends Only' : 'Public'
const privacyChipClass = (privacy: SharedListPrivacy) => ({ 'pc-private': privacy === 'private', 'pc-friends': privacy === 'friends', 'pc-public': privacy === 'public' })
const emojiFromTitle = (title: string) => title.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'SL'
const openList = (id: string) => navigateTo(`/sharedLists/${id}`)

const loadPage = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    lists.value = await loadSummaries()
  } catch (error: any) {
    loadError.value = error?.message || 'Unable to load shared lists.'
    lists.value = []
  } finally {
    isLoading.value = false
  }
}

const resetCreateForm = () => {
  draftName.value = ''
  draftPrivacy.value = 'friends'
  draftMemberQuery.value = ''
  draftMemberResults.value = []
  selectedMembers.value = []
  isSearchingMembers.value = false
  actionError.value = ''
}

const toggleCreatePanel = () => {
  createPanelOpen.value = !createPanelOpen.value
  if (!createPanelOpen.value) resetCreateForm()
}

let createSearchTimer: ReturnType<typeof setTimeout> | null = null

const handleCreateMemberSearch = () => {
  if (createSearchTimer) clearTimeout(createSearchTimer)

  if (draftMemberQuery.value.trim().length < 2) {
    draftMemberResults.value = []
    isSearchingMembers.value = false
    return
  }

  createSearchTimer = setTimeout(async () => {
    isSearchingMembers.value = true

    try {
      draftMemberResults.value = await searchUsers(
        draftMemberQuery.value,
        selectedMembers.value.map(member => member.id)
      )
    } catch {
      draftMemberResults.value = []
    } finally {
      isSearchingMembers.value = false
    }
  }, 200)
}

const selectMember = (user: { id: string; name: string; avatar?: string; initials: string; color: string }) => {
  if (selectedMembers.value.some(member => member.id === user.id)) return
  selectedMembers.value.push(user)
  draftMemberQuery.value = ''
  draftMemberResults.value = []
}

const removeSelectedMember = (userId: string) => {
  selectedMembers.value = selectedMembers.value.filter(member => member.id !== userId)
}

const handleCreate = async () => {
  if (!draftName.value) return

  isSubmitting.value = true
  actionError.value = ''

  try {
    const created = await createSharedList({
      name: draftName.value,
      privacy: draftPrivacy.value
    })

    if (selectedMembers.value.length) {
      await Promise.all(selectedMembers.value.map(member => addMemberToList(created.id, member.id)))
    }

    createPanelOpen.value = false
    resetCreateForm()
    await loadPage()
    await navigateTo(`/sharedLists/${created.id}`)
  } catch (error: any) {
    actionError.value = error?.message || 'Unable to create shared list.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadPage)
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
.btn-new, .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 34px; padding: 0 14px; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: 'Overpass', sans-serif; cursor: pointer; transition: background .15s ease,border-color .15s ease,opacity .15s ease; }
.btn-new { border: 1px solid rgba(61,180,242,.3); background: var(--kz-soft-accent-bg); color: var(--kz-accent); }
.btn-new:hover:not(:disabled) { background: var(--kz-soft-accent-bg-hover); }
.btn-secondary { border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-secondary); }
.btn-secondary:hover { border-color: var(--kz-hover-border); }
.btn-new:disabled { opacity: .65; cursor: default; }
.create-panel { border-radius: 10px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.create-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.create-head h2 { margin: 0; font-size: 15px; }
.create-head p { margin: 6px 0 0; font-size: 11px; color: var(--kz-text-dim); }
.icon-close { min-width: 32px; min-height: 32px; border-radius: 8px; border: 1px solid var(--kz-border); background: transparent; color: var(--kz-text-dim); cursor: pointer; }
.create-grid { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(180px,.8fr); gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--kz-text-dim); }
.field input, .field select { min-height: 36px; border-radius: 8px; border: 1px solid var(--kz-border); background: rgba(255,255,255,.02); color: var(--kz-text-primary); padding: 0 12px; font-family: 'Overpass', sans-serif; outline: none; }
.member-picker { display: flex; flex-direction: column; gap: 10px; }
.selected-members { display: flex; flex-wrap: wrap; gap: 8px; }
.selected-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 4px 8px 4px 4px; border-radius: 999px; border: 1px solid var(--kz-border); background: rgba(255,255,255,.03); color: var(--kz-text-secondary); font-size: 11px; }
.selected-avatar { width: 24px; height: 24px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; font-size: 9px; font-weight: 800; flex-shrink: 0; }
.selected-avatar img { width: 100%; height: 100%; object-fit: cover; }
.chip-remove { border: 0; background: transparent; color: var(--kz-text-dim); cursor: pointer; font-size: 14px; line-height: 1; }
.search-note { font-size: 11px; color: var(--kz-text-dim); }
.draft-results { display: grid; gap: 8px; }
.draft-result { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--kz-border); background: rgba(255,255,255,.03); cursor: pointer; color: var(--kz-text-secondary); text-align: left; }
.draft-result-name { flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--kz-text-primary); }
.draft-result-action { font-size: 11px; font-weight: 700; color: var(--kz-accent); }
.create-actions { display: flex; justify-content: flex-end; gap: 10px; }
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
.card-strip { width: 100%; height: 4px; }
.card-body { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; cursor: pointer; outline: none; color: inherit; text-decoration: none; }
.card-body:focus-visible { box-shadow: inset 0 0 0 1px rgba(61,180,242,.35); }
.card-visual { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.card-emoji { min-width: 36px; font-size: 11px; font-weight: 900; letter-spacing: .12em; color: var(--kz-text-secondary); text-align: center; }
.covers-stack { position: relative; width: 72px; height: 44px; }
.cover-thumb { position: absolute; width: 32px; height: 44px; border-radius: 4px; border: 1.5px solid #0b1622; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; font-size: 10px; font-weight: 700; }
.cover-thumb img { width: 100%; height: 100%; object-fit: cover; }
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
.card-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--kz-text-dim); }
.card-members { display: inline-flex; align-items: center; }
.mini-av { width: 20px; height: 20px; border-radius: 4px; border: 1.5px solid var(--kz-card-bg); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 8px; font-weight: 800; overflow: hidden; }
.mini-av img { width: 100%; height: 100%; object-fit: cover; }
.mini-av.stacked { margin-left: -5px; }
.mini-more { margin-left: 4px; color: var(--kz-text-dim); font-size: 8px; font-weight: 700; font-family: 'Overpass Mono', monospace; }
.role-chip.owner { color: #fbbf24; font-weight: 700; }
.role-chip.member { color: var(--kz-accent); font-weight: 700; }
.empty-card { width: 100%; padding: 40px 20px; border-radius: 10px; border: 1px dashed rgba(255,255,255,.08); background: var(--kz-card-bg); color: var(--kz-text-dim); display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: border-color .15s ease,color .15s ease; }
.empty-card:hover { border-color: rgba(61,180,242,.25); color: var(--kz-accent); }
.empty-title { font-size: 13px; font-weight: 600; }
.empty-sub { font-size: 11px; color: var(--kz-text-dim); }
[data-theme='winter'] .shared-lists-hub .search-box,
[data-theme='winter'] .shared-lists-hub .sort-select,
[data-theme='winter'] .shared-lists-hub .filter-pill,
[data-theme='winter'] .shared-lists-hub .list-card,
[data-theme='winter'] .shared-lists-hub .empty-card,
[data-theme='winter'] .shared-lists-hub .create-panel,
[data-theme='winter'] .shared-lists-hub .field input,
[data-theme='winter'] .shared-lists-hub .field select { background: rgba(244,249,254,.9); border-color: rgba(23,52,78,.18); }
[data-theme='winter'] .shared-lists-hub .search-box,
[data-theme='winter'] .shared-lists-hub .filter-pill,
[data-theme='winter'] .shared-lists-hub .sort-select,
[data-theme='winter'] .shared-lists-hub .meta-item,
[data-theme='winter'] .shared-lists-hub .card-desc,
[data-theme='winter'] .shared-lists-hub .empty-sub,
[data-theme='winter'] .shared-lists-hub .page-subtitle,
[data-theme='winter'] .shared-lists-hub .create-head p { color: #5a7693; }
[data-theme='winter'] .shared-lists-hub .page-title,
[data-theme='winter'] .shared-lists-hub .card-title,
[data-theme='winter'] .shared-lists-hub .empty-title,
[data-theme='winter'] .shared-lists-hub .create-head h2 { color: #17344e; }
@media (max-width: 840px) {
  .page-shell { padding-left: 16px; padding-right: 16px; }
  .top-bar { flex-direction: column; }
  .top-actions { width: 100%; }
  .search-box { flex: 1; width: auto; }
  .create-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .page-shell { padding: 18px 12px 56px; }
  .top-actions { flex-direction: column; align-items: stretch; }
  .btn-new { justify-content: center; }
  .filter-row { align-items: stretch; }
  .filter-sep { display: none; }
  .card-body { flex-direction: column; }
  .card-visual { flex-direction: row; justify-content: space-between; width: 100%; }
  .card-top { flex-direction: column; }
  .create-actions { flex-direction: column-reverse; }
}
</style>

<template>
  <div class="shared-lists-hub">
    <userHeaderTabs :tabs="profileTabs" />

    <main class="page-shell">
      <section class="top-bar">
        <div>
          <h1 class="page-title">Listes partagees</h1>
          <p class="page-subtitle">Creez des listes d'animes, choisissez une banniere et une image, puis gerez les membres depuis la liste.</p>
        </div>

        <div class="top-actions">
          <label class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input v-model.trim="searchTerm" type="text" placeholder="Rechercher une liste" />
          </label>

          <button class="btn-new" type="button" @click="toggleCreatePanel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Nouvelle liste
          </button>
        </div>
      </section>

      <section v-if="createPanelOpen" class="create-panel">
        <div class="create-head">
          <div>
            <h2>Creer une liste partagee</h2>
            <p>Creez la liste, definissez son apparence, puis ajoutez des membres immediatement.</p>
          </div>
          <button class="icon-close" type="button" aria-label="Fermer" @click="toggleCreatePanel">x</button>
        </div>

        <div class="create-grid">
          <label class="field">
            <span>Nom</span>
            <input v-model.trim="draftName" type="text" maxlength="20" placeholder="Liste du week-end" />
          </label>

          <label class="field">
            <span>Confidentialite</span>
            <select v-model="draftPrivacy">
              <option value="friends">Amis uniquement</option>
              <option value="private">Privee</option>
              <option value="public">Publique</option>
            </select>
          </label>
        </div>

        <div class="media-grid">
          <label class="media-field">
            <span>Image de la liste</span>
            <div class="media-preview media-preview-square">
              <img v-if="draftGroupImagePreview" :src="draftGroupImagePreview" alt="Apercu de l'image de liste" />
              <img v-else :src="DEFAULT_SHARED_LIST_IMAGE" alt="Image de liste par defaut" />
            </div>
            <input class="media-input" type="file" accept="image/*" @change="handleDraftGroupImageChange" />
            <small>{{ draftGroupImageFile?.name || 'Image unique stockee dans PocketBase.' }}</small>
          </label>

          <label class="media-field">
            <span>Banniere</span>
            <div class="media-preview media-preview-banner" :style="{ background: stripForPrivacy(draftPrivacy, true) }">
              <img v-if="draftBannerPreview" :src="draftBannerPreview" alt="Apercu de la banniere" />
              <span v-else>Apercu de la banniere</span>
            </div>
            <input class="media-input" type="file" accept="image/*" @change="handleDraftBannerChange" />
            <small>{{ draftBannerImageFile?.name || 'Image de banniere large stockee dans PocketBase.' }}</small>
          </label>
        </div>

        <div class="member-picker">
          <label class="field">
            <span>Ajouter des utilisateurs maintenant</span>
            <input
              v-model.trim="draftMemberQuery"
              type="text"
              placeholder="Rechercher un pseudo ou un pseudo AniList"
              @input="handleCreateMemberSearch"
            />
          </label>

          <div v-if="selectedMembers.length" class="selected-members">
            <div
              v-for="member in selectedMembers"
              :key="member.id"
              class="selected-chip"
            >
              <span class="selected-avatar" :class="{ 'has-avatar': !!member.avatar }" :style="memberAvatarStyle(member)">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                <span v-else>{{ member.initials }}</span>
              </span>
              <span>{{ member.name }}</span>
              <button type="button" class="chip-remove" @click="removeSelectedMember(member.id)">x</button>
            </div>
          </div>

          <div v-if="isSearchingMembers" class="search-note">Recherche des utilisateurs...</div>
          <div v-else-if="draftMemberQuery.length >= 2 && !draftMemberResults.length" class="search-note">Aucun utilisateur correspondant.</div>

          <div v-if="draftMemberResults.length" class="draft-results">
            <button
              v-for="user in draftMemberResults"
              :key="user.id"
              class="draft-result"
              type="button"
              @click="selectMember(user)"
            >
              <span class="selected-avatar" :class="{ 'has-avatar': !!user.avatar }" :style="memberAvatarStyle(user)">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <span v-else>{{ user.initials }}</span>
              </span>
              <span class="draft-result-name">{{ user.name }}</span>
              <span class="draft-result-action">Ajouter</span>
            </button>
          </div>
        </div>

        <div v-if="actionError" class="status-card error">{{ actionError }}</div>

        <div class="create-actions">
          <button class="btn-secondary" type="button" @click="resetCreateForm">Reinitialiser</button>
          <button class="btn-new" type="button" :disabled="isSubmitting || !draftName" @click="handleCreate">
            {{ isSubmitting ? 'Creation...' : 'Creer la liste' }}
          </button>
        </div>
      </section>

      <section class="filter-row" aria-label="Filtres des listes partagees">
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

        <span class="sort-label">Trier par</span>
        <select v-model="sortBy" class="sort-select">
          <option value="recent">Recentes</option>
          <option value="title">Nom A-Z</option>
          <option value="animeCount">Nombre d'animes</option>
          <option value="members">Membres</option>
        </select>
      </section>

      <div v-if="isLoading" class="status-card">
        Chargement des listes partagees...
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
            <div class="card-banner" :style="{ background: stripForPrivacy(list.privacy, list.isOwner) }">
              <img :src="bannerSrcFor(list)" :alt="`Banniere ${list.title}`" />
              <div class="card-banner-overlay"></div>
              <div class="card-banner-top">
                <div class="privacy-chip" :class="privacyChipClass(list.privacy)">
                  <div class="pc-dot"></div>
                  {{ privacyLabel(list.privacy) }}
                </div>
                <div class="role-chip" :class="list.isOwner ? 'owner' : 'member'">
                  {{ list.isOwner ? 'Proprietaire' : 'Membre' }}
                </div>
              </div>
            </div>

            <div
              class="card-body"
              role="link"
              tabindex="0"
              @click="openList(list.id)"
              @keydown.enter.prevent="openList(list.id)"
              @keydown.space.prevent="openList(list.id)"
            >
              <div class="group-thumb">
                <img :src="imageSrcFor(list)" :alt="list.title" />
              </div>

              <div class="card-info">
                <div class="card-top">
                  <div class="card-title-wrap">
                    <div class="card-title">{{ list.title }}</div>
                    <div class="card-created">Creee {{ formatDateLabel(list.createdAt) }}</div>
                  </div>
                </div>

                <div class="card-desc">
                  Propriete de {{ list.ownerName }}. {{ list.animeCount }} anime actuellement dans la liste partagee.
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

                  <div class="meta-item members-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
                      <path stroke-linecap="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                    </svg>
                    <div class="card-members">
                      <div
                        v-for="(member, index) in list.members.slice(0, 4)"
                        :key="`${list.id}-member-${member.id}`"
                        class="mini-av"
                        :class="{ stacked: index > 0, 'has-avatar': !!member.avatar }"
                        :style="memberAvatarStyle(member)"
                      >
                        <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                        <span v-else>{{ member.initials }}</span>
                      </div>
                      <span v-if="list.memberCount > 4" class="mini-more">+{{ list.memberCount - 4 }}</span>
                    </div>
                    {{ list.memberCount }} membres
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
        <div class="empty-title">Aucune liste partagee ne correspond a vos filtres.</div>
        <div class="empty-sub">Creez une nouvelle liste ou affinez votre recherche.</div>
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSharedLists, type SharedListMember, type SharedListPrivacy, type SharedListSummary } from '~/composables/useSharedLists'

definePageMeta({ middleware: ['auth'] })

type FilterKey = 'all' | 'owned' | 'joined'
type SortKey = 'recent' | 'title' | 'animeCount' | 'members'
type SearchableUser = { id: string; name: string; avatar?: string; initials: string; color: string }

const profileTabs = [
  { key: 'anime-list', label: 'Liste anime', to: '/animeList' },
  { key: 'favorites', label: 'Favoris', to: '/favorites' },
  { key: 'friends', label: 'Amis', to: '/friends' },
  { key: 'shared-lists', label: 'Listes partagees', to: '/sharedLists', active: true }
]

const {
  currentUserId,
  formatDateLabel,
  loadSummaries,
  createSharedList,
  addMemberToList,
  searchUsers
} = useSharedLists()

const searchTerm = ref('')
const route = useRoute()
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
const draftMemberResults = ref<SearchableUser[]>([])
const selectedMembers = ref<SearchableUser[]>([])
const draftGroupImageFile = ref<File | null>(null)
const draftBannerImageFile = ref<File | null>(null)
const draftGroupImagePreview = ref('')
const draftBannerPreview = ref('')
const lists = ref<SharedListSummary[]>([])

const revokePreviewUrl = (value: string) => {
  if (value.startsWith('blob:')) URL.revokeObjectURL(value)
}

const setPreview = (target: typeof draftGroupImagePreview, file: File | null) => {
  revokePreviewUrl(target.value)
  target.value = file ? URL.createObjectURL(file) : ''
}

const memberAvatarStyle = (member: Pick<SharedListMember, 'avatar' | 'color'> | SearchableUser) =>
  member.avatar ? undefined : { background: member.color }

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
  { key: 'owned', label: 'Mes listes', items: visibleLists.value.filter(list => list.isOwner) },
  { key: 'joined', label: 'Listes rejointes', items: visibleLists.value.filter(list => !list.isOwner) }
])

const filters = computed(() => [
  { key: 'all' as FilterKey, label: 'Toutes', count: lists.value.length },
  { key: 'owned' as FilterKey, label: 'Mes listes', count: lists.value.filter(list => list.isOwner).length },
  { key: 'joined' as FilterKey, label: 'Listes rejointes', count: lists.value.filter(list => !list.isOwner).length }
])

const stripForPrivacy = (privacy: SharedListPrivacy, owned: boolean) => {
  if (privacy === 'private') return 'linear-gradient(135deg,#7f1d1d,#be185d)'
  if (privacy === 'public') return 'linear-gradient(135deg,#2563eb,#22d3ee)'
  return owned ? 'linear-gradient(135deg,#3db4f2,#1dd3b0)' : 'linear-gradient(135deg,#f77f00,#ffbe0b)'
}

const privacyLabel = (privacy: SharedListPrivacy) => privacy === 'private' ? 'Privee' : privacy === 'friends' ? 'Amis uniquement' : 'Publique'
const privacyChipClass = (privacy: SharedListPrivacy) => ({ 'pc-private': privacy === 'private', 'pc-friends': privacy === 'friends', 'pc-public': privacy === 'public' })
const emojiFromTitle = (title: string) => title.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3) || 'SL'
const openList = (id: string) => navigateTo(`/sharedLists/${id}`)
const DEFAULT_SHARED_LIST_BANNER = '/img/banner.webp'
const DEFAULT_SHARED_LIST_IMAGE = '/img/user.webp'

const bannerSrcFor = (list: SharedListSummary) => String(list.bannerUrl || '').trim() || DEFAULT_SHARED_LIST_BANNER
const imageSrcFor = (list: SharedListSummary) => String(list.imageUrl || '').trim() || DEFAULT_SHARED_LIST_IMAGE

const loadPage = async () => {
  if (!currentUserId.value) {
    lists.value = []
    loadError.value = ''
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    lists.value = await loadSummaries()
  } catch (error: any) {
    loadError.value = error?.message || 'Impossible de charger les listes partagees.'
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
  draftGroupImageFile.value = null
  draftBannerImageFile.value = null
  setPreview(draftGroupImagePreview, null)
  setPreview(draftBannerPreview, null)
  isSearchingMembers.value = false
  actionError.value = ''
}

const toggleCreatePanel = () => {
  createPanelOpen.value = !createPanelOpen.value
  if (!createPanelOpen.value) resetCreateForm()
}

const openCreatePanelFromRoute = () => {
  const wantsCreate = route.query.create === '1'
  if (!wantsCreate) return
  createPanelOpen.value = true
  if (typeof route.query.name === 'string' && route.query.name.trim()) {
    draftName.value = route.query.name.trim().slice(0, 20)
  }
}

const handleDraftGroupImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null
  draftGroupImageFile.value = file
  setPreview(draftGroupImagePreview, file)
}

const handleDraftBannerChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null
  draftBannerImageFile.value = file
  setPreview(draftBannerPreview, file)
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

const selectMember = (user: SearchableUser) => {
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
      privacy: draftPrivacy.value,
      groupImageFile: draftGroupImageFile.value,
      bannerImageFile: draftBannerImageFile.value
    })

    if (selectedMembers.value.length) {
      await Promise.all(selectedMembers.value.map(member => addMemberToList(created.id, member.id)))
    }

    createPanelOpen.value = false
    resetCreateForm()
    await loadPage()
    await navigateTo(`/sharedLists/${created.id}`)
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de creer la liste partagee.'
  } finally {
    isSubmitting.value = false
  }
}

watch(currentUserId, () => {
  loadPage()
}, { immediate: true })

watch(() => route.query, () => {
  openCreatePanelFromRoute()
}, { immediate: true })

onBeforeUnmount(() => {
  revokePreviewUrl(draftGroupImagePreview.value)
  revokePreviewUrl(draftBannerPreview.value)
})
</script>

<style scoped>
.shared-lists-hub { min-height: 100vh; color: var(--kz-text-primary); }
.page-shell { width: min(100%, 1080px); margin: 0 auto; padding: 28px 24px 80px; display: flex; flex-direction: column; gap: 18px; }
.top-bar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; font-size: 20px; font-weight: 800; color: var(--kz-text-primary); }
.page-subtitle { margin: 6px 0 0; font-size: 12px; color: var(--kz-text-secondary); max-width: 620px; }
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

.create-panel { border-radius: 14px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); padding: 18px; display: flex; flex-direction: column; gap: 16px; }
.create-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.create-head h2 { margin: 0; font-size: 15px; }
.create-head p { margin: 6px 0 0; font-size: 11px; color: var(--kz-text-dim); }
.icon-close { min-width: 32px; min-height: 32px; border-radius: 8px; border: 1px solid var(--kz-border); background: transparent; color: var(--kz-text-dim); cursor: pointer; }
.create-grid { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(180px,.8fr); gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--kz-text-dim); }
.field input, .field select { min-height: 36px; border-radius: 8px; border: 1px solid var(--kz-border); background: rgba(255,255,255,.02); color: var(--kz-text-primary); padding: 0 12px; font-family: 'Overpass', sans-serif; outline: none; }

.media-grid { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; }
.media-field { display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: var(--kz-text-dim); }
.media-preview { position: relative; overflow: hidden; border-radius: 12px; border: 1px solid var(--kz-border); background: rgba(255,255,255,.03); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.88); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.media-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-preview-square { width: 100%; aspect-ratio: 1 / 1; }
.media-preview-banner { min-height: 140px; }
.media-input { width: 100%; border-radius: 8px; border: 1px dashed var(--kz-border); background: rgba(255,255,255,.02); padding: 10px; color: var(--kz-text-secondary); font-family: 'Overpass', sans-serif; }
.media-field small { color: var(--kz-text-dim); }

.member-picker { display: flex; flex-direction: column; gap: 10px; }
.selected-members { display: flex; flex-wrap: wrap; gap: 8px; }
.selected-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 4px 8px 4px 4px; border-radius: 999px; border: 1px solid var(--kz-border); background: rgba(255,255,255,.03); color: var(--kz-text-secondary); font-size: 11px; }
.selected-avatar { width: 24px; height: 24px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; font-size: 9px; font-weight: 800; flex-shrink: 0; }
.selected-avatar.has-avatar { background: transparent !important; color: var(--kz-text-primary); }
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
.cards-grid { display: grid; gap: 16px; }
.status-card { padding: 16px 18px; border-radius: 10px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: var(--kz-text-secondary); font-size: 12px; }
.status-card.error { color: #f87171; border-color: rgba(248,113,113,.25); background: rgba(248,113,113,.05); }

.list-card { overflow: hidden; border-radius: 14px; border: 1px solid var(--kz-border); background: var(--kz-card-bg); color: inherit; text-decoration: none; transition: border-color .15s ease,transform .15s ease,box-shadow .15s ease; }
.list-card:hover { transform: translateY(-1px); border-color: rgba(61,180,242,.25); box-shadow: 0 10px 30px rgba(0,0,0,.22); }
.card-banner { position: relative; min-height: 132px; }
.card-banner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.card-banner-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,22,34,.08), rgba(11,22,34,.72)); }
.card-banner-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px; }
.card-body { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px 18px; cursor: pointer; outline: none; color: inherit; text-decoration: none; margin-top: -34px; position: relative; z-index: 2; }
.card-body:focus-visible { box-shadow: inset 0 0 0 1px rgba(61,180,242,.35); }
.group-thumb { width: 84px; height: 84px; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); display: inline-flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 10px 24px rgba(0,0,0,.25); background: rgba(255,255,255,.06); }
.group-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-info { flex: 1; min-width: 0; }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.card-title-wrap { min-width: 0; }
.card-title { font-size: 17px; font-weight: 800; color: var(--kz-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-created { margin-top: 4px; font-size: 11px; color: var(--kz-text-dim); }
.privacy-chip, .role-chip { display: inline-flex; align-items: center; gap: 4px; min-height: 24px; padding: 0 10px; border-radius: 999px; border: 1px solid transparent; font-size: 10px; font-weight: 700; backdrop-filter: blur(8px); }
.pc-dot { width: 5px; height: 5px; border-radius: 999px; background: currentColor; }
.pc-private { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.2); color: #fecaca; }
.pc-friends { background: rgba(251,191,36,.12); border-color: rgba(251,191,36,.22); color: #fde68a; }
.pc-public { background: rgba(74,222,128,.12); border-color: rgba(74,222,128,.22); color: #bbf7d0; }
.role-chip.owner { background: rgba(255,255,255,.12); color: #fff; }
.role-chip.member { background: rgba(255,255,255,.08); color: rgba(255,255,255,.84); }
.card-desc { margin-bottom: 12px; font-size: 12px; line-height: 1.6; color: var(--kz-text-dim); }
.card-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--kz-text-dim); }
.members-meta { display: inline-flex; align-items: center; gap: 6px; }
.card-members { display: inline-flex; align-items: center; }
.mini-av { width: 22px; height: 22px; border-radius: 999px; border: 2px solid var(--kz-card-bg); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 8px; font-weight: 800; overflow: hidden; }
.mini-av.has-avatar { background: transparent !important; }
.mini-av img { width: 100%; height: 100%; object-fit: cover; }
.mini-av.stacked { margin-left: -7px; }
.mini-more { margin-left: 4px; color: var(--kz-text-dim); font-size: 8px; font-weight: 700; font-family: 'Overpass Mono', monospace; }

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
[data-theme='winter'] .shared-lists-hub .field select,
[data-theme='winter'] .shared-lists-hub .media-input,
[data-theme='winter'] .shared-lists-hub .media-preview,
[data-theme='winter'] .shared-lists-hub .draft-result { background: rgba(244,249,254,.9); border-color: rgba(23,52,78,.18); }
[data-theme='winter'] .shared-lists-hub .search-box,
[data-theme='winter'] .shared-lists-hub .filter-pill,
[data-theme='winter'] .shared-lists-hub .sort-select,
[data-theme='winter'] .shared-lists-hub .meta-item,
[data-theme='winter'] .shared-lists-hub .card-desc,
[data-theme='winter'] .shared-lists-hub .empty-sub,
[data-theme='winter'] .shared-lists-hub .page-subtitle,
[data-theme='winter'] .shared-lists-hub .create-head p,
[data-theme='winter'] .shared-lists-hub .card-created,
[data-theme='winter'] .shared-lists-hub .media-field small { color: #5a7693; }
[data-theme='winter'] .shared-lists-hub .page-title,
[data-theme='winter'] .shared-lists-hub .card-title,
[data-theme='winter'] .shared-lists-hub .empty-title,
[data-theme='winter'] .shared-lists-hub .create-head h2,
[data-theme='winter'] .shared-lists-hub .draft-result-name { color: #17344e; }
[data-theme='winter'] .shared-lists-hub .mini-av { border-color: rgba(244,249,254,.9); }

@media (max-width: 980px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .top-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1 1 220px;
    width: auto;
  }

  .filter-row {
    gap: 8px;
  }

  .filter-sep {
    display: none;
  }
}

@media (max-width: 840px) {
  .page-shell { padding-left: 16px; padding-right: 16px; }
  .top-bar { flex-direction: column; }
  .top-actions { width: 100%; }
  .search-box { flex: 1; width: auto; }
  .create-grid, .media-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .page-shell { padding: 18px 12px 56px; }
  .top-bar { text-align: center; align-items: center; }
  .page-title { font-size: 18px; }
  .page-subtitle { margin-left: auto; margin-right: auto; max-width: 34ch; }
  .top-actions { flex-direction: column; align-items: stretch; }
  .search-box { width: min(100%, 420px); margin: 0 auto; }
  .filter-row { justify-content: center; }
  .btn-new { justify-content: center; }
  .filter-row { align-items: stretch; }
  .filter-sep { display: none; }
  .cards-grid { justify-items: center; }
  .list-card { width: min(100%, 360px); }
  .card-body { flex-direction: column; margin-top: -26px; }
  .card-info { text-align: center; }
  .card-top { flex-direction: column; }
  .card-meta { justify-content: center; }
  .members-meta,
  .card-members { justify-content: center; }
  .create-actions { flex-direction: column-reverse; }
  .group-thumb { width: 72px; height: 72px; }
}

@media (max-width: 480px) {
  .card-banner {
    min-height: 116px;
  }

  .group-thumb {
    width: 64px;
    height: 64px;
  }

  .card-body {
    padding: 14px;
  }

  .card-title {
    font-size: 15px;
  }

  .card-desc {
    font-size: 11px;
  }
}
</style>

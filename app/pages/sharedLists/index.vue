<template>
  <div class="shared-lists-hub">
    <userHeaderTabs :tabs="profileTabs" />

    <main class="page-shell">
      <section class="top-bar">
        <div>
          <h1 class="page-title">Listes partagées</h1>
          <p class="page-subtitle">Créez des listes d'animes, choisissez une bannière et une image, puis gérez les membres depuis la liste.</p>
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
            <h2>Créer une liste partagée</h2>
            <p>Créez la liste, définissez son apparence, puis ajoutez des membres immédiatement.</p>
          </div>
          <button class="icon-close" type="button" aria-label="Fermer" @click="toggleCreatePanel">x</button>
        </div>

        <div class="create-grid">
          <label class="field">
            <span>Nom</span>
            <input v-model.trim="draftName" type="text" maxlength="20" placeholder="Liste du week-end" />
          </label>

          <label class="field">
            <span>Confidentialité</span>
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
              <img v-if="draftGroupImagePreview" :src="draftGroupImagePreview" alt="Aperçu de l'image de liste" />
              <img v-else :src="DEFAULT_SHARED_LIST_IMAGE" alt="Image de liste par défaut" />
            </div>
            <input class="media-input" type="file" accept="image/*" @change="handleDraftGroupImageChange" />
            <small>{{ draftGroupImageFile?.name || 'Image unique stockee dans PocketBase.' }}</small>
          </label>

          <label class="media-field">
            <span>Bannière</span>
            <div class="media-preview media-preview-banner" :style="{ background: stripForPrivacy(draftPrivacy, true) }">
              <img v-if="draftBannerPreview" :src="draftBannerPreview" alt="Aperçu de la bannière" />
              <span v-else>Aperçu de la bannière</span>
            </div>
            <input class="media-input" type="file" accept="image/*" @change="handleDraftBannerChange" />
            <small>{{ draftBannerImageFile?.name || 'Image de bannière large stockée dans PocketBase.' }}</small>
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
            {{ isSubmitting ? 'Creation...' : 'Créer la liste' }}
          </button>
        </div>
      </section>

      <section class="filter-row" aria-label="Filtres des listes partagées">
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
          <option value="recent">Récentes</option>
          <option value="title">Nom A-Z</option>
          <option value="animeCount">Nombre d'animes</option>
          <option value="members">Membres</option>
        </select>
      </section>

      <div v-if="isLoading" class="status-card">
        Chargement des listes partagées...
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
              <img :src="bannerSrcFor(list)" :alt="`Bannière ${list.title}`" />
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
                    <div class="card-created">Créée {{ formatDateLabel(list.createdAt) }}</div>
                  </div>
                </div>

                <div class="card-desc">
                  Propriété de {{ list.ownerName }}. {{ list.animeCount }} anime actuellement dans la liste partagée.
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
        <div class="empty-title">Aucune liste partagée ne correspond à vos filtres.</div>
        <div class="empty-sub">Créez une nouvelle liste ou affinez votre recherche.</div>
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSharedLists, type SharedListMember, type SharedListPrivacy, type SharedListSummary } from '~/composables/useSharedLists'

type FilterKey = 'all' | 'owned' | 'joined'
type SortKey = 'recent' | 'title' | 'animeCount' | 'members'
type SearchableUser = { id: string; name: string; avatar?: string; initials: string; color: string }

const profileTabs = [
  { key: 'anime-list', label: 'Liste anime', to: '/animeList' },
  { key: 'favorites', label: 'Favoris', to: '/favorites' },
  { key: 'friends', label: 'Amis', to: '/friends' },
  { key: 'shared-lists', label: 'Listes partagées', to: '/sharedLists', active: true }
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
  // Les previews locales créent des object URLs; il faut les libérer à chaque remplacement.
  if (value.startsWith('blob:')) URL.revokeObjectURL(value)
}

const setPreview = (target: typeof draftGroupImagePreview, file: File | null) => {
  // Centralise l'ancien nettoyage avant de poser une nouvelle image de preview.
  revokePreviewUrl(target.value)
  target.value = file ? URL.createObjectURL(file) : ''
}

const memberAvatarStyle = (member: Pick<SharedListMember, 'avatar' | 'color'> | SearchableUser) =>
  member.avatar ? undefined : { background: member.color }

const visibleLists = computed(() => {
  const needle = searchTerm.value.toLowerCase()
  const filtered = lists.value.filter((list) => {
    // Les filtres de role s'appliquent avant la recherche texte.
    if (activeFilter.value === 'owned' && !list.isOwner) return false
    if (activeFilter.value === 'joined' && list.isOwner) return false
    if (!needle) return true
    return `${list.title} ${list.ownerName}`.toLowerCase().includes(needle)
  })

  return [...filtered].sort((a, b) => {
    // On trie une copie pour ne jamais reordonner la source PocketBase.
    if (sortBy.value === 'title') return a.title.localeCompare(b.title)
    if (sortBy.value === 'animeCount') return b.animeCount - a.animeCount
    if (sortBy.value === 'members') return b.memberCount - a.memberCount
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  })
})

const sections = computed(() => [
  // Deux sections fixes gardent la lecture claire même après recherche ou tri.
  { key: 'owned', label: 'Mes listes', items: visibleLists.value.filter(list => list.isOwner) },
  { key: 'joined', label: 'Listes rejointes', items: visibleLists.value.filter(list => !list.isOwner) }
])

const filters = computed(() => [
  // Les compteurs utilisent la liste complete pour ne pas changer quand la recherche est active.
  { key: 'all' as FilterKey, label: 'Toutes', count: lists.value.length },
  { key: 'owned' as FilterKey, label: 'Mes listes', count: lists.value.filter(list => list.isOwner).length },
  { key: 'joined' as FilterKey, label: 'Listes rejointes', count: lists.value.filter(list => !list.isOwner).length }
])

const stripForPrivacy = (privacy: SharedListPrivacy, owned: boolean) => {
  // Fallback visuel quand aucune bannière n'est encore stockée sur PocketBase.
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
    // Sans session PocketBase, on vide la page pour éviter d'afficher des données obsolètes.
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
    loadError.value = error?.message || 'Impossible de charger les listes partagées.'
    lists.value = []
  } finally {
    isLoading.value = false
  }
}

const resetCreateForm = () => {
  // Remet tous les champs de creation, y compris les previews de fichiers.
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
  // Fermer le panneau annule un brouillon incomplet.
  if (!createPanelOpen.value) resetCreateForm()
}

const handleDraftGroupImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null
  // Le fichier reste en mémoire jusqu'à la soumission FormData.
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

  // Debounce + seuil minimal pour éviter des requêtes PocketBase à chaque frappe.
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
  // Évite les doublons si l'utilisateur clique deux fois sur le même résultat.
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
    // Creation en deux temps: liste d'abord, memberships ensuite car ils dependent de l'id liste.
    const created = await createSharedList({
      name: draftName.value,
      privacy: draftPrivacy.value,
      groupImageFile: draftGroupImageFile.value,
      bannerImageFile: draftBannerImageFile.value
    })

    if (selectedMembers.value.length) {
      // Les ajouts de membres sont indépendants une fois la liste créée.
      await Promise.all(selectedMembers.value.map(member => addMemberToList(created.id, member.id)))
    }

    createPanelOpen.value = false
    resetCreateForm()
    await loadPage()
    await navigateTo(`/sharedLists/${created.id}`)
  } catch (error: any) {
    actionError.value = error?.message || 'Impossible de créer la liste partagée.'
  } finally {
    isSubmitting.value = false
  }
}

watch(currentUserId, () => {
  // Recharge la page quand la session change, y compris à l'initialisation.
  loadPage()
}, { immediate: true })

onBeforeUnmount(() => {
  // Nettoyage final des previews blob encore actives.
  revokePreviewUrl(draftGroupImagePreview.value)
  revokePreviewUrl(draftBannerPreview.value)
})
</script>

<style scoped src="~/assets/css/pages/sharedListsIndex.css"></style>

<template>
  <div class="friends-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="page">
      <div class="top-bar rounded-2xl border border-[var(--kz-border)] bg-[var(--kz-card-bg)] px-4 py-4 shadow-xl backdrop-blur-sm">
        <div class="page-title">Amis</div>
        <label class="search-box shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model.trim="searchText" type="text" placeholder="Rechercher des suivis mutuels..." />
        </label>
      </div>

      <div v-if="filteredFriends.length" class="user-grid">
        <article v-for="user in filteredFriends" :key="user.id" class="user-card shadow-lg">
          <div class="card-banner">
            <img v-if="user.banner" :src="user.banner" alt="" class="card-banner-img" />
          </div>
          <div class="card-avatar-wrap">
            <div class="card-avatar">
              <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" width="22" height="22">
                <circle cx="12" cy="8.5" r="4" />
                <path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          </div>
          <div class="card-body">
            <div class="card-name">{{ user.username }}</div>
            <div class="card-meta">Inscrit {{ user.joined }}</div>
            <div class="card-stats">
              <div class="card-stat"><span class="card-stat-num">{{ user.animeCount }}</span><span class="card-stat-lbl">Anime</span></div>
              <div class="card-stat"><span class="card-stat-num">{{ user.score.toFixed(1) }}</span><span class="card-stat-lbl">Note</span></div>
            </div>
            <div class="card-actions">
              <button class="btn-view-profile shadow-sm" type="button" @click="openFriendProfile(user.id)">
                Voir le profil
              </button>
              <button
                class="btn-follow following shadow-sm"
                type="button"
                :disabled="isFollowBusy(user.id)"
                @click="toggleFollow(user.id)"
              >
                {{ isFollowBusy(user.id) ? 'Mise à jour...' : 'Suivi' }}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty rounded-2xl border border-[var(--kz-border)] bg-[var(--kz-card-bg)] shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="38" height="38">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div class="empty-title">{{ isLoading ? 'Chargement' : 'Aucun suivi mutuel trouvé' }}</div>
        <p class="empty-sub">{{ noResultText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnilistSocialStore } from '~/composables/useAnilistSocialStore'

definePageMeta({ middleware: ['auth'] })

const socialStore = useAnilistSocialStore()
const { isLoading, loadError, friendUsers, followPendingIds } = storeToRefs(socialStore)
const searchText = ref('')

const profileTabs = [
  { key: 'anime-list', label: "Liste d'animes", to: '/animeList' },
  { key: 'favorites', label: 'Favoris', to: '/favorites' },
  { key: 'friends', label: 'Amis', to: '/friends', active: true },
  { key: 'shared-lists', label: 'Listes partagées', to: '/sharedLists' }
]

const filteredFriends = computed(() => {
  const mutuals = friendUsers.value.filter(user => user.isFollower && user.following)
  const query = searchText.value.toLowerCase()
  if (!query) return mutuals
  return mutuals.filter(user => user.username.toLowerCase().includes(query))
})

const isFollowBusy = (id: number) => followPendingIds.value.includes(id)

const toggleFollow = async (id: number) => {
  try {
    await socialStore.toggleFollowUser(id)
  } catch (error) {
    console.error('[friends] toggle follow failed', error)
  }
}

const noResultText = computed(() => {
  if (isLoading.value) return 'Chargement des amis AniList...'
  if (loadError.value) return loadError.value
  return 'Les suivis mutuels de votre compte AniList apparaissent ici.'
})

const openFriendProfile = (friendId: number) => {
  const id = Number(friendId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/social/user/${id}`)
}

onMounted(async () => {
  await socialStore.loadSocial()
})
</script>

<style scoped src="~/assets/css/pages/friends.css"></style>

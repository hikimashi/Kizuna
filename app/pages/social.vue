<template>
  <div class="social-page">
    <div class="page">
      <aside class="sidebar shadow-xl backdrop-blur-sm">
        <div class="sidebar-heading">Social</div>
        <button class="sidebar-link shadow-sm" :class="{ active: activeTab === 'followed' }" @click="activeTab = 'followed'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          Suivis
          <span class="sidebar-count">{{ followedCount }}</span>
        </button>
        <button class="sidebar-link shadow-sm" :class="{ active: activeTab === 'followers' }" @click="activeTab = 'followers'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
          Abonnés
          <span class="sidebar-count">{{ followersCount }}</span>
        </button>
        <button class="sidebar-link shadow-sm" :class="{ active: activeTab === 'friends' }" @click="activeTab = 'friends'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          Amis
          <span class="sidebar-count">{{ friendsCount }}</span>
        </button>
      </aside>

      <main class="main">
        <div class="top-bar">
          <div class="page-title">{{ activeLabel }}</div>
          <div class="search-box shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model.trim="searchText" type="text" placeholder="Rechercher des utilisateurs..." />
          </div>
        </div>

        <div v-if="filteredUsers.length" class="user-grid">
          <article v-for="user in filteredUsers" :key="user.id" class="user-card shadow-lg">
            <div class="card-banner">
              <img v-if="user.banner" :src="user.banner" alt="" class="card-banner-img" />
            </div>
            <div class="card-avatar-wrap">
              <div class="card-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" width="22" height="22"><circle cx="12" cy="8.5" r="4"/><path stroke-linecap="round" d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7"/></svg>
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
                  class="btn-follow shadow-sm"
                  :class="{ following: user.following }"
                  :disabled="isFollowBusy(user.id)"
                  @click="toggleFollow(user.id)"
                >
                  {{ isFollowBusy(user.id) ? 'Mise à jour...' : user.following ? 'Suivi' : 'Suivre' }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty rounded-2xl border border-[var(--kz-border)] bg-[var(--kz-card-bg)] shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="38" height="38"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <div class="empty-title">{{ isLoading ? 'Chargement' : 'Aucun utilisateur trouvé' }}</div>
          <p class="empty-sub">{{ noResultText }}</p>
          <button
            v-if="!isLoading && !loadError"
            class="empty-action"
            type="button"
            @click="openUserSearch"
          >
            Rechercher des utilisateurs
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnilistSocialStore } from '~/composables/useAnilistSocialStore'

type SocialTab = 'followed' | 'followers' | 'friends'

const activeTab = ref<SocialTab>('followed')
const searchText = ref('')
const socialStore = useAnilistSocialStore()
const { isLoading, loadError, followingUsers, followerUsers, friendUsers, followPendingIds } = storeToRefs(socialStore)

const followedCount = computed(() => followingUsers.value.length)
const followersCount = computed(() => followerUsers.value.length)
const friendsCount = computed(() => friendUsers.value.length)
const activeLabel = computed(() => activeTab.value === 'followed' ? 'Suivis' : activeTab.value === 'followers' ? 'Abonnés' : 'Amis')

const filteredUsers = computed(() => {
  const source =
    activeTab.value === 'followed'
      ? followingUsers.value
      : activeTab.value === 'followers'
        ? followerUsers.value
        : friendUsers.value

  const query = searchText.value.toLowerCase()
  if (!query) return source
  return source.filter(user => user.username.toLowerCase().includes(query))
})

const isFollowBusy = (id: number) => followPendingIds.value.includes(id)

const toggleFollow = async (id: number) => {
  try {
    await socialStore.toggleFollowUser(id)
  } catch (error) {
    console.error('[social] toggle follow failed', error)
  }
}

const noResultText = computed(() => {
  if (isLoading.value) return 'Chargement des utilisateurs AniList...'
  if (loadError.value) return loadError.value
  return 'Essayez une autre recherche ou changez de catégorie sociale.'
})

const openFriendProfile = (friendId: number) => {
  const id = Number(friendId)
  if (!Number.isFinite(id) || id <= 0) return
  navigateTo(`/social/user/${id}`)
}

const openUserSearch = () => {
  window.dispatchEvent(new CustomEvent('kizuna:open-search-users'))
}

onMounted(async () => {
  await socialStore.loadSocial()
})
</script>

<style scoped src="~/assets/css/pages/social.css"></style>

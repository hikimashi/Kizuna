<template>
  <div class="friends-page">
    <userHeaderTabs :tabs="profileTabs" />

    <div class="page">
      <div class="top-bar">
        <div class="page-title">Friends</div>
        <label class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model.trim="searchText" type="text" placeholder="Search mutuals..." />
        </label>
      </div>

      <div v-if="filteredFriends.length" class="user-grid">
        <article v-for="user in filteredFriends" :key="user.id" class="user-card">
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
            <div class="card-meta">Joined {{ user.joined }}</div>
            <div class="card-stats">
              <div class="card-stat"><span class="card-stat-num">{{ user.animeCount }}</span><span class="card-stat-lbl">Anime</span></div>
              <div class="card-stat"><span class="card-stat-num">{{ user.score.toFixed(1) }}</span><span class="card-stat-lbl">Score</span></div>
            </div>
            <div class="card-actions">
              <button class="btn-view-profile" type="button" @click="openFriendProfile(user.id)">
                View profile
              </button>
              <button class="btn-follow following" type="button" @click="toggleFollow(user.id)">
                Following
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="38" height="38">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div class="empty-title">{{ isLoading ? 'Loading' : 'No mutual follows found' }}</div>
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
const { isLoading, loadError, followingUsers, followerUsers, friendUsers } = storeToRefs(socialStore)
const searchText = ref('')

const profileTabs = [
  { key: 'anime-list', label: 'Anime List', to: '/animeList' },
  { key: 'favorites', label: 'Favorites', to: '/favorites' },
  { key: 'friends', label: 'Friends', to: '/friends', active: true },
  { key: 'shared-lists', label: 'Shared Lists', to: '/sharedLists' }
]

const filteredFriends = computed(() => {
  const mutuals = friendUsers.value.filter(user => user.isFollower && user.following)
  const query = searchText.value.toLowerCase()
  if (!query) return mutuals
  return mutuals.filter(user => user.username.toLowerCase().includes(query))
})

const toggleFollow = (id: number) => {
  const current =
    followingUsers.value.find(user => user.id === id)
    || followerUsers.value.find(user => user.id === id)
    || friendUsers.value.find(user => user.id === id)

  if (!current) return
  const nextFollowing = !current.following

  followingUsers.value = nextFollowing
    ? (() => {
      const fromFollower = followerUsers.value.find(user => user.id === id)
      const base = fromFollower || current
      const nextUser = { ...base, following: true, isFriend: Boolean(base.isFollower) }
      const exists = followingUsers.value.some(user => user.id === id)
      return exists
        ? followingUsers.value.map(user => user.id === id ? nextUser : user)
        : [nextUser, ...followingUsers.value]
    })()
    : followingUsers.value.filter(user => user.id !== id)

  followerUsers.value = followerUsers.value.map((user) => {
    if (user.id !== id) return user
    return { ...user, following: nextFollowing, isFriend: Boolean(user.isFollower && nextFollowing) }
  })

  friendUsers.value = (() => {
    const all = [...followingUsers.value, ...followerUsers.value]
    const map = new Map<number, typeof all[number]>()
    for (const user of all) {
      if (user.isFollower && user.following) map.set(user.id, { ...user, isFriend: true })
    }
    return Array.from(map.values())
  })()
}

const noResultText = computed(() => {
  if (isLoading.value) return 'Loading AniList friends...'
  if (loadError.value) return loadError.value
  return 'Mutual follows from your AniList account appear here.'
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

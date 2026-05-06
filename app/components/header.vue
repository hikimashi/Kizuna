<template>
  <header
    ref="headerRef"
    class="kizuna-navbar"
    :class="{ 'is-logged-in': showFullNav, 'is-compact-nav': !showFullNav }"
  >
    <div class="navbar-content">
      <!-- Gauche : logo -->
      <div class="navbar-start">
        <NuxtLink to="/" class="logo-link" @click="handleLogoClick">
          <img src="/img/logo.webp" alt="Kizuna" class="logo-image" />
          <span class="logo-text" :class="{ 'logo-text-hidden': isLoggedIn }">Kizuna</span>
        </NuxtLink>
      </div>

      <nav v-if="showFullNav" class="nav-links" aria-label="Navigation principale">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: route.path === item.to }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Droite : contenu selon l'authentification -->
      <div class="navbar-end">
        <!-- Etat visiteur -->
        <template v-if="!isLoggedIn">
          <button @click="openLoginDrawer" class="btn-ghost">
            Connexion
          </button>
          <button @click="handleSignUp" class="btn-primary">
            Inscription
          </button>
        </template>

        <!-- Connecte mais AniList non lie -->
        <template v-else-if="showPendingLinkState">
          <div class="nav-actions">
            <div class="dropdown dropdown-bottom dropdown-end">
              <div tabindex="0" role="button" class="avatar-btn">
                <img
                  :src="avatarUrl"
                  alt="Avatar utilisateur"
                  class="avatar-image"
                />
              </div>
              <ul class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                <li>
                  <NuxtLink class="justify-between" to="/settings">
                    Paramètres
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                      stroke="currentColor" class="size-5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.214 1.281c.062.374.312.686.644.87.074.04.148.083.221.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.004.827c-.293.24-.438.613-.43.991a8.66 8.66 0 0 1 0 .256c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a9.21 9.21 0 0 1-.221.128c-.332.183-.582.495-.644.869l-.214 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.397-1.11-.94l-.214-1.281a1.125 1.125 0 0 0-.644-.869 9.21 9.21 0 0 1-.221-.128c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49L2.758 15.81a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.293-.24.438-.612.43-.99a8.66 8.66 0 0 1 0-.256c.008-.378-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.147-.086.221-.127.332-.184.582-.496.644-.87l.214-1.281Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                    </svg>
                  </NuxtLink>
                </li>
                <li @click="handleLogout()">
                  <a class="justify-between" href="/">Déconnexion
                    <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Authentifie avec AniList lie -->
        <template v-else>
          <div class="nav-actions">
            <!-- Icône de recherche -->
            <button class="icon-btn" type="button" aria-label="Ouvrir la recherche" @click="openSearchModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>

            <!-- Cloche des notifications -->
            <NuxtLink
              class="icon-btn notification-btn"
              :class="{ active: route.path === '/notifications' }"
              to="/notifications"
              aria-label="Ouvrir les notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span v-if="unreadCount > 0" class="notification-badge">
                {{ unreadBadgeLabel }}
              </span>
            </NuxtLink>

            <!-- Avatar -->
            <div class="dropdown dropdown-bottom dropdown-end">
              <div tabindex="0" role="button" class="avatar-btn">
                <img 
                  :src="avatarUrl" 
                  alt="Avatar utilisateur" 
                  class="avatar-image"
                />
              </div>
              <ul class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                <li>
                  <NuxtLink class="justify-between" to="/settings">
                    Paramètres
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                      stroke="currentColor" class="size-5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.214 1.281c.062.374.312.686.644.87.074.04.148.083.221.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.004.827c-.293.24-.438.613-.43.991a8.66 8.66 0 0 1 0 .256c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a9.21 9.21 0 0 1-.221.128c-.332.183-.582.495-.644.869l-.214 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.397-1.11-.94l-.214-1.281a1.125 1.125 0 0 0-.644-.869 9.21 9.21 0 0 1-.221-.128c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49L2.758 15.81a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.293-.24.438-.612.43-.99a8.66 8.66 0 0 1 0-.256c.008-.378-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.147-.086.221-.127.332-.184.582-.496.644-.87l.214-1.281Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                    </svg>
                  </NuxtLink>
                </li>
                <li @click="handleLogout()">
                  <a class="justify-between" href="/">Déconnexion
                    <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Bascule de thème (toujours visible) -->
        <label
          v-if="!showFullNav"
          class="swap-rotate swap theme-toggle"
          :class="{ 'theme-toggle-before-avatar': showPendingLinkState }"
        >
          <input 
            type="checkbox" 
            :checked="themeStore.activeTheme === 'winter'" 
            @change="themeStore.changeTheme()" 
          />

          <!-- Icône soleil -->
          <svg class="swap-off w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Z" />
          </svg>

          <!-- Icône lune -->
          <svg class="swap-on w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>

        <button
          v-if="showFullNav"
          class="mobile-menu-btn"
          type="button"
          :aria-expanded="isMobileMenuOpen"
          :aria-label="isMobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'"
          aria-controls="mobile-nav-panel"
          @click="toggleMobileMenu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 12h16" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 17h16" />
          </svg>
        </button>
      </div>
    </div>

    <transition name="mobile-nav">
      <nav
        v-if="showFullNav && isMobileMenuOpen"
        id="mobile-nav-panel"
        class="mobile-nav-panel"
        aria-label="Navigation mobile"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="`mobile-${item.to}`"
          :to="item.to"
          class="mobile-nav-link"
          :class="{ active: route.path === item.to }"
          @click="closeMobileMenu"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </transition>

        <Teleport to="body">
      <div
        v-if="isSearchModalOpen"
        class="search-modal-layer"
        @click.self="closeSearchModal"
      >
        <div class="search-modal-shell" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
          <div class="search-modal-head">
            <div class="search-modal-title-block">
              <p class="search-modal-kicker">Recherche</p>
              <h2 id="search-modal-title">Animes et utilisateurs</h2>
            </div>
            <button class="search-modal-close" type="button" aria-label="Fermer la recherche" @click="closeSearchModal">
              X
            </button>
          </div>

          <label class="search-modal-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref="searchInputRef"
              v-model.trim="searchModalQuery"
              type="text"
              placeholder="Rechercher un anime ou un utilisateur AniList"
              @input="handleGlobalSearch"
            >
          </label>

          <div class="search-modal-tabs">
            <button
              class="search-modal-tab"
              :class="{ active: searchModalTab === 'anime' }"
              type="button"
              @click="searchModalTab = 'anime'"
            >
              Anime
            </button>
            <button
              class="search-modal-tab"
              :class="{ active: searchModalTab === 'users' }"
              type="button"
              @click="searchModalTab = 'users'"
            >
              Utilisateurs
            </button>
          </div>

          <div v-if="isSearchLoading" class="search-modal-state">
            Recherche en cours sur AniList...
          </div>
          <div v-else-if="searchModalError" class="search-modal-state search-modal-error">
            {{ searchModalError }}
          </div>
          <div v-else-if="searchModalQuery.length < 2" class="search-modal-state">
            Saisissez au moins 2 caractères pour rechercher sur AniList.
          </div>
          <div v-else-if="activeSearchResults.length === 0" class="search-modal-state">
            Aucun résultat.
          </div>
          <div v-else class="search-modal-results">
            <button
              v-for="item in activeSearchResults"
              :key="item.key"
              class="search-modal-result"
              type="button"
              @click="openSearchResult(item)"
            >
              <div class="search-modal-result-cover" :class="{ 'is-user': item.type === 'user' }">
                <img v-if="item.image" :src="item.image" :alt="item.title">
                <div v-else class="search-modal-result-fallback">
                  {{ item.fallback }}
                </div>
              </div>
              <div class="search-modal-result-copy">
                <div class="search-modal-result-title">{{ item.title }}</div>
                <div class="search-modal-result-subtitle">{{ item.subtitle }}</div>
                <div v-if="item.meta" class="search-modal-result-meta">{{ item.meta }}</div>
              </div>
              <div class="search-modal-result-tag" :class="item.type === 'anime' ? 'is-anime' : 'is-user'">
                {{ item.type === 'anime' ? 'Anime' : 'Utilisateur' }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useThemeStore } from '~/composables/useThemeStore'
import { useDrawersStore } from '~/composables/useDrawersStore'
import { useMyAuthStore } from '~/composables/useMyAuthStore'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistNotificationsStore } from '~/composables/useAnilistNotificationsStore'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

const themeStore = useThemeStore()
const drawerStore = useDrawersStore()
const authStore = useMyAuthStore()
const anilistGraphql = useAnilistGraphql()
const notificationStore = useAnilistNotificationsStore()
const pocketbaseStore = usePocketbaseStore()
const route = useRoute()
const { unreadCount } = storeToRefs(notificationStore)
const authRecord = computed(() => unref(pocketbaseStore.authRecord) as any)
const isLoggedIn = computed(() => Boolean(authRecord.value?.id))
const isAniListLinked = computed(() => Boolean(authRecord.value?.anilist_user_id && authRecord.value?.anilist_token))
const showPendingLinkState = computed(() => isLoggedIn.value && !isAniListLinked.value)
const showFullNav = computed(() => isLoggedIn.value && isAniListLinked.value)
const headerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isMobileMenuOpen = ref(false)
const isSearchModalOpen = ref(false)
const searchModalQuery = ref('')
const searchModalError = ref('')
const isSearchLoading = ref(false)
const searchModalTab = ref<'anime' | 'users'>('anime')
const animeSearchResults = ref<Array<{
  key: string
  type: 'anime'
  id: number
  title: string
  subtitle: string
  meta: string
  image?: string
  fallback: string
}>>([])
const userSearchResults = ref<Array<{
  key: string
  type: 'user'
  id: number
  title: string
  subtitle: string
  meta: string
  image?: string
  fallback: string
}>>([])
let searchModalTimer: ReturnType<typeof setTimeout> | null = null
const navItems = [
  { label: 'Accueil', to: '/' },
  { label: 'Profil', to: '/profilePage' },
  { label: 'Social', to: '/social' },
  { label: "Liste d'animes", to: '/animeList' },
  { label: 'Explorer', to: '/browse' }
] as const

const activeSearchResults = computed(() =>
  searchModalTab.value === 'anime' ? animeSearchResults.value : userSearchResults.value
)
const unreadBadgeLabel = computed(() => unreadCount.value > 99 ? '99+' : String(unreadCount.value))

// Utilise l'avatar AniList s'il est disponible.
const avatarUrl = computed(() => {
  return authRecord.value?.anilist_avatar_url_large || authRecord.value?.anilist_avatar_url_medium || '/img/user.webp'
})

const openLoginDrawer = () => {
  drawerStore.openDrawer('drawerLogin')
}

const openSearchModal = async () => {
  isSearchModalOpen.value = true
  closeMobileMenu()
  await nextTick()
  searchInputRef.value?.focus()
}

const closeSearchModal = () => {
  isSearchModalOpen.value = false
  searchModalQuery.value = ''
  searchModalError.value = ''
  isSearchLoading.value = false
  animeSearchResults.value = []
  userSearchResults.value = []
  if (searchModalTimer) {
    clearTimeout(searchModalTimer)
    searchModalTimer = null
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleLogoClick = (event: MouseEvent) => {
  closeMobileMenu()

  if (route.path !== '/') return

  event.preventDefault()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSignUp = () => {
  drawerStore.openDrawer('drawerCreateUser')
}

const handleLogout = async () => {
  await authStore.logout()
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleOutsideClick = (event: MouseEvent) => {
  if (!isMobileMenuOpen.value) return

  const target = event.target as Node | null

  if (!target || headerRef.value?.contains(target)) return

  closeMobileMenu()
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && isSearchModalOpen.value && !isSearchLoading.value && activeSearchResults.value.length) {
    const firstResult = activeSearchResults.value[0]
    const target = event.target as HTMLElement | null
    const tagName = target?.tagName ?? ''

    if (firstResult && tagName !== 'BUTTON') {
      event.preventDefault()
      openSearchResult(firstResult)
    }
    return
  }

  if (event.key === 'Escape') {
    if (isSearchModalOpen.value) {
      closeSearchModal()
      return
    }
    closeMobileMenu()
  }
}

const makeFallback = (value: string, type: 'anime' | 'user') => {
  const clean = value.trim()
  if (!clean) return type === 'anime' ? 'AN' : 'US'
  return clean.slice(0, 2).toUpperCase()
}

const globalSearchQuery = `
query ($search: String) {
  anime: Page(page: 1, perPage: 6) {
    media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
      id
      episodes
      format
      status
      seasonYear
      averageScore
      genres
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
  users: Page(page: 1, perPage: 6) {
    users(search: $search) {
      id
      name
      avatar {
        medium
        large
      }
      statistics {
        anime {
          count
          meanScore
        }
      }
    }
  }
}
`

const handleGlobalSearch = () => {
  if (searchModalTimer) clearTimeout(searchModalTimer)

  if (searchModalQuery.value.trim().length < 2) {
    animeSearchResults.value = []
    userSearchResults.value = []
    searchModalError.value = ''
    isSearchLoading.value = false
    return
  }

  searchModalTimer = setTimeout(async () => {
    isSearchLoading.value = true
    searchModalError.value = ''

    try {
      const response = await anilistGraphql.request<any>(
        globalSearchQuery,
        { search: searchModalQuery.value.trim() },
        { cacheTtlMs: 30_000 }
      )

      if (Array.isArray(response?.errors) && response.errors.length) {
        throw new Error(response.errors.map((error: any) => String(error?.message || '')).filter(Boolean).join(' | '))
      }

      const animeItems = Array.isArray(response?.data?.anime?.media) ? response.data.anime.media : []
      const userItems = Array.isArray(response?.data?.users?.users) ? response.data.users.users : []

      animeSearchResults.value = animeItems.map((item: any) => {
        const title = String(item?.title?.romaji || item?.title?.english || item?.title?.native || 'Anime inconnu')
        return {
          key: `anime:${item?.id}`,
          type: 'anime' as const,
          id: Number(item?.id || 0),
          title,
          subtitle: [item?.format, item?.seasonYear].filter(Boolean).join(' - ') || 'Résultat anime',
          meta: [item?.status, item?.episodes ? `${item.episodes} eps` : ''].filter(Boolean).join(' - '),
          image: String(item?.coverImage?.large || item?.coverImage?.medium || '') || undefined,
          fallback: makeFallback(title, 'anime')
        }
      }).filter((item: { id: number }) => item.id > 0)

      userSearchResults.value = userItems.map((item: any) => {
        const title = String(item?.name || 'Utilisateur inconnu')
        const animeCount = Number(item?.statistics?.anime?.count || 0)
        const meanScore = Number(item?.statistics?.anime?.meanScore || 0)
        return {
          key: `user:${item?.id}`,
          type: 'user' as const,
          id: Number(item?.id || 0),
          title,
          subtitle: `AniList #${Number(item?.id || 0) || '-'}`,
          meta: `${animeCount} anime${meanScore ? ` - note ${meanScore}` : ''}`,
          image: String(item?.avatar?.large || item?.avatar?.medium || '') || undefined,
          fallback: makeFallback(title, 'user')
        }
      }).filter((item: { id: number }) => item.id > 0)
    } catch (error: any) {
      animeSearchResults.value = []
      userSearchResults.value = []
      searchModalError.value = error?.message || 'Impossible de rechercher sur AniList pour le moment.'
    } finally {
      isSearchLoading.value = false
    }
  }, 220)
}

const openSearchResult = (item: { type: 'anime' | 'user'; id: number }) => {
  closeSearchModal()
  if (item.type === 'anime') {
    navigateTo(`/anime/${item.id}`)
    return
  }
  navigateTo(`/social/user/${item.id}`)
}

watch(() => route.fullPath, closeMobileMenu)
watch(() => route.fullPath, () => {
  if (isSearchModalOpen.value) {
    closeSearchModal()
  }
})
watch(showFullNav, (value) => {
  if (value) {
    notificationStore.loadUnreadCount(true)
    return
  }

  if (!value) {
    notificationStore.reset()
    closeMobileMenu()
    closeSearchModal()
  }
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleEscapeKey)
  if (showFullNav.value) {
    notificationStore.loadUnreadCount()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleEscapeKey)
  if (searchModalTimer) clearTimeout(searchModalTimer)
})
</script>

<style scoped>
/* Variables CSS */
.kizuna-navbar {
  --navy: var(--kz-page-navy);
  --navy-overlay: var(--kz-surface-overlay);
  --cyan: var(--kz-accent);
  --text-primary: var(--kz-text-primary);
  --text-secondary: var(--kz-text-secondary);
  --border: var(--kz-border);
  --hover-fill: var(--kz-hover-fill);
  --hover-border: var(--kz-hover-border);
  --card-bg: var(--kz-card-bg);
  --font-main: 'Overpass', sans-serif;
}

/* Base */
.kizuna-navbar {
  position: relative;
  height: 64px;
  width: 100%;
  background-color: var(--navy-overlay);
  border-bottom: 1px solid var(--border);
  z-index: 80;
  isolation: isolate;
  font-family: var(--font-main);
}

.navbar-content {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 clamp(12px, 2.5vw, 28px);
  margin: 0;
}

.kizuna-navbar.is-compact-nav .navbar-content {
  grid-template-columns: auto 1fr auto;
}

/* Logo */
.navbar-start {
  display: flex;
  align-items: center;
  justify-self: start;
  min-width: 0;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-image {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.logo-text {
  font-size: 23px;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-text-hidden {
  display: none;
}

/* Fin de la barre */
.navbar-end {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 16px;
  margin-left: 0;
  min-width: 0;
  flex-shrink: 0;
}

/* Boutons visiteur */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  height: 40px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-ghost:hover {
  background: var(--hover-fill);
  border-color: var(--hover-border);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan);
  color: var(--navy);
  border: none;
  height: 40px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(61, 180, 242, 0.3);
}

/* Liens de navigation */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  grid-column: 2;
  justify-self: center;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 9px 13px;
  font-size: 16px;
  line-height: 1.2;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--cyan);
  font-weight: 600;
}

/* Actions de navigation */
.nav-actions {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s, transform 0.2s;
}

.icon-btn.active {
  color: var(--cyan);
}

.icon-btn:hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

/* Cloche des notifications */
.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  border-radius: 999px;
  border: 2px solid var(--navy);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

/* Bouton avatar */
.avatar-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.avatar-btn:hover {
  transform: translateY(-1px);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

/* Bascule de thème */
.theme-toggle {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-left: 9px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}

.theme-toggle:hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

.theme-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.theme-toggle-before-avatar {
  order: -1;
  margin-left: 0;
  margin-right: 9px;
}

.theme-toggle svg {
  grid-area: 1 / 1;
  width: 22px;
  height: 22px;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.theme-toggle input:not(:checked) ~ .swap-off,
.theme-toggle input:checked ~ .swap-on {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-toggle input:not(:checked) ~ .swap-on,
.theme-toggle input:checked ~ .swap-off {
  opacity: 0;
  transform: rotate(-45deg) scale(0.72);
  pointer-events: none;
}

/* Menu deroulant */
.dropdown-content {
  position: absolute;
  z-index: 90 !important;
  background: var(--card-bg) !important;
  border: 1px solid var(--border);
}

.dropdown-content a {
  color: var(--text-primary) !important;
}

.dropdown-content a:hover {
  background: var(--hover-fill) !important;
}

.mobile-menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  padding: 0;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.mobile-menu-btn:hover {
  background: var(--hover-fill);
  border-color: var(--hover-border);
  transform: translateY(-1px);
}

.mobile-menu-btn svg {
  width: 20px;
  height: 20px;
}

.mobile-nav-panel {
  display: none;
  position: absolute;
  top: calc(100% + 10px);
  left: 12px;
  right: 12px;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.18);
  z-index: 20;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}

.mobile-nav-link:hover {
  background: var(--hover-fill);
  color: var(--text-primary);
}

.mobile-nav-link.active {
  background: rgba(61, 180, 242, 0.12);
  color: var(--cyan);
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.search-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 140;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 72px 20px 20px;
  background: color-mix(in srgb, var(--kz-page-navy) 22%, transparent);
  backdrop-filter: blur(10px);
}

.search-modal-shell {
  width: min(100%, 720px);
  max-height: min(82vh, 720px);
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--kz-card-bg);
  box-shadow: 0 24px 70px color-mix(in srgb, var(--kz-page-navy) 18%, transparent);
  padding: 22px;
}

.search-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.search-modal-title-block h2 {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  color: var(--text-primary);
}

.search-modal-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cyan);
}

.search-modal-close {
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--kz-soft-bg);
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.search-modal-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  margin-top: 18px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--kz-card-input);
  color: var(--text-secondary);
}

.search-modal-input-wrap input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  font-family: var(--font-main);
}

.search-modal-input-wrap input::placeholder {
  color: var(--text-secondary);
}

.search-modal-tabs {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.search-modal-tab {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--kz-soft-bg);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.search-modal-tab.active {
  border-color: rgba(61, 180, 242, 0.4);
  background: rgba(61, 180, 242, 0.12);
  color: var(--text-primary);
}

.search-modal-state {
  padding: 22px 4px 4px;
  color: var(--text-secondary);
  font-size: 14px;
}

.search-modal-error {
  color: #f87171;
}

.search-modal-results {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.search-modal-result {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--kz-soft-bg);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.search-modal-result:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--kz-accent) 26%, var(--border));
  background: var(--kz-soft-bg-hover);
}

.search-modal-result-cover {
  width: 54px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--kz-hover-fill);
}

.search-modal-result-cover.is-user {
  width: 54px;
  height: 54px;
  border-radius: 16px;
}

.search-modal-result-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search-modal-result-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 800;
}

.search-modal-result-copy {
  min-width: 0;
}

.search-modal-result-title {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-modal-result-subtitle,
.search-modal-result-meta {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

.search-modal-result-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.search-modal-result-tag.is-anime {
  background: rgba(61, 180, 242, 0.14);
  color: var(--cyan);
}

.search-modal-result-tag.is-user {
  background: rgba(34, 197, 94, 0.14);
  color: #22c55e;
}

.search-modal-hint-row {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.search-modal-hints {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 12px;
}

.search-modal-hints kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  margin-right: 6px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--kz-soft-bg);
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 700;
}

/* Adaptation mobile */
@media (max-width: 1024px) {
  .nav-links {
    display: none;
  }

  .navbar-content {
    grid-template-columns: auto 1fr auto;
    column-gap: 12px;
    padding: 0 12px;
  }

  .navbar-end {
    gap: 10px;
  }

  .nav-actions {
    gap: 0;
  }

  .nav-actions .icon-btn {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
    flex-shrink: 0;
  }

  .mobile-nav-panel {
    display: flex;
  }

  .search-modal-layer {
    padding-top: 62px;
  }
}

@media (max-width: 768px) {
  .btn-ghost,
  .btn-primary {
    height: 36px;
    padding: 0 13px;
    font-size: 14px;
  }

  .logo-text {
    display: none;
  }

  .navbar-end {
    gap: 8px;
  }

  .theme-toggle {
    margin-left: 2px;
  }

  .theme-toggle-before-avatar {
    margin-left: 0;
    margin-right: 2px;
  }

  .mobile-menu-btn {
    width: 36px;
    height: 36px;
    border-radius: 9px;
  }

  .mobile-nav-panel {
    left: 8px;
    right: 8px;
  }

  .search-modal-shell {
    padding: 18px;
  }

  .search-modal-title-block h2 {
    font-size: 22px;
  }

  .search-modal-result {
    grid-template-columns: auto 1fr;
  }

  .search-modal-result-tag {
    grid-column: 2;
    justify-self: start;
  }
}

@media (max-width: 420px) {
  .navbar-content {
    padding: 0 8px;
  }

  .navbar-end {
    gap: 6px;
  }

  .btn-ghost,
  .btn-primary {
    height: 32px;
    padding: 0 9px;
    font-size: 12px;
    line-height: 1;
  }

  .icon-btn,
  .avatar-btn {
    width: 34px;
    height: 34px;
  }

  .mobile-menu-btn {
    width: 34px;
    height: 34px;
  }

  .theme-toggle svg {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 380px) {
  .logo-image {
    width: 48px;
    height: 48px;
  }

  .btn-ghost {
    display: none;
  }

  .btn-primary {
    padding: 0 10px;
    font-size: 11px;
  }

  .theme-toggle {
    margin-left: 0;
  }
}

@media (max-width: 340px) {
  .navbar-content {
    column-gap: 6px;
  }

  .logo-image {
    width: 42px;
    height: 42px;
  }

  .btn-primary {
    padding: 0 8px;
  }
}
</style>

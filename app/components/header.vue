<template>
  <header class="kizuna-navbar">
    <div class="navbar-content">
      <!-- Left: Logo -->
      <div class="navbar-start">
        <NuxtLink to="/" class="logo-link" @click="handleLogoClick">
          <img src="/img/logo.png" alt="Kizuna" class="logo-image" />
          <span class="logo-text">Kizuna</span>
        </NuxtLink>
      </div>

      <!-- Right: Auth-dependent content -->
      <div class="navbar-end">
        <!-- Guest state -->
        <template v-if="!pocketbaseStore.authRecord">
          <button @click="openLoginDrawer" class="btn-ghost">
            Log in
          </button>
          <button @click="handleSignUp" class="btn-primary">
            Sign up
          </button>
        </template>

        <!-- Authenticated state -->
        <template v-else>
          <nav class="nav-links">
            <NuxtLink to="/" class="nav-link" :class="{ active: $route.path === '/' }">
              Home
            </NuxtLink>
            <NuxtLink to="/profilePage" class="nav-link" :class="{ active: $route.path === '/profilePage' }">
              Profile
            </NuxtLink>
            <NuxtLink to="/social" class="nav-link">
              Social
            </NuxtLink>
            <NuxtLink to="/animeList" class="nav-link">
              Anime List
            </NuxtLink>
            <NuxtLink to="/browse" class="nav-link">
              Browse
            </NuxtLink>
          </nav>

          <div class="nav-actions">
            <!-- Search icon -->
            <button class="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>

            <!-- Notification bell -->
            <button class="icon-btn notification-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="notification-badge"></span>
            </button>

            <!-- Avatar -->
            <div class="dropdown dropdown-bottom dropdown-end">
              <div tabindex="0" role="button" class="avatar-btn">
                <img 
                  :src="avatarUrl" 
                  alt="Avatar" 
                  class="avatar-image"
                />
              </div>
              <ul class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                <li>
                  <NuxtLink class="justify-between" to="/profilePage">
                    Profile
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                      stroke="currentColor" class="size-5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.214 1.281c.062.374.312.686.644.87.074.04.148.083.221.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.004.827c-.293.24-.438.613-.43.991a8.66 8.66 0 0 1 0 .256c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a9.21 9.21 0 0 1-.221.128c-.332.183-.582.495-.644.869l-.214 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.397-1.11-.94l-.214-1.281a1.125 1.125 0 0 0-.644-.869 9.21 9.21 0 0 1-.221-.128c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49L2.758 15.81a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.293-.24.438-.612.43-.99a8.66 8.66 0 0 1 0-.256c.008-.378-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.147-.086.221-.127.332-.184.582-.496.644-.87l.214-1.281Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                    </svg>
                  </NuxtLink>
                </li>
                <li @click="handleLogout()">
                  <a class="justify-between" href="/">Logout
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

        <!-- Theme toggle (always visible) -->
        <label class="swap-rotate swap theme-toggle">
          <input 
            type="checkbox" 
            :checked="themeStore.activeTheme === 'winter'" 
            @change="themeStore.changeTheme()" 
          />

          <!-- Sun icon -->
          <svg class="swap-off w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Z" />
          </svg>

          <!-- Moon icon -->
          <svg class="swap-on w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '~/composables/useThemeStore'
import { useDrawersStore } from '~/composables/useDrawersStore'
import { useMyAuthStore } from '~/composables/useMyAuthStore'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'

const themeStore = useThemeStore()
const drawerStore = useDrawersStore()
const authStore = useMyAuthStore()
const pocketbaseStore = usePocketbaseStore()
const route = useRoute()

// Use AniList avatar if available
const avatarUrl = computed(() => {
  return pocketbaseStore.authRecord?.anilist_avatar_url_medium || '/img/user.png'
})

const openLoginDrawer = () => {
  drawerStore.openDrawer('drawerLogin')
}

const handleLogoClick = (event: MouseEvent) => {
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
</script>

<style scoped>
/* CSS Variables */
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 58px;
  background: var(--navy-overlay);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  z-index: 1000;
  font-family: var(--font-main);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 clamp(12px, 2.5vw, 28px);
  margin: 0;
}

/* Logo */
.navbar-start {
  display: flex;
  align-items: center;
  min-width: 0;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Navbar End */
.navbar-end {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  min-width: 0;
  flex-shrink: 0;
}

/* Guest Buttons */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-ghost:hover {
  background: var(--hover-fill);
  border-color: var(--hover-border);
}

.btn-primary {
  background: var(--cyan);
  color: var(--navy);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(61, 180, 242, 0.3);
}

/* Nav Links */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 8px 12px;
  font-size: 14px;
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

/* Nav Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.icon-btn:hover {
  background: var(--hover-fill);
  border-color: var(--hover-border);
  color: var(--text-primary);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Notification Bell */
.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid var(--navy);
}

/* Avatar Button */
.avatar-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.avatar-btn:hover {
  border-color: var(--hover-border);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Theme Toggle */
.theme-toggle {
  margin-left: 8px;
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
}

/* Dropdown */
.dropdown-content {
  background: var(--card-bg) !important;
  border: 1px solid var(--border);
}

.dropdown-content a {
  color: var(--text-primary) !important;
}

.dropdown-content a:hover {
  background: var(--hover-fill) !important;
}

/* Responsive */
@media (max-width: 1024px) {
  .nav-links {
    display: none;
  }

  .navbar-content {
    padding: 0 12px;
  }

  .navbar-end {
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .btn-ghost,
  .btn-primary {
    padding: 8px 12px;
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
    padding: 6px 8px;
    font-size: 12px;
    line-height: 1.2;
  }

  .icon-btn,
  .avatar-btn {
    width: 32px;
    height: 32px;
  }

  .theme-toggle svg {
    width: 18px;
    height: 18px;
  }
}
</style>

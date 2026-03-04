<template>
  <div class="kizuna-page">
    <!-- Guest Landing Page -->
    <template v-if="!pocketbaseStore.authRecord">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <!-- Eyebrow Pill -->
          <div class="eyebrow-pill fade-up">
            <span class="pulsing-dot"></span>
            <span>Powered by AniList API</span>
          </div>

          <!-- H1 Title -->
          <h1 class="hero-title fade-up">
            Your anime,<br />
            <em>shared</em> together.
          </h1>

          <!-- Subtitle -->
          <p class="hero-subtitle fade-up">
            Kizuna connects your AniList profile with your friends. Build joint watchlists,
            track progress together, and discover what to watch next — as a group.
          </p>

          <!-- CTA Buttons -->
          <div class="cta-buttons fade-up">
            <button @click="openLoginDrawer" class="btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   class="hero-icon">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
              Sign in
            </button>
            <button @click="scrollToFeatures" class="btn-secondary">
              Learn more
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Stats Row -->
          <div class="stats-row fade-up">
            <div class="stat-item">
              <span class="stat-label">POWERED BY</span>
              <span class="stat-value">AniList</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">SHARED LISTS</span>
              <span class="stat-value stat-infinity">∞</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">ALWAYS</span>
              <span class="stat-value">Free</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section ref="featuresSection" class="features-section">
        <div class="features-content">
          <span class="section-label">WHY KIZUNA</span>
          <h2 class="section-title">
            Everything you need to<br />
            <span>watch together</span>
          </h2>

          <div class="features-grid">
            <div
              v-for="(feature, index) in features"
              :key="index"
              :ref="(el) => setCardRef(el, index)"
              class="feature-card"
              :class="{ visible: featureVisible[index] }"
            >
              <div v-if="!featureVisible[index]" class="card-spinner">
                <div class="spinner-ring"></div>
              </div>
              <div v-else class="card-content">
                <div class="feature-icon">
                  <span v-html="feature.iconSvg"></span>
                </div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Authenticated Home Dashboard -->
    <template v-else>
      <div class="dashboard-container">
        <div class="dashboard-grid">
          <!-- Left Panel: Shared Lists -->
          <div class="dashboard-panel">
            <h2 class="panel-title">Shared lists</h2>
            <div class="search-bar">
              <svg class="hamburger-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
              </svg>
              <input type="text" placeholder="Search a list" />
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <div class="lists-container">
              <div v-for="i in 5" :key="i" class="list-item">
                <svg class="hamburger-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                </svg>
                <span>Watch List {{ i }}</span>
              </div>
            </div>
          </div>

          <!-- Right Panel: Friends -->
          <div class="dashboard-panel">
            <div class="panel-header">
              <h2 class="panel-title">Friends</h2>
              <button class="add-friend-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>
            <div class="friends-grid">
              <div v-for="i in 6" :key="i" class="friend-card">
                <div class="friend-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <span class="friend-name">Friend {{ i }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useDrawersStore } from '~/composables/useDrawersStore'

const pocketbaseStore = usePocketbaseStore()
const drawerStore = useDrawersStore()
const featuresSection = ref<HTMLElement | null>(null)

// Plain object — NOT ref([])
// ref="..." on v-for inside v-if is broken in Vue 3
const cardEls: Record<number, HTMLElement> = {}
const featureVisible = reactive<Record<number, boolean>>({
  0: false, 1: false, 2: false, 3: false, 4: false, 5: false
})

// Callback ref function — called by Vue for each card
function setCardRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) cardEls[index] = el
}

// Features data
const features = [
  {
    title: 'Friends & Social',
    description: 'Follow your friends, see what they\'re watching, and compare your lists in real time.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>'
  },
  {
    title: 'Shared Lists',
    description: 'Create collaborative anime lists with your group. Add, remove, and vote on entries together.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>'
  },
  {
    title: 'Progress Tracking',
    description: 'Sync your AniList data automatically. Your watch progress is always up to date.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>'
  },
  {
    title: 'Browse & Discover',
    description: 'Explore the full AniList catalogue. Find your next obsession with smart recommendations.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>'
  },
  {
    title: 'Real-time Notifications',
    description: 'Get notified when friends update their lists, finish a series, or share something new.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>'
  },
  {
    title: 'AniList Native',
    description: 'No new account needed. Sign in directly with AniList — your data, your control.',
    iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
  }
]

const openLoginDrawer = () => {
  drawerStore.openDrawer('drawerLogin')
}

const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}

// IntersectionObserver for feature cards
let observer: IntersectionObserver | null = null

onMounted(() => {
  nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = Object.keys(cardEls).find(
            (k) => cardEls[Number(k)] === entry.target
          )
          if (idx !== undefined) {
            setTimeout(() => {
              featureVisible[Number(idx)] = true
            }, Number(idx) * 120)
            observer?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, root: null, rootMargin: '0px 0px -30px 0px' }
    )
    Object.values(cardEls).forEach((el) => {
      if (el) observer?.observe(el)
    })
  })
})

onUnmounted(() => {
  observer?.disconnect()
})

// Watch for auth changes
watch(() => pocketbaseStore.authRecord, () => {
  // Reactive update when auth state changes
}, { immediate: true })
</script>

<style scoped src="~/assets/css/pages/index.css"></style>


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
            <button @click="handleCreateAccount" class="btn-primary">
              <svg class="anilist-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.361 4.14L0 19.86h4.912l1.13-3.01h5.42l1.13 3.01H17.5L11.14 4.14H6.36zm.607 9.75l1.72-4.585 1.72 4.585H6.968zm10.78-9.75v15.72H24V4.14h-6.252z"/>
              </svg>
              Create an account
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
              ref="featureCards"
              class="feature-card"
              :class="{ visible: featureVisible[index] }"
            >
              <!-- Spinner (shown until visible) -->
              <div v-if="!featureVisible[index]" class="card-spinner">
                <div class="spinner-ring"></div>
              </div>

              <!-- Card Content (shown when visible) -->
              <div v-if="featureVisible[index]" class="card-content">
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useAnilistAuthStore } from '~/composables/useAnilistAuthStore'

const pocketbaseStore = usePocketbaseStore()
const anilistAuthStore = useAnilistAuthStore()

// Feature cards refs for IntersectionObserver
const featuresSection = ref<HTMLElement | null>(null)
const featureCards = ref<HTMLElement[]>([])
const featureVisible = ref<boolean[]>([false, false, false, false, false, false])

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

// Scroll to features
const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}

// Handle create account
const handleCreateAccount = () => {
  // Navigate to signup or trigger auth flow
  anilistAuthStore.loginWithAniListWithWarning()
}

// IntersectionObserver for feature cards
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Wait a tick to ensure DOM is ready
  nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = (featureCards.value as HTMLElement[]).indexOf(
              entry.target as HTMLElement
            )
            if (index !== -1) {
              setTimeout(() => {
                featureVisible.value[index] = true
              }, index * 80)
              observer?.unobserve(entry.target)
            }
          }
        })
      },
      { threshold: 0.15, root: null }
    )

    ;(featureCards.value as HTMLElement[]).forEach((card) => {
      if (card) observer?.observe(card)
    })
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Watch for auth changes
watch(() => pocketbaseStore.authRecord, () => {
  // Reactive update when auth state changes
}, { immediate: true })
</script>

<style scoped>
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,100..900;1,100..900&family=Overpass+Mono:wght@300..700&display=swap');

/* CSS Variables */
.kizuna-page {
  --navy: #0a0e1a;
  --navy-overlay: rgba(10, 14, 26, 0.72);
  --cyan: #3db4f2;
  --teal: #1dd3b0;
  --text-primary: #e8f0ff;
  --text-secondary: #8ba8c4;
  --text-dim: #4a6480;
  --border: rgba(255, 255, 255, 0.08);
  --card-bg: #131a26;
  --card-input: #1e2736;
  --font-main: 'Overpass', sans-serif;
  --font-mono: 'Overpass Mono', monospace;
}

/* Base */
.kizuna-page {
  font-family: var(--font-main);
  color: var(--text-primary);
  background-color: var(--navy);
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: 100vh;
  background-image: url('img/bg.jpg');
  background-size: cover;
  background-position: center 30%;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(8, 12, 24, 0.88) 0%,
    rgba(8, 12, 24, 0.55) 55%,
    rgba(8, 12, 24, 0.2) 100%
  );
  z-index: 1;
}

.hero-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(8, 12, 24, 0.7) 0%,
    transparent 40%
  );
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  max-width: 640px;
  padding: 100px 52px 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Eyebrow Pill */
.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(61, 180, 242, 0.12);
  border: 1px solid var(--cyan);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cyan);
  width: fit-content;
}

.pulsing-dot {
  width: 8px;
  height: 8px;
  background: var(--cyan);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

/* Hero Title */
.hero-title {
  font-size: clamp(38px, 8vw, 64px);
  font-weight: 900;
  letter-spacing: -1.5px;
  line-height: 1.1;
  margin: 0;
}

.hero-title em {
  font-style: normal;
  color: var(--cyan);
}

/* Hero Subtitle */
.hero-subtitle {
  font-size: 15px;
  font-weight: 300;
  line-height: 1.75;
  color: rgba(200, 220, 255, 0.8);
  margin: 0;
}

/* CTA Buttons */
.cta-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--cyan);
  color: var(--navy);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(61, 180, 242, 0.3);
}

.anilist-icon {
  width: 20px;
  height: 20px;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: rgba(10, 14, 26, 0.5);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-secondary:hover {
  background: rgba(10, 14, 26, 0.7);
  border-color: rgba(255, 255, 255, 0.15);
}

.arrow-icon {
  width: 18px;
  height: 18px;
}

/* Stats Row */
.stats-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding-top: 48px;
  margin-top: 24px;
  border-top: 1px solid var(--border);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 0 24px;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 600;
  color: var(--cyan);
}

.stat-value.stat-infinity {
  font-size: 38px;
  line-height: 1;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
}

/* Features Section */
.features-section {
  background: var(--navy);
  padding: 100px 52px;
  position: relative;
  overflow: hidden;
}

.features-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('img/bg.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.06;
  pointer-events: none;
  z-index: 0;
}

.features-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.section-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--teal);
  text-transform: uppercase;
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 48px;
}

.section-title span {
  color: var(--cyan);
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.feature-card {
  background: var(--navy-overlay);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, var(--cyan), var(--teal));
  opacity: 0;
  transition: opacity 0.3s;
}

.feature-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Card Spinner */
.card-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.spinner-ring {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(61, 180, 242, 0.2);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Card Content */
.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.feature-icon {
  width: 38px;
  height: 38px;
  background: rgba(61, 180, 242, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
}

.feature-icon svg {
  width: 22px;
  height: 22px;
}

.feature-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.feature-description {
  font-size: 14px;
  font-weight: 300;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* Fade Up Animation */
.fade-up {
  animation: fadeUp 0.9s ease forwards;
  opacity: 0;
  transform: translateY(28px);
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-up:nth-child(1) { animation-delay: 0ms; }
.fade-up:nth-child(2) { animation-delay: 100ms; }
.fade-up:nth-child(3) { animation-delay: 200ms; }
.fade-up:nth-child(4) { animation-delay: 300ms; }
.fade-up:nth-child(5) { animation-delay: 400ms; }
.fade-up:nth-child(6) { animation-delay: 500ms; }

/* Dashboard (Authenticated) */
.dashboard-container {
  padding: 24px 20px;
  min-height: calc(100vh - 58px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-panel {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 20px;
}

.panel-title {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 16px;
  color: var(--text-primary);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.add-friend-btn {
  width: 32px;
  height: 32px;
  background: rgba(61, 180, 242, 0.12);
  border: 1px solid var(--cyan);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--cyan);
  transition: background 0.2s;
}

.add-friend-btn:hover {
  background: rgba(61, 180, 242, 0.2);
}

.add-friend-btn svg {
  width: 18px;
  height: 18px;
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card-input);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

.hamburger-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-main);
}

.search-bar input::placeholder {
  color: var(--text-secondary);
}

.search-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* Lists */
.lists-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.list-item span {
  font-size: 14px;
  color: var(--text-primary);
}

/* Friends Grid */
.friends-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.friend-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.friend-avatar {
  width: 56px;
  height: 56px;
  background: var(--card-input);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.friend-avatar svg {
  width: 32px;
  height: 32px;
}

.friend-name {
  font-size: 13px;
  color: var(--text-primary);
  text-align: center;
}

/* ScrollToTop Override - discreet styling */
:deep(.scroll-to-top),
:deep([class*="scroll-top"]),
:deep([class*="scrollTop"]) {
  width: 32px !important;
  height: 32px !important;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
  bottom: 20px !important;
  right: 20px !important;
}

:deep(.scroll-to-top svg),
:deep([class*="scroll-top"] svg),
:deep([class*="scrollTop"] svg) {
  width: 14px !important;
  height: 14px !important;
  color: rgba(255, 255, 255, 0.4) !important;
}

:deep(.scroll-to-top:hover),
:deep([class*="scroll-top"]:hover) {
  background: rgba(255, 255, 255, 0.11) !important;
}

/* Responsive */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-content {
    padding: 80px 24px 60px;
  }

  .features-section {
    padding: 60px 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .friends-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-row {
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat-divider {
    display: none;
  }
}
</style>

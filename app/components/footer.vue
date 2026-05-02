<template>
  <footer class="kizuna-footer">
    <div class="footer-content">
      <div class="footer-top">
        <div class="brand-block">
          <img src="/img/logo.webp" alt="Kizuna" class="brand-logo" />
          <div class="brand-text">
            <p class="brand-name">Kizuna</p>
            <p class="brand-subtitle">Listes d'animes partagées avec synchronisation AniList</p>
          </div>
        </div>

        <div class="footer-groups">
          <div class="footer-group footer-group-nav">
            <h3>Navigation</h3>
            <div class="footer-nav-grid">
              <NuxtLink
                v-for="link in navigationLinks"
                :key="link.to"
                :to="link.to"
                class="footer-link"
                @click.prevent="handleFooterNavigation(link)"
              >
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>

          <div class="footer-group">
            <h3>Contact</h3>
            <a href="mailto:support.kizuna@gmail.com" class="footer-link">support.kizuna@gmail.com</a>
            <span class="footer-note">Discord : bientôt</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="copyright">© {{ currentYear }} Kizuna.</span>
        <a href="https://docs.anilist.co/" target="_blank" rel="noopener noreferrer" class="api-pill">
          <img src="/img/anilist.svg" alt="AniList" class="anilist-logo" />
          <span class="api-text">Propulse par l'API AniList</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useToastStore } from '~/composables/useToastStore'

type FooterLink = {
  label: string
  to: string
  requiresAuth?: boolean
}

const currentYear = new Date().getFullYear()
const pocketbaseStore = usePocketbaseStore()
const toastStore = useToastStore()
const authRecord = computed(() => unref(pocketbaseStore.authRecord) as { id?: string } | null)
const navigationLinks: FooterLink[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Profil', to: '/profilePage', requiresAuth: true },
  { label: 'Social', to: '/social', requiresAuth: true },
  { label: 'Favoris', to: '/favorites', requiresAuth: true },
  { label: "Liste d'animes", to: '/animeList', requiresAuth: true },
  { label: 'Explorer', to: '/browse', requiresAuth: true },
  { label: 'Amis', to: '/friends', requiresAuth: true },
  { label: 'Manuel', to: '/manual' },
  { label: 'Listes partagées', to: '/sharedLists', requiresAuth: true },
]

const handleFooterNavigation = async (link: FooterLink) => {
  if (!link.requiresAuth) {
    await navigateTo(link.to)
    return
  }

  await handleProtectedNavigation(link.to)
}

const handleProtectedNavigation = async (to: string) => {
  if (authRecord.value?.id) {
    await navigateTo(to)
    return
  }

  toastStore.openToast({
    type: 'warning',
    message: 'Tu dois te connecter pour accéder à cette page.'
  })
}
</script>

<style scoped>
.kizuna-footer {
  --navy-overlay: var(--kz-surface-overlay);
  --cyan: var(--kz-accent);
  --text-primary: var(--kz-text-primary);
  --text-secondary: var(--kz-text-secondary);
  --text-dim: var(--kz-text-dim);
  --border: var(--kz-border);
  --font-main: 'Overpass', sans-serif;

  background: var(--navy-overlay);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--border);
  font-family: var(--font-main);
  padding: 28px clamp(12px, 2.5vw, 28px) 22px;
}

.footer-content {
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.footer-top {
  display: flex;
  justify-content: flex-start;
  gap: 28px;
  align-items: flex-start;
}

.brand-block {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 62px;
  height: 62px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
}

.brand-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.footer-groups {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-left: auto;
}

.footer-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-group-nav {
  min-width: 440px;
}

.footer-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, max-content));
  column-gap: 28px;
  row-gap: 8px;
  justify-content: start;
}

.footer-group h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.footer-link,
.footer-note {
  margin: 0;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
}

.footer-link:hover {
  color: var(--text-primary);
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.copyright {
  color: var(--text-dim);
  font-size: 12px;
}

.api-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.api-pill:hover {
  opacity: 0.8;
}

.anilist-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.api-text {
  color: var(--text-dim);
}

@media (max-width: 900px) {
  .kizuna-footer {
    padding: 24px 12px 18px;
  }

  .footer-top {
    flex-direction: column;
    gap: 20px;
  }

  .footer-groups {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
    flex-wrap: wrap;
    gap: 16px;
  }

  .footer-group-nav {
    min-width: 0;
    width: 100%;
  }

  .footer-nav-grid {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
    column-gap: 16px;
  }
}

@media (max-width: 580px) {
  .brand-subtitle {
    font-size: 12px;
  }

  .footer-nav-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .footer-bottom {
    gap: 10px;
  }
}

@media (max-width: 420px) {
  .footer-nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>

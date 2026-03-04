<template>
  <footer class="kizuna-footer">
    <div class="footer-content">
      <div class="footer-top">
        <div class="brand-block">
          <img src="/img/logo.png" alt="Kizuna" class="brand-logo" />
          <div class="brand-text">
            <p class="brand-name">Kizuna</p>
            <p class="brand-subtitle">Shared anime lists with AniList sync</p>
          </div>
        </div>

        <div class="footer-groups">
          <div class="footer-group">
            <h3>Navigation</h3>
            <NuxtLink to="/" class="footer-link">Home</NuxtLink>
            <NuxtLink to="/animeList" class="footer-link">Anime List</NuxtLink>
            <NuxtLink to="/profilePage" class="footer-link">Profile</NuxtLink>
          </div>

          <div class="footer-group">
            <h3>Contacts</h3>
            <a href="mailto:support.kizuna@gmail.com" class="footer-link">support.kizuna@gmail.com</a>
            <span class="footer-note">Discord: coming soon</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="copyright">© {{ currentYear }} Kizuna.</span>
        <div class="api-pill">
          <img src="/img/anilist.svg" alt="AniList" class="anilist-logo" />
          <span class="api-text">Powered by AniList API</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
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
  justify-content: space-between;
  gap: 40px;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(170px, 220px));
  gap: 24px;
}

.footer-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-group h3 {
  margin: 0 0 4px;
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
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 580px) {
  .footer-groups {
    grid-template-columns: 1fr;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  .footer-bottom {
    gap: 10px;
  }
}
</style>

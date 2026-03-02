<template>
  <footer class="kizuna-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="copyright">© 2025 Kizuna. Not affiliated with AniList.</span>
      </div>
      <div class="footer-right">
        <svg class="anilist-logo" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.361 4.14L0 19.86h4.912l1.13-3.01h5.42l1.13 3.01H17.5L11.14 4.14H6.36zm.607 9.75l1.72-4.585 1.72 4.585H6.968zm10.78-9.75v15.72H24V4.14h-6.252z"/>
        </svg>
        <span class="powered-by">Powered by AniList API</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* CSS Variables */
.kizuna-footer {
  --navy: #0a0e1a;
  --text-dim: #4a6480;
  --border: rgba(255, 255, 255, 0.08);
  --font-main: 'Overpass', sans-serif;
}

/* Base */
.kizuna-footer {
  background: transparent;
  border-top: 1px solid var(--border);
  padding: 24px 48px;
  font-family: var(--font-main);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

/* Footer Left */
.footer-left {
  display: flex;
  align-items: center;
}

.copyright {
  font-size: 12px;
  color: var(--text-dim);
}

/* Footer Right */
.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.anilist-logo {
  width: 18px;
  height: 18px;
  color: var(--text-dim);
}

.powered-by {
  font-size: 12px;
  color: var(--text-dim);
}

/* Responsive */
@media (max-width: 768px) {
  .kizuna-footer {
    padding: 24px;
  }

  .footer-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>

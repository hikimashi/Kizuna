import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  sourcemap: {
    client: false,
    server: false,
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss() as any,
    ],
    build: {
      // Avoid Vite's modulepreload polyfill virtual module, which emits no source map.
      modulePreload: {
        polyfill: false,
      },
    },
  },
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      pocketbaseUrl: process.env.POCKETBASE_URL,
      anilistClientId: process.env.ANILIST_CLIENT_ID,
      anilistRedirectUri: process.env.ANILIST_REDIRECT_URI,
    },
    anilistClientSecret: process.env.ANILIST_CLIENT_SECRET,
    valkeyUrl: process.env.VALKEY_URL || process.env.REDIS_URL,
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/webp', href: '/img/logo.webp?v=fox-logo' },
        { rel: 'shortcut icon', type: 'image/webp', href: '/img/logo.webp?v=fox-logo' },
      ],
    },
  },
});

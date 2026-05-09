# Kizuna

Plateforme sociale pour les fans d'anime et de manga.

[![Nuxt](https://img.shields.io/badge/Nuxt.js-4-green?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-blue?logo=vue.js)](https://vuejs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![PocketBase](https://img.shields.io/badge/PocketBase-Backend-0088cc)](https://pocketbase.io)

## Fonctionnalites

- Authentification multi-provider (email, Google, GitHub)
- Liaison OAuth AniList
- Gestion du profil utilisateur
- Themes `forest` et `winter`
- Interface responsive
- Notifications toast et alertes

## Demarrage rapide

### Prerequis

- Node.js 22+
- npm
- Un backend PocketBase

### Installation

```bash
git clone <repository-url>
cd Kizuna
npm install
```

Creez ensuite un fichier `.env` a la racine avec au minimum:

```env
POCKETBASE_URL=http://localhost:8090
ANILIST_CLIENT_ID=votre_client_id
ANILIST_CLIENT_SECRET=votre_client_secret
ANILIST_REDIRECT_URI=http://localhost:3000/auth/callback
VALKEY_URL=redis://localhost:6379
```

Puis lancez le projet:

```bash
npm run dev
```

## Structure

```text
Kizuna/
|-- app/       # Frontend Nuxt/Vue
|-- server/    # Routes Nitro
|-- shared/    # Types partages
|-- public/    # Assets statiques
|-- scripts/   # Scripts de maintenance/outillage
```

## Commandes

```bash
npm run dev
npm run build
npm run preview
npm run generate
```

## Technologies

| Couche | Technologie |
|--------|-------------|
| Framework | Nuxt 4 / Vue 3 |
| Styling | Tailwind CSS + DaisyUI |
| State | Pinia |
| Backend | PocketBase |
| API | AniList GraphQL via proxy Nitro |
| Cache | Valkey / Redis (optionnel) |

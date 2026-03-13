# 🌸 Kizuna

> Plateforme sociale pour les fans d'anime et de manga

[![Nuxt](https://img.shields.io/badge/Nuxt.js-4-green?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-blue?logo=vue.js)](https://vuejs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![PocketBase](https://img.shields.io/badge/PocketBase-Backend-0088cc)](https://pocketbase.io)

## 📖 Documentation

- **[📚 Documentation complète](docs/README.md)** - Guide détaillé de tout le code
- **[🏗️ Architecture](ARCHITECTURE.md)** - Vue d'ensemble technique et diagrammes

## 🎯 Fonctionnalités

- ✅ Authentification multi-provider (Email, Google, GitHub)
- ✅ Intégration AniList OAuth (profil anime/manga)
- ✅ Gestion complète du profil utilisateur
- ✅ Thèmes clair/sombre (forest/winter)
- ✅ Interface responsive (mobile-first)
- ✅ Notifications toast et alertes

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Un backend PocketBase

### Installation

```bash
# 1. Cloner le repository
git clone <repository-url>
cd Kizuna

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# 4. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur http://localhost:3000

## 📁 Structure du projet

```
Kizuna/
├── app/                    # Code source frontend
│   ├── components/         # Composants Vue
│   ├── composables/        # Stores Pinia
│   ├── pages/              # Pages (routing auto)
│   └── app.vue             # Layout principal
├── server/                 # API serveur
│   └── api/anilist/        # Endpoint OAuth AniList
├── shared/                 # Types TypeScript
├── docs/                   # Documentation
└── public/                 # Assets statiques
```

## 🛠️ Commandes

```bash
npm run dev       # Développement (hot-reload)
npm run build     # Build de production
npm run preview   # Prévisualisation
npm run generate  # Génération site statique
```

## 📚 Technologies

| Couche | Technologie |
|--------|-------------|
| Framework | Nuxt.js 4 (Vue 3) |
| Styling | Tailwind CSS + DaisyUI |
| State | Pinia |
| Backend | PocketBase |
| API | AniList GraphQL |

## 🔐 Variables d'environnement

```env
POCKETBASE_URL=http://localhost:8090
ANILIST_CLIENT_ID=votre_client_id
ANILIST_CLIENT_SECRET=votre_client_secret
ANILIST_REDIRECT_URI=http://localhost:3000/auth/callback
```

## 📄 Licence

MIT

---

**Kizuna** (絆) signifie "lien" ou "attache" en japonais.





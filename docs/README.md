# 📚 Kizuna - Documentation Complète

Bienvenue dans la documentation complète du projet Kizuna. Ce guide détaillé vous expliquera chaque aspect du code, de l'architecture, et des fonctionnalités.

## 📋 Table des matières

1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture technique](#architecture-technique)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Guide détaillé par composant](#guide-détaillé-par-composant)
5. [Flux de données](#flux-de-données)
6. [API et Backend](#api-et-backend)
7. [Guide de développement](#guide-de-développement)

---

## 🎯 Vue d'ensemble du projet

### Qu'est-ce que Kizuna ?

Kizuna (絆, lien/attache en japonais) est une plateforme sociale pour les fans d'anime et de manga. L'application permet aux utilisateurs de :

- **Se connecter** avec email/mot de passe ou via OAuth (Google, GitHub)
- **Lier leur compte AniList** pour importer leur profil anime/manga
- **Gérer leur profil** (avatar, email, mot de passe, thème)
- **Naviguer** avec une interface responsive et moderne

### Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Frontend** | Nuxt.js 4 (Vue 3) | Framework principal |
| **Styling** | Tailwind CSS + DaisyUI | CSS utilitaire + composants |
| **State** | Pinia | Gestion d'état réactif |
| **Backend** | PocketBase | Auth + base de données |
| **API Externe** | AniList GraphQL | Données anime/manga |

---

## 🏗️ Architecture technique

### Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVIGATEUR (Client)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Nuxt.js 4 App                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  Components │  │   Pages     │  │   Plugins   │   │  │
│  │  │  (Vue SFC)  │  │  (Routes)   │  │  (Init)     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Pinia Stores (État global)            │  │  │
│  │  │  useAuth  useUser  useTheme  useToast  useAlert │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↕ HTTP/GraphQL
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES EXTERNES                       │
│  ┌─────────────────┐           ┌─────────────────────────┐ │
│  │   PocketBase    │           │      AniList API        │ │
│  │  (Backend BaaS) │           │   (GraphQL - Anime)     │ │
│  │  - Auth         │           │   - Profil utilisateur  │ │
│  │  - Database     │           │   - Avatar (medium/large)│ │
│  │  - Storage      │           │   - Stats anime/manga   │ │
│  └─────────────────┘           └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Flux d'authentification

```
1. Connexion utilisateur
   ┌──────────┐     ┌──────────────┐     ┌─────────────┐
   │ Utilisateur│ → │  Formulaire  │ → │ useMyAuth   │
   └──────────┘     └──────────────┘     └─────────────┘
                                              ↓
   ┌──────────┐     ┌──────────────┐     ┌─────────────┐
   │  Dashboard│ ← │  Redirect    │ ← │ PocketBase  │
   └──────────┘     └──────────────┘     └─────────────┘

2. Liaison AniList
   ┌──────────┐     ┌──────────────┐     ┌─────────────┐
   │ Utilisateur│ → │  Bouton AniList│ → │ useAnilist  │
   └──────────┘     └──────────────┘     └─────────────┘
                                              ↓
   ┌──────────┐     ┌──────────────┐     ┌─────────────┐
   │  Profil  │ ← │  Update PB   │ ← │ AniList OAuth│
   └──────────┘     └──────────────┘     └─────────────┘
```

---

## 📁 Structure des fichiers

### Arborescence complète

```
C:\PAP\Kizuna\
│
├── 📄 nuxt.config.ts           # Configuration Nuxt principale
├── 📄 package.json             # Dépendances et scripts npm
├── 📄 tsconfig.json            # Configuration TypeScript
├── 📄 .env                     # Variables d'environnement (non versionné)
│
├── 📂 app/                     # Code source principal
│   ├── 📄 app.vue              # Composant racine (layout global)
│   │
│   ├── 📂 assets/              # Ressources statiques
│   │   └── 📂 css/
│   │       └── 📄 main.css     # Tailwind + thèmes DaisyUI
│   │
│   ├── 📂 components/          # Composants Vue réutilisables
│   │   ├── 📂 alerts/
│   │   │   └── 📄 alert.vue    # Modales de confirmation
│   │   ├── 📂 drawers/
│   │   │   ├── 📄 drawerLogin.vue      # Formulaire connexion
│   │   │   ├── 📄 drawerCreateUser.vue # Formulaire inscription
│   │   │   └── 📄 drawersContainer.vue # Gestionnaire de drawers
│   │   ├── 📂 icons/
│   │   │   ├── 📄 successIcon.vue      # ✓ Icône succès
│   │   │   ├── 📄 errorIcon.vue        # ✗ Icône erreur
│   │   │   ├── 📄 infoIcon.vue         # ℹ Icône info
│   │   │   └── 📄 warningIcon.vue      # ⚠ Icône warning
│   │   ├── 📂 toast/
│   │   │   └── 📄 toast.vue    # Notifications temporaires
│   │   ├── 📄 header.vue       # Barre de navigation
│   │   ├── 📄 footer.vue       # Pied de page
│   │   ├── 📄 profile.vue      # Page de profil complète
│   │   └── 📄 scrollToTop.vue  # Bouton retour en haut
│   │
│   ├── 📂 composables/         # Stores Pinia + utilitaires
│   │   ├── 📄 usePocketbaseStore.ts    # Client PocketBase
│   │   ├── 📄 useMyAuthStore.ts        # Authentification
│   │   ├── 📄 useAnilistAuthStore.ts   # OAuth AniList
│   │   ├── 📄 useUserStore.ts          # Données utilisateur
│   │   ├── 📄 useThemeStore.ts         # Thème clair/sombre
│   │   ├── 📄 useToastStore.ts         # Notifications toast
│   │   ├── 📄 useAlertStore.ts         # Alertes/modales
│   │   └── 📄 useDrawersStore.ts       # Panneaux latéraux
│   │
│   ├── 📂 middleware/          # Middleware de routes
│   │   └── 📄 auth.ts          # Protection des routes
│   │
│   ├── 📂 pages/               # Pages (routing automatique)
│   │   ├── 📂 auth/
│   │   │   └── 📄 callback.vue # Callback OAuth AniList
│   │   ├── 📄 index.vue        # Page d'accueil
│   │   └── 📄 profilePage.vue  # Page de profil
│   │
│   └── 📂 plugins/             # Plugins Nuxt
│       └── 📄 auth.client.ts   # Init auth côté client
│
├── 📂 server/                  # Code serveur (API)
│   └── 📂 api/
│       └── 📂 anilist/
│           └── 📄 exchange-token.post.ts  # Échange token OAuth
│
├── 📂 shared/                  # Code partagé (client/serveur)
│   └── 📂 types/
│       ├── 📄 UserType.ts      # Type utilisateur
│       ├── 📄 NewUserType.ts   # Type nouvel utilisateur
│       ├── 📄 AlertType.ts     # Type alerte
│       └── 📄 ToastType.ts     # Type toast
│
└── 📂 public/                  # Fichiers statiques
    ├── 📄 favicon.ico
    └── 📂 img/
        └── 📄 user.png         # Avatar par défaut
```

---

## 📘 Guide détaillé par composant

### 1. Composant racine : `app/app.vue`

**Rôle :** Structure globale de l'application

```vue
<template>
  <div class="w-full min-h-screen flex flex-col">
    <Header />              <!-- Navigation fixe en haut -->
    <main class="flex-grow">
      <NuxtPage />          <!-- Contenu de la page actuelle -->
      <DrawersContainer />  <!-- Drawers (login/register) -->
      <Toast />             <!-- Notifications toast -->
      <Alert />             <!-- Modales de confirmation -->
    </main>
    <Footer class="mt-auto" />  <!-- Footer collé en bas -->
  </div>
</template>
```

**Fonctionnement :**
- Utilise Flexbox pour un layout "sticky footer"
- Tous les composants globaux sont inclus ici
- `NuxtPage` est le "router-view" de Nuxt

---

### 2. Stores Pinia (`app/composables/`)

#### usePocketbaseStore.ts
**Rôle :** Client PocketBase + état d'authentification réactif

```typescript
export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  const pb = new PocketBase(config.public.pocketbaseUrl);
  const authRecord = ref(pb.authStore.model);  // Données utilisateur
  const authToken = ref(pb.authStore.token);   // Token JWT
  const isAuthValid = ref(pb.authStore.isValid);  // État auth
  
  // Écoute les changements d'auth automatiquement
  pb.authStore.onChange((token, model) => {
    authRecord.value = model;
    authToken.value = token;
    isAuthValid.value = pb.authStore.isValid;
  }, true);
  
  return { pb, authRecord, authToken, isAuthValid };
});
```

**Pourquoi ce store ?**
- Centralise l'accès à PocketBase
- Rend l'état d'authentification réactif dans toute l'app
- Synchronise automatiquement quand l'utilisateur se connecte/déconnecte

---

#### useMyAuthStore.ts
**Rôle :** Toutes les opérations d'authentification

| Méthode | Description | Retour |
|---------|-------------|--------|
| `login(email, password)` | Connexion email/mot de passe | AuthData |
| `loginWithGoogle()` | Connexion Google OAuth | AuthData |
| `loginWithGithub()` | Connexion GitHub OAuth | AuthData |
| `logout()` | Déconnexion | void |
| `authRefresh()` | Rafraîchir le token | Promise |
| `createAccount(newUser)` | Créer un compte | AuthData |
| `emailChange(newEmail)` | Changer d'email | Promise |
| `deleteAccount()` | Supprimer le compte | Promise |

**Exemple d'utilisation :**
```typescript
const authStore = useMyAuthStore();

try {
  await authStore.login('user@example.com', 'password123');
  // Utilisateur connecté !
} catch (error) {
  console.error('Échec de connexion');
}
```

---

#### useAnilistAuthStore.ts
**Rôle :** OAuth AniList

**Flux complet :**
1. `loginWithAniList()` → Redirige vers AniList
2. AniList redirige vers `/auth/callback?code=XXX`
3. `handleCallback(code)` → Échange le code contre un token
4. Récupère le profil AniList via GraphQL
5. Stocke les données dans PocketBase

**Requête GraphQL :**
```graphql
query {
  Viewer {
    id
    name
    avatar {
      medium
      large
    }
  }
}
```

---

### 3. Composants UI (`app/components/`)

#### header.vue
**Rôle :** Barre de navigation responsive

**Fonctionnalités :**
- Menu burger sur mobile
- Menu horizontal sur desktop
- Avatar utilisateur avec dropdown
- Bouton de changement de thème
- Bouton de connexion (si non connecté)

**Structure :**
```
┌────────────────────────────────────────────────────┐
│ [☰] Kizuna    Home  About  Skills     [🌙] [👤]  │
│                              (thème)  (avatar)    │
└────────────────────────────────────────────────────┘
```

---

#### profile.vue
**Rôle :** Gestion complète du profil utilisateur

**Sections :**
1. **Colonne gauche :** Avatar + date de création
2. **Colonne droite :** Formulaire avec 2 onglets
   - **Profile :** Email, ID AniList, thème
   - **Security :** Mot de passe, suppression de compte

**Fonctionnalités clés :**
- Upload d'avatar avec prévisualisation
- Validation des mots de passe
- Confirmation avant suppression
- Garde-fou avant de quitter (modifications non sauvegardées)

---

#### drawerLogin.vue & drawerCreateUser.vue
**Rôle :** Formulaires dans des panneaux latéraux

**Différences :**
| Drawer Login | Drawer Create User |
|--------------|-------------------|
| Email + Mot de passe | Email + Mot de passe + Confirmation |
| Lien "Créer un compte" | Lien "Se connecter" |
| Boutons OAuth : Sign in | Boutons OAuth : Sign up |

---

### 4. Middleware (`app/middleware/auth.ts`)

**Rôle :** Protéger les routes nécessitant une authentification

**Fonctionnement :**
```typescript
export default defineNuxtRouteMiddleware((to) => {
  // Exception : page callback AniList
  if (to.path === '/auth/callback') {
    return;  // Laisse passer
  }
  
  // Vérifie l'authentification
  if (!pocketbaseStore.pb.authStore.isValid || !userStore.userData) {
    return navigateTo('/');  // Redirige vers l'accueil
  }
  
  // Si connecté, laisse passer
});
```

**Utilisation dans une page :**
```typescript
definePageMeta({
  middleware: ['auth']  // Nécessite d'être connecté
});
```

---

## 🔄 Flux de données

### 1. Connexion utilisateur

```
┌─────────────┐
│ Utilisateur │
└──────┬──────┘
       │ 1. Saisit email/mot de passe
       ↓
┌─────────────────┐
│ drawerLogin.vue │
└──────┬──────────┘
       │ 2. @submit.prevent="doLogin()"
       ↓
┌──────────────────┐
│ useMyAuthStore   │
│ .login()         │
└──────┬───────────┘
       │ 3. pb.collection('user').authWithPassword()
       ↓
┌──────────────────┐
│   PocketBase     │
│  Vérifie les    │
│   identifiants   │
└──────┬───────────┘
       │ 4. Retourne token + record
       ↓
┌──────────────────┐
│ useMyAuthStore   │
│ mapAuthDataToUser()│
└──────┬───────────┘
       │ 5. saveUserData()
       ↓
┌──────────────────┐
│  useUserStore    │
│  userData mis à  │
│     jour         │
└──────┬───────────┘
       │ 6. Fermeture drawer + toast succès
       ↓
┌─────────────────┐
│   Utilisateur   │
│    Connecté !   │
└─────────────────┘
```

### 2. Liaison compte AniList

```
┌─────────────┐
│ Utilisateur │
└──────┬──────┘
       │ 1. Clique "Link AniList"
       ↓
┌──────────────────────┐
│ useAnilistAuthStore  │
│ loginWithAniList()   │
└──────┬───────────────┘
       │ 2. window.location.href = oauthUrl
       ↓
┌──────────────────────┐
│      AniList.co      │
│  Page d'autorisation │
└──────┬───────────────┘
       │ 3. Utilisateur autorise
       ↓
┌──────────────────────┐
│ /auth/callback       │
│ ?code=ABC123         │
└──────┬───────────────┘
       │ 4. handleCallback(code)
       ↓
┌──────────────────────┐
│ /api/anilist/        │
│ exchange-token.post  │
└──────┬───────────────┘
       │ 5. Échange code → access_token
       ↓
┌──────────────────────┐
│ graphql.anilist.co   │
│ Query Viewer {       │
│   id, name, avatar   │
└──────┬───────────────┘
       │ 6. Retourne données utilisateur
       ↓
┌──────────────────────┐
│ PocketBase.user.update│
│ anilist_token,       │
│ anilist_user_id,     │
│ anilist_username,    │
│ anilist_avatar_url_* │
└──────┬───────────────┘
       │ 7. authRefresh()
       ↓
┌──────────────────────┐
│  toastStore          │
│ "Compte lié !"      │
└──────────────────────┘
```

---

## 🌐 API et Backend

### PocketBase Collections

#### Collection `user`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | auto | ID unique généré automatiquement |
| `email` | email | Email de l'utilisateur (unique) |
| `password` | password | Mot de passe haché |
| `anilist_token` | text | Token d'accès AniList OAuth |
| `anilist_user_id` | text | ID utilisateur AniList |
| `anilist_username` | text | Nom d'utilisateur AniList |
| `anilist_avatar_url_medium` | url | Avatar AniList taille moyenne |
| `anilist_avatar_url_large` | url | Avatar AniList grande taille |
| `created` | date | Date de création du compte |

### API Server-side

#### `POST /api/anilist/exchange-token`

**Requête :**
```json
{
  "code": "def50200...",
  "redirect_uri": "http://localhost:3000/auth/callback"
}
```

**Réponse :**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "expires_in": 31536000
}
```

**Pourquoi une API serveur ?**
Le `client_secret` AniList ne doit jamais être exposé côté client. Cette API sert de proxy sécurisé.

---

## 🛠️ Guide de développement

### Commandes npm

```bash
# Installation des dépendances
npm install

# Développement (serveur avec hot-reload)
npm run dev
# → http://localhost:3000

# Build de production
npm run build

# Prévisualisation du build
npm run preview

# Génération site statique
npm run generate
```

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# URL du backend PocketBase
POCKETBASE_URL=http://anna.clementlopes.site

# Application AniList OAuth
# À obtenir sur : https://anilist.co/settings/developer
ANILIST_CLIENT_ID=12345
ANILIST_CLIENT_SECRET=abcdef123456
ANILIST_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Bonnes pratiques

1. **Stores Pinia :**
   - Un store par responsabilité
   - Toujours utiliser `storeToRefs()` pour déstructurer
   - Les méthodes retournent des Promises pour les opérations async

2. **Composants Vue :**
   - Utiliser `<script setup lang="ts">`
   - Typage fort avec TypeScript
   - Commentaires pour les fonctions complexes

3. **Gestion d'erreurs :**
   - Toujours utiliser `try/catch` pour les appels API
   - Afficher des toasts pour informer l'utilisateur
   - Logger les erreurs dans la console

4. **Responsive :**
   - Mobile-first avec Tailwind
   - Utiliser les breakpoints : `sm`, `md`, `lg`, `xl`

---

## 📖 Résumé

Kizuna est une application Nuxt.js 4 complète qui intègre :

- ✅ Authentification multi-provider (email, Google, GitHub)
- ✅ OAuth AniList pour importer le profil anime/manga
- ✅ Gestion complète du profil utilisateur
- ✅ Interface responsive avec thèmes clair/sombre
- ✅ Notifications toast et alertes de confirmation
- ✅ Architecture propre avec Pinia pour l'état global

**Points clés à retenir :**

1. **PocketBase** est le backend principal (auth + database)
2. **Pinia** gère tout l'état réactif de l'application
3. **AniList OAuth** nécessite une API serveur pour la sécurité
4. **Tailwind + DaisyUI** fournissent tous les composants UI
5. **Nuxt 4** gère le routing, le SSR, et la configuration

---

*Documentation créée pour faciliter la compréhension et la maintenance du projet Kizuna.*

# Kizuna Portfolio Project

## Project Overview

Kizuna is a portfolio website built with Nuxt.js 4, Vue 3, and TypeScript. It features a modern UI with Tailwind CSS and DaisyUI components, with theme switching capabilities. The project integrates with PocketBase for backend services and includes user authentication functionality.

### Key Technologies

- **Framework**: Nuxt.js 4 (Vue 3)
- **Styling**: Tailwind CSS + DaisyUI
- **State Management**: Pinia
- **Backend**: PocketBase
- **Authentication**: Custom authentication system with OAuth (AniList integration)
- **Type System**: TypeScript
- **Icons**: SVG icons

### Architecture

The project follows a typical Nuxt.js structure with:

- `app/` - Main application directory containing pages, components, layouts, etc.
- `shared/` - Shared types and utilities used across the application
- `public/` - Static assets
- `node_modules/` - Dependencies

#### Key Components

- **Pages**: Home (`/`), Profile (`/profilePage`), Auth routes
- **Components**: Header, Footer, Profile, Drawers, Toasts, Alerts
- **Stores**: Theme, Drawers, User, Authentication stores using Pinia
- **Types**: Shared TypeScript interfaces for User, Toast, Alert, etc.

#### Features

- Responsive design with mobile navigation
- Dark/light theme switching
- User authentication system
- Profile management
- Toast and alert notifications
- Drawer components for login/modals
- Integration with AniList for OAuth

## Building and Running

### Prerequisites

- Node.js (version compatible with Nuxt 4)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file:
```
ANILIST_CLIENT_ID=your_client_id
ANILIST_CLIENT_SECRET=your_client_secret
ANILIST_REDIRECT_URI=http://localhost:3000/auth/callback
POCKETBASE_URL=https://your-pocketbase-url/
```

### Development

To run the development server:
```bash
npm run dev
```

### Production

To build for production:
```bash
npm run build
```

To generate a static site:
```bash
npm run generate
```

To preview the production build:
```bash
npm run preview
```

## Development Conventions

### File Structure

- Components are organized in the `app/components/` directory
- Pages are in `app/pages/` and automatically mapped to routes
- Types are stored in the `shared/types/` directory
- Stores are created using Pinia in `app/composables/`
- Assets like CSS are in `app/assets/`

### Styling

- Uses Tailwind CSS utility classes
- DaisyUI components for consistent UI elements
- Theme switching using `theme-change` package
- Mobile-first responsive design

### State Management

- Pinia stores for managing application state
- Composables for reusable logic
- Store references using `storeToRefs` for reactivity

### Authentication

- Custom authentication system integrated with PocketBase
- OAuth with AniList
- Protected routes and user session management
- Logout functionality

## Environment Variables

- `ANILIST_CLIENT_ID` - AniList OAuth client ID
- `ANILIST_CLIENT_SECRET` - AniList OAuth client secret
- `ANILIST_REDIRECT_URI` - Redirect URI for OAuth callback
- `POCKETBASE_URL` - URL for the PocketBase backend service

## Key Dependencies

- `nuxt`: Nuxt.js framework
- `vue`: Vue.js framework
- `pinia`: State management
- `@pinia/nuxt`: Pinia integration for Nuxt
- `tailwindcss`: CSS framework
- `@tailwindcss/vite`: Tailwind integration
- `daisyui`: Component library
- `pocketbase`: Backend client
- `theme-change`: Theme switching utility
- `graphql`: GraphQL support
- `@graphql-codegen/cli`: GraphQL code generation
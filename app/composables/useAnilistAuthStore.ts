/**
 * useAnilistAuthStore.ts
 * Store Pinia pour l'authentification OAuth avec AniList.
 * @see {@link https://anilist.gitbook.io/anilist-api-v2-graphql/ AniList API}
 */

import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useToastStore } from './useToastStore';

export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const toastStore = useToastStore();

  /**
   * Démarre le flux OAuth AniList
   * 1. Génère un state parameter (protection CSRF)
   * 2. Redirige vers AniList pour autorisation
   */
  const loginWithAniList = () => {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anilist_oauth_state', state);

    const anilistClientId = useRuntimeConfig().public.anilistClientId;
    const anilistRedirectUri = useRuntimeConfig().public.anilistRedirectUri;

    if (!anilistClientId || !anilistRedirectUri) {
      console.error('Missing AniList configuration.');
      return;
    }

    const oauthUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${anilistClientId}&redirect_uri=${encodeURIComponent(anilistRedirectUri)}&response_type=code&state=${state}`;
    window.location.href = oauthUrl;
  };

  /**
   * Gère le callback OAuth après autorisation AniList
   * 1. Vérifie le state parameter (CSRF)
   * 2. Échange le code contre un token via l'API serveur
   * 3. Récupère le profil utilisateur via GraphQL
   * 4. Met à jour PocketBase avec les données AniList
   * @param code - Code d'autorisation
   * @param state - State parameter pour vérification
   * @returns true si succès, false si échec
   */
  const handleCallback = async (code: string, state?: string) => {
    try {
      // Vérification CSRF
      const storedState = localStorage.getItem('anilist_oauth_state');
      if (state && storedState !== state) {
        throw new Error('Invalid state parameter');
      }
      localStorage.removeItem('anilist_oauth_state');

      // Échange code → token
      const response = await $fetch('/api/anilist/exchange-token', {
        method: 'POST',
        body: { code, redirect_uri: useRuntimeConfig().public.anilistRedirectUri }
      });

      if (!response.access_token) {
        throw new Error('Failed to get access token from AniList');
      }

      // Récupération du profil AniList
      const anilistUserData = await $fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${response.access_token}`
        },
        body: {
          query: `
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
          `
        }
      });

      // Mise à jour de PocketBase
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) {
        throw new Error('User not authenticated with PocketBase');
      }

      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token,
        anilist_user_id: anilistUserData.data.Viewer.id,
        anilist_username: anilistUserData.data.Viewer.name,
        anilist_avatar_url_medium: anilistUserData.data.Viewer.avatar.medium,
        anilist_avatar_url_large: anilistUserData.data.Viewer.avatar.large
      });

      // Rafraîchissement de l'état local
      await pocketbaseStore.pb.collection('user').authRefresh();

      toastStore.openToast({ type: 'success', message: 'AniList account linked successfully!' });
      return true;
    } catch (error: any) {
      console.error('AniList OAuth error:', error);
      toastStore.openToast({ type: 'error', message: error.message || 'Failed to link AniList account' });
      return false;
    }
  };

  return {
    loginWithAniList,
    handleCallback
  };
});

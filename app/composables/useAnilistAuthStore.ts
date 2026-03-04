import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useToastStore } from './useToastStore';
import { useAlertStore } from './useAlertStore';

export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const toastStore = useToastStore();
  const alertStore = useAlertStore();

  // Lance l'OAuth AniList et stocke un state anti-CSRF.
  const loginWithAniList = () => {
    localStorage.removeItem('anilist_oauth_state');

    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anilist_oauth_state', state);

    const config = useRuntimeConfig();
    const clientId = config.public.anilistClientId;
    const redirectUri = config.public.anilistRedirectUri;

    if (!clientId || !redirectUri) {
      console.error('Configuration AniList manquante.');
      return;
    }

    const oauthUrl =
      `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&state=${state}&t=${Date.now()}`;

    window.location.href = oauthUrl;
  };

  // Affiche un avertissement avant la redirection OAuth.
  const loginWithAniListWithWarning = async () => {
    await alertStore.openAlert({
      type: 'warning',
      message: '⚠️ Si vous êtes déjà connecté à AniList.co, la connexion sera automatique. Déconnectez-vous d AniList pour lier un autre compte.',
      showDeny: false
    });

    loginWithAniList();
  };

  // Gère le callback OAuth: échange de token, contrôle de doublon et sync utilisateur.
  const handleCallback = async (code: string, state?: string) => {
    try {
      const storedState = localStorage.getItem('anilist_oauth_state');
      if (state && storedState && storedState !== state) {
        throw new Error('Security alert: Invalid state parameter');
      }
      localStorage.removeItem('anilist_oauth_state');

      const response = await $fetch<{ access_token: string }>('/api/anilist/exchange-token', {
        method: 'POST',
        body: { code, redirect_uri: useRuntimeConfig().public.anilistRedirectUri }
      });

      if (!response.access_token) {
        throw new Error('Failed to get access token');
      }

      const anilistUserData = await $fetch<any>('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${response.access_token}`
        },
        body: {
          query: `query { Viewer { id name bannerImage avatar { medium large } } }`
        }
      });

      const viewer = anilistUserData.data.Viewer;
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) {
        throw new Error('You must be logged in to link an account');
      }

      const anilistId = Number(viewer.id);
      const existingUsers = await pocketbaseStore.pb.collection('user').getFullList({
        filter: `anilist_user_id = ${anilistId} && id != '${userId}'`
      });

      if (existingUsers.length > 0) {
        throw new Error('anilist_duplicate');
      }

      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token,
        anilist_user_id: anilistId,
        anilist_username: viewer.name,
        anilist_avatar_url_medium: viewer.avatar.medium,
        anilist_avatar_url_large: viewer.avatar.large,
        anilist_banner: viewer.bannerImage || null
      });

      await pocketbaseStore.pb.collection('user').authRefresh();

      toastStore.openToast({
        type: 'success',
        message: 'Compte AniList lié avec succès.'
      });

      return true;
    } catch (error: any) {
      const pbErrors = error?.response?.data;

      if (error.message === 'anilist_duplicate' || pbErrors?.anilist_user_id) {
        toastStore.openToast({
          type: 'error',
          message: 'Ce compte AniList est déjà utilisé par un autre utilisateur.'
        });
      } else {
        toastStore.openToast({
          type: 'error',
          message: error.message || 'Une erreur inattendue est survenue.'
        });
      }

      return false;
    }
  };

  return {
    loginWithAniList,
    loginWithAniListWithWarning,
    handleCallback
  };
});

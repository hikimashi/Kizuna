import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useToastStore } from './useToastStore';
import { useAlertStore } from './useAlertStore';

export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const toastStore = useToastStore();
  const alertStore = useAlertStore();

  /**
   * Redirige vers AniList pour l'authentification
   */
  const loginWithAniList = () => {
    // 1. Nettoyage préventif du state local
    localStorage.removeItem('anilist_oauth_state');

    // 2. Génération d'un nouveau state sécurisé
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anilist_oauth_state', state);

    // 3. Récupération de la config
    const config = useRuntimeConfig();
    const clientId = config.public.anilistClientId;
    const redirectUri = config.public.anilistRedirectUri;

    if (!clientId || !redirectUri) {
      console.error('Missing AniList configuration');
      return;
    }

    // 4. Construction de l'URL avec un paramètre 't' pour éviter le cache navigateur
    // Note: AniList ne supporte pas 'prompt=login', donc l'utilisateur doit se déconnecter
    // manuellement de AniList.co s'il veut changer de compte.
    const oauthUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&t=${Date.now()}`;

    window.location.href = oauthUrl;
  };

  /**
   * Affiche un avertissement avant de rediriger vers AniList
   */
  const loginWithAniListWithWarning = async () => {
    await alertStore.openAlert({
      type: 'warning',
      message: '⚠️ If you\'re already logged into AniList.co, it will auto-authorize without asking for credentials. \nTo link a different AniList account, please log out of AniList.co first.',
      showDeny: false
    });
    
    loginWithAniList();
  };

  /**
   * Gère le retour d'AniList (Callback)
   */
  const handleCallback = async (code: string, state?: string) => {
    try {
      // 1. Vérification du state (Anti-CSRF)
      const storedState = localStorage.getItem('anilist_oauth_state');
      if (state && storedState && storedState !== state) {
        throw new Error('Security alert: Invalid state parameter');
      }
      localStorage.removeItem('anilist_oauth_state');

      // 2. Échange du code contre un Token via ton API Nitro
      const response = await $fetch<{ access_token: string }>('/api/anilist/exchange-token', {
        method: 'POST',
        body: { code, redirect_uri: useRuntimeConfig().public.anilistRedirectUri }
      });

      if (!response.access_token) throw new Error('Failed to get access token');

      // 3. Récupération du profil AniList
      const anilistUserData = await $fetch<any>('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${response.access_token}`
        },
        body: {
          query: `query { Viewer { id name avatar { medium large } } }`
        }
      });

      const viewer = anilistUserData.data.Viewer;

      // 4. Mise à jour de PocketBase (Utilise la session utilisateur actuelle)
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) throw new Error('You must be logged in to link an account');

      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token,
        anilist_user_id: viewer.id,
        anilist_username: viewer.name,
        anilist_avatar_url_medium: viewer.avatar.medium,
        anilist_avatar_url_large: viewer.avatar.large
      });

      // 5. Rafraîchissement des données locales
      await pocketbaseStore.pb.collection('user').authRefresh();

      toastStore.openToast({
        type: 'success',
        message: 'AniList account linked successfully!'
      });

      return true;

    } catch (error: any) {
      console.error('AniList Link Error:', error);

      // --- GESTION DE L'ERREUR D'INDEX UNIQUE ---
      // Le SDK PocketBase place les erreurs de validation dans error.response.data
      const pbErrors = error?.response?.data;

      if (pbErrors?.anilist_user_id) {
        toastStore.openToast({
          type: 'error',
          message: 'AniList account already associated to an user'
        });
      } else {
        toastStore.openToast({
          type: 'error',
          message: error.message || 'An unexpected error occurred'
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
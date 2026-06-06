import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useToastStore } from './useToastStore';
import { useAlertStore } from './useAlertStore';

export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const toastStore = useToastStore();
  const alertStore = useAlertStore();
  const anilistGraphql = useAnilistGraphql();

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
      message: 'Si vous êtes déjà connecté à AniList.co, la connexion sera automatique. Déconnectez-vous d\'AniList pour lier un autre compte.',
      showDeny: false
    });

    loginWithAniList();
  };

  // Gère le callback OAuth : échange de token, contrôle de doublon et synchronisation utilisateur.
  const handleCallback = async (code: string, state?: string) => {
    try {
      const storedState = localStorage.getItem('anilist_oauth_state');
      if (state && storedState && storedState !== state) {
        throw new Error('Alerte de sécurité : paramètre state invalide');
      }
      localStorage.removeItem('anilist_oauth_state');

      //  ÉTAPE 1: Échange le code OAuth contre un token
      // Le secret AniList reste côté serveur: le client ne donne que le code au endpoint Nitro.
      const response = await $fetch<{ access_token: string; expires_in?: number }>('/api/anilist/exchangeToken', {
        method: 'POST',
        body: { code, redirect_uri: useRuntimeConfig().public.anilistRedirectUri }
      });

      if (!response.access_token) {
        throw new Error('Impossible d\'obtenir le token d\'acces');
      }

      //  ÉTAPE 2: Utilise le token pour récupérer les infos du Viewer
      // Cette requête GraphQL va passer par le serveur Nitro qui la transmet à AniList
      const anilistUserData = await anilistGraphql.request<any>(
        `query { Viewer { id name bannerImage avatar { medium large } } }`,
        {},
        { token: response.access_token, cacheTtlMs: 0, skipCache: true } // Pas de cache pour le login
      );

      //  ON REÇOIT ICI LE JSON D'ANILIST:
      // {
      //   "data": {
      //     "Viewer": {
      //       "id": "123456",
      //       "name": "Username",
      //       "bannerImage": "https://...",
      //       "avatar": { "medium": "https://...", "large": "https://..." }
      //     }
      //   }
      // }
      const viewer = anilistUserData.data.Viewer;
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) {
        throw new Error('Vous devez être connecté pour lier un compte');
      }

      const anilistId = Number(viewer.id);
      //  VÉRIFICATION: Un compte AniList ne doit être lié qu'à un seul compte PocketBase local.
      const existingUsers = await pocketbaseStore.pb.collection('user').getFullList({
        filter: `anilist_user_id = ${anilistId} && id != '${userId}'`
      });

      if (existingUsers.length > 0) {
        throw new Error('anilist_duplicate');
      }

      const tokenExpiresAt =
        typeof response.expires_in === 'number' && response.expires_in > 0
          ? new Date(Date.now() + response.expires_in * 1000).toISOString()
          : null;

      //  STOCKAGE: Sauvegarde les données reçues d'AniList dans PocketBase
      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token, // Le token pour les futures requêtes
        anilist_token_expires_at: tokenExpiresAt,
        anilist_user_id: anilistId, // ID unique AniList
        anilist_username: viewer.name, // Username depuis AniList
        anilist_avatar_url_medium: viewer.avatar.medium, // Avatar depuis AniList
        anilist_avatar_url_large: viewer.avatar.large,
        anilist_banner: viewer.bannerImage || null // Bannière depuis AniList
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

  // Resynchronise les champs liés à AniList (pseudo/avatar/bannière) dans PocketBase.
  const refreshLinkedAniListProfile = async () => {
    try {
      const token = pocketbaseStore.authRecord?.anilist_token;
      const userId = pocketbaseStore.pb.authStore.model?.id;

      if (!token || !userId) {
        throw new Error('Le compte AniList n\'est pas lié.');
      }

      const anilistUserData = await anilistGraphql.request<any>(
        `query { Viewer { id name bannerImage avatar { medium large } } }`,
        {},
        { token, cacheTtlMs: 0, skipCache: true }
      );

      const viewer = anilistUserData?.data?.Viewer;
      if (!viewer?.id) {
        throw new Error('Impossible de récupérer le profil AniList.');
      }

      // On met uniquement à jour les champs dérivés d'AniList pour ne pas toucher au profil local.
      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_user_id: Number(viewer.id),
        anilist_username: viewer.name,
        anilist_avatar_url_medium: viewer.avatar?.medium || null,
        anilist_avatar_url_large: viewer.avatar?.large || null,
        anilist_banner: viewer.bannerImage || null
      });

      await pocketbaseStore.pb.collection('user').authRefresh();

      toastStore.openToast({
        type: 'success',
        message: 'Données AniList rafraîchies.'
      });

      return true;
    } catch (error: any) {
      toastStore.openToast({
        type: 'error',
        message: error?.message || 'Impossible de rafraichir les données AniList.'
      });
      return false;
    }
  };

  return {
    loginWithAniList,
    loginWithAniListWithWarning,
    handleCallback,
    refreshLinkedAniListProfile
  };
});

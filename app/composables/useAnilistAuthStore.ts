import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useToastStore } from './useToastStore';
import { useAlertStore } from './useAlertStore';

// Ce store regroupe toute la logique de liaison entre l'application et AniList.
// En pratique, il gere trois grands cas :
// 1. lancer la connexion AniList,
// 2. traiter le retour d'AniList apres autorisation,
// 3. rafraichir les informations du profil AniList deja lie.
export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  // Dependances partagees pour la session locale, les notifications et les appels AniList.
  const pocketbaseStore = usePocketbaseStore();
  const toastStore = useToastStore();
  const alertStore = useAlertStore();
  const anilistGraphql = useAnilistGraphql();

  // Lance le flux OAuth AniList et enregistre un state anti-CSRF avant la redirection.
  const loginWithAniList = () => {
    // On supprime une ancienne valeur pour eviter d'utiliser un state stale.
    localStorage.removeItem('anilist_oauth_state');

    // On genere une chaine aleatoire qui servira a verifier le retour OAuth.
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anilist_oauth_state', state);

    // Ces valeurs viennent de la configuration publique Nuxt.
    const config = useRuntimeConfig();
    const clientId = config.public.anilistClientId;
    const redirectUri = config.public.anilistRedirectUri;

    if (!clientId || !redirectUri) {
      console.error('Configuration AniList manquante.');
      return;
    }

    // On construit l'URL d'autorisation qu'AniList attend.
    // Le redirect_uri indique ou AniList devra renvoyer l'utilisateur.
    // Le state permet de verifier que le retour correspond bien a notre demande.
    const oauthUrl =
      `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&state=${state}&t=${Date.now()}`;

    // Cette redirection sort l'utilisateur de l'application pour aller sur AniList.
    window.location.href = oauthUrl;
  };

  // Affiche un avertissement avant la redirection OAuth.
  const loginWithAniListWithWarning = async () => {
    await alertStore.openAlert({
      type: 'warning',
      message: 'Si vous etes deja connecte a AniList.co, la connexion sera automatique. Deconnectez-vous d AniList pour lier un autre compte.',
      showDeny: false
    });

    loginWithAniList();
  };

  // Gere le callback OAuth : echange du code contre un token, verifie le state, puis lie le compte.
  const handleCallback = async (code: string, state?: string) => {
    try {
      // On compare le state renvoye par AniList avec celui stocke localement.
      // Si les deux ne correspondent pas, on stoppe pour raison de securite.
      const storedState = localStorage.getItem('anilist_oauth_state');
      if (state && storedState && storedState !== state) {
        throw new Error('Security alert: Invalid state parameter');
      }
      localStorage.removeItem('anilist_oauth_state');

      // Le code OAuth recu n'est pas encore un token.
      // On l'envoie a notre API serveur pour obtenir un vrai access_token.
      const response = await $fetch<{ access_token: string; expires_in?: number }>('/api/anilist/exchangeToken', {
        method: 'POST',
        body: { code, redirect_uri: useRuntimeConfig().public.anilistRedirectUri }
      });

      if (!response.access_token) {
        throw new Error('Failed to get access token');
      }

      // Une fois le token recupere, on demande a AniList qui est l'utilisateur connecte.
      const anilistUserData = await anilistGraphql.request<any>(
        `query { Viewer { id name bannerImage avatar { medium large } } }`,
        {},
        { token: response.access_token, cacheTtlMs: 0, skipCache: true }
      );

      // Le profil AniList recupere ici sert a verifier l'unicite et a remplir le compte local.
      const viewer = anilistUserData.data.Viewer;
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) {
        throw new Error('You must be logged in to link an account');
      }

      // On verifie qu'aucun autre compte local n'utilise deja ce compte AniList.
      const anilistId = Number(viewer.id);
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

      // On enregistre toutes les infos utiles dans le profil PocketBase local.
      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token,
        anilist_token_expires_at: tokenExpiresAt,
        anilist_user_id: anilistId,
        anilist_username: viewer.name,
        anilist_avatar_url_medium: viewer.avatar.medium,
        anilist_avatar_url_large: viewer.avatar.large,
        anilist_banner: viewer.bannerImage || null
      });

      await pocketbaseStore.pb.collection('user').authRefresh();

      // Le toast sert a informer visuellement l'utilisateur que tout s'est bien passe.
      toastStore.openToast({
        type: 'success',
        message: 'Compte AniList lie avec succes.'
      });

      return true;
    } catch (error: any) {
      const pbErrors = error?.response?.data;

      // Un compte AniList ne peut etre lie qu'a un seul utilisateur PocketBase.
      if (error.message === 'anilist_duplicate' || pbErrors?.anilist_user_id) {
        toastStore.openToast({
          type: 'error',
          message: 'Ce compte AniList est deja utilise par un autre utilisateur.'
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

  // Re-synchronise les champs de profil AniList lies au compte PocketBase.
  const refreshLinkedAniListProfile = async () => {
    try {
      // On lit le token deja stocke lors de la liaison initiale.
      const token = pocketbaseStore.authRecord?.anilist_token;
      const userId = pocketbaseStore.pb.authStore.model?.id;

      if (!token || !userId) {
        throw new Error('AniList account is not linked.');
      }

      // On relit le profil actuel cote AniList pour recuperer les valeurs les plus recentes.
      const anilistUserData = await anilistGraphql.request<any>(
        `query { Viewer { id name bannerImage avatar { medium large } } }`,
        {},
        { token, cacheTtlMs: 0, skipCache: true }
      );

      const viewer = anilistUserData?.data?.Viewer;
      if (!viewer?.id) {
        throw new Error('Failed to fetch AniList viewer.');
      }

      // On remplace les champs locaux avec les donnees fraiches venant d'AniList.
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
        message: 'AniList data refreshed.'
      });

      return true;
    } catch (error: any) {
      toastStore.openToast({
        type: 'error',
        message: error?.message || 'Unable to refresh AniList data.'
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

/*
Definition des termes techniques :
- OAuth : protocole d'autorisation qui permet de se connecter via un service tiers sans partager le mot de passe.
- token : jeton d'acces prouvant qu'une requete est autorisee.
- CSRF : attaque qui force un navigateur connecte a envoyer une action non voulue ; le state aide a la bloquer.
- callback : retour apres redirection du fournisseur OAuth vers l'application.
- GraphQL : langage de requete pour demander exactement les champs souhaites a une API.
- synchronisation : mise a jour de deux sources de donnees pour qu'elles restent coherentes.
*/

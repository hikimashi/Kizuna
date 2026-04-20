import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';

// Ce store centralise l'authentification locale de l'application.
// Il parle a PocketBase pour :
// - creer un compte,
// - connecter un utilisateur,
// - conserver la session,
// - supprimer le compte.
export const useMyAuthStore = defineStore('auth', () => {
  // Stores utilitaires pour l'authentification distante et l'etat utilisateur local.
  const pocketbaseStore = usePocketbaseStore();
  const userStore = useUserStore();

  // Convertit la reponse PocketBase vers le format utilisateur attendu par l'application.
  const mapAuthDataToUser = (authData: { token: string; record: any }): UserType => {
    const { record } = authData;

    // Si un avatar existe, PocketBase peut construire son URL publique.
    const avatarURL = record.avatar
      ? pocketbaseStore.pb.files.getURL(record, record.avatar, { thumb: '100x250' })
      : '';

    // On transforme la date brute en format plus lisible pour l'application.
    const createdDate = new Date(record.created);
    const created =
      `${String(createdDate.getDate()).padStart(2, '0')}-` +
      `${String(createdDate.getMonth() + 1).padStart(2, '0')}-` +
      `${createdDate.getFullYear()}`;

    return {
      id: record.id,
      token: authData.token,
      email: record.email,
      created,
      theme: record.theme,
      password: '',
      passwordConfirm: '',
      oldPassword: '',
      avatarURL
    };
  };

  // Cree un compte local puis connecte automatiquement l'utilisateur pour hydrater le store.
  const createAccount = async (newUser: NewUserType) => {
    // On prepare exactement les champs attendus par PocketBase.
    const data = {
      email: newUser.email,
      emailVisibility: false,
      password: newUser.password,
      passwordConfirm: newUser.passwordConfirm,
      // Initialise explicitement les champs AniList.
      anilist_user_id: null,
      anilist_username: null,
      anilist_token: null,
      anilist_token_expires_at: null,
      anilist_banner: null
    };

    try {
      // Etape 1 : creation en base.
      await pocketbaseStore.pb.collection('user').create(data);
      // Etape 2 : connexion immediate pour obtenir le token de session.
      const authData = await login(newUser.email, newUser.password);
      // Etape 3 : copie des donnees dans le store utilisateur local.
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Account creation failed. Please try again.';
      throw new Error(errorMsg);
    }
  };

  // Authentification classique par email et mot de passe.
  const login = async (email: string, password: string) => {
    try {
      // PocketBase verifie les identifiants et renvoie les infos de session.
      const authData = await pocketbaseStore.pb.collection('user').authWithPassword(email, password);
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Login failed. Please check your credentials.');
    }
  };

  // Authentification OAuth via Google.
  const loginWithGoogle = async () => {
    try {
      const authData = await pocketbaseStore.pb.collection('user').authWithOAuth2({ provider: 'google' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Google login failed. Please try again.');
    }
  };

  // Authentification OAuth via GitHub.
  const loginWithGithub = async () => {
    try {
      const authData = await pocketbaseStore.pb.collection('user').authWithOAuth2({ provider: 'github' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'GitHub login failed. Please try again.');
    }
  };

  // Coupe la session locale et vide les donnees utilisateur du navigateur.
  const logout = () => {
    pocketbaseStore.pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    userStore.clearUser();
  };

  // Tente de rafraichir la session au demarrage et degrade proprement si elle n'est plus valide.
  const authRefresh = async () => {
    try {
      // Si PocketBase juge deja la session invalide, on nettoie sans insister.
      if (!pocketbaseStore.pb.authStore.isValid) {
        pocketbaseStore.pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        userStore.clearUser();
        return;
      }

      const authData = await pocketbaseStore.pb.collection('user').authRefresh();
      userStore.saveUserData(mapAuthDataToUser(authData));
    } catch (error: any) {
      // Ici on essaie de distinguer une vraie fin de session
      // d'un simple probleme reseau temporaire.
      const hasLocalSession = Boolean(pocketbaseStore.pb.authStore.model?.id) && Boolean(pocketbaseStore.pb.authStore.token);
      const message = String(error?.message || '');
      const isTransientNetworkError =
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('fetch');

      // Garde la session locale si l'echec semble venir d'un souci reseau temporaire.
      if (hasLocalSession && isTransientNetworkError) {
        userStore.saveUserData(
          mapAuthDataToUser({
            token: pocketbaseStore.pb.authStore.token,
            record: pocketbaseStore.pb.authStore.model
          })
        );
        return;
      }

      pocketbaseStore.pb.authStore.clear();
      localStorage.removeItem('pocketbase_auth');
      userStore.clearUser();
    }
  };

  // Demande a PocketBase de lancer le processus de changement d'email.
  const emailChange = async (newEmail: string) => {
    try {
      await pocketbaseStore.pb.collection('user').requestEmailChange(newEmail);
    } catch (error: any) {
      throw new Error(error?.message || 'Email change failed. Please try again.');
    }
  };

  // Supprime le compte courant apres verification d'un utilisateur connecte.
  const deleteAccount = async () => {
    try {
      const userId = userStore.userData?.id;
      if (!userId) {
        throw new Error('No authenticated user found.');
      }

      await pocketbaseStore.pb.collection('user').delete(userId);
    } catch (error: any) {
      throw new Error(error?.message || 'Account deletion failed. Please try again.');
    }
  };

  return {
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    authRefresh,
    emailChange,
    createAccount,
    deleteAccount
  };
});

/*
Definition des termes techniques :
- authentification : verification de l'identite d'un utilisateur.
- OAuth : protocole permettant une connexion via un service tiers.
- session : etat qui represente un utilisateur connecte entre plusieurs requetes.
- hydrater : remplir un store local avec des donnees deja disponibles.
- store : espace centralise pour partager un etat dans l'application.
- refresh : revalidation ou renouvellement d'une session existante.
*/

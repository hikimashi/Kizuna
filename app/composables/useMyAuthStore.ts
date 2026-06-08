import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { authEmailCandidates, normalizeAuthEmail } from '~/utils/authEmail';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export const useMyAuthStore = defineStore('auth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const unverifiedEmailMessage = 'Veuillez vérifier votre adresse e-mail avant de vous connecter.';
  const invalidLoginMessage = 'Identifiants invalides. Verifiez votre email et votre mot de passe.';
  const accountCreationMessage = 'La création du compte a échoué. Veuillez réessayer.';
  const googleLoginMessage = 'La connexion Google a échoué. Veuillez réessayer.';
  const githubLoginMessage = 'La connexion GitHub a échoué. Veuillez réessayer.';
  const emailChangeMessage = "La demande de changement d'adresse e-mail a échoué. Veuillez réessayer.";
  const passwordResetMessage = 'La demande de réinitialisation du mot de passe a échoué. Veuillez réessayer.';
  const accountDeletionMessage = 'La suppression du compte a échoué. Veuillez réessayer.';

  /**
   * Retourne auth error message.
   *
   * @param error - Valeur utilisée par le traitement « get auth error message ».
   * @param fallback - Valeur utilisée par le traitement « get auth error message ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const getAuthErrorMessage = (error: any, fallback: string) => {
    const candidateMessages = [
      error?.response?.data?.message,
      error?.response?.message,
      error?.data?.message,
      error?.message
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    // Normalise les messages PocketBase pour afficher des erreurs utiles en francais.
    const rawMessage = candidateMessages[0] || fallback;
    const normalizedMessage = rawMessage.toLowerCase();

    if (
      normalizedMessage.includes('verify') ||
      normalizedMessage.includes('verif') ||
      normalizedMessage.includes('unverified')
    ) {
      return unverifiedEmailMessage;
    }

    if (
      normalizedMessage.includes('auth') ||
      normalizedMessage.includes('credential') ||
      normalizedMessage.includes('invalid') ||
      normalizedMessage.includes('password') ||
      normalizedMessage.includes('not found') ||
      normalizedMessage.includes('wrong')
    ) {
      return invalidLoginMessage;
    }

    return rawMessage || fallback;
  };

  // Convertit les données PocketBase vers le format UserType utilisé par l'app.
  /**
   * Convertit auth data to user.
   *
   * @param authData - Valeur utilisée par le traitement « map auth data to user ».
   * @returns Le résultat calculé par la fonction.
   * @sideEffects Aucun effet de bord direct identifié.
   */
  const mapAuthDataToUser = (authData: { token: string; record: any }): UserType => {
    const { record } = authData;

    const avatarURL = record.avatar
      ? pocketbaseStore.pb.files.getURL(record, record.avatar, { thumb: '100x250' })
      : '';

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

  // Crée un compte local puis envoie l'email de verification.
  /**
   * Crée account.
   *
   * @param newUser - Valeur utilisée par le traitement « create account ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const createAccount = async (newUser: NewUserType) => {
    const email = normalizeAuthEmail(newUser.email);
    const data = {
      email,
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
      await pocketbaseStore.pb.collection('user').create(data);
      await pocketbaseStore.pb.collection('user').requestVerification(email);
      return {
        email,
        verificationSent: true
      };
    } catch (error: any) {
      throw new Error(getUserFacingErrorMessage(error, accountCreationMessage));
    }
  };

  // Connexion email/mot de passe.
  /**
   * Authentifie login.
   *
   * @param email - Valeur utilisée par le traitement « login ».
   * @param password - Valeur utilisée par le traitement « login ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects lit ou écrit dans le stockage du navigateur, effectue des appels réseau ou persistants.
   */
  const login = async (email: string, password: string) => {
    let lastError: any = null;

    try {
      // Essaie les variantes normalisees de l'email pour absorber les differences de casse/alias.
      for (const candidateEmail of authEmailCandidates(email)) {
        try {
          const authData = await pocketbaseStore.pb.collection('user').authWithPassword(candidateEmail, password);

          if (!authData.record?.verified) {
            pocketbaseStore.pb.authStore.clear();
            localStorage.removeItem('pocketbase_auth');
            userStore.clearUser();
            throw Object.assign(new Error(unverifiedEmailMessage), { code: 'unverified_email' });
          }

          userStore.saveUserData(mapAuthDataToUser(authData));
          return authData;
        } catch (error: any) {
          if (error?.code === 'unverified_email') {
            throw error;
          }

          lastError = error;
        }
      }

      throw lastError;
    } catch (error: any) {
      if (error?.code === 'unverified_email') {
        throw error;
      }

      throw new Error(getAuthErrorMessage(error, invalidLoginMessage));
    }
  };

  // Connexion OAuth Google.
  /**
   * Authentifie with google.
   *
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const loginWithGoogle = async () => {
    try {
      const authData = await pocketbaseStore.pb.collection('user').authWithOAuth2({ provider: 'google' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(getUserFacingErrorMessage(error, googleLoginMessage));
    }
  };

  // Connexion OAuth GitHub.
  /**
   * Authentifie with github.
   *
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const loginWithGithub = async () => {
    try {
      const authData = await pocketbaseStore.pb.collection('user').authWithOAuth2({ provider: 'github' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(getUserFacingErrorMessage(error, githubLoginMessage));
    }
  };

  /**
   * Déconnecte logout.
   *
   * @returns Aucune valeur.
   * @sideEffects lit ou écrit dans le stockage du navigateur.
   */
  const logout = () => {
    pocketbaseStore.pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    userStore.clearUser();
  };

  // Rafraichit la session au demarrage et nettoie si invalide.
  /**
   * Calcule la valeur « auth refresh ».
   *
   * @returns Une promesse résolue une fois le traitement terminé.
   * @sideEffects lit ou écrit dans le stockage du navigateur, effectue des appels réseau ou persistants.
   */
  const authRefresh = async () => {
    try {
      if (!pocketbaseStore.pb.authStore.isValid) {
        pocketbaseStore.pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        userStore.clearUser();
        return;
      }

      const authData = await pocketbaseStore.pb.collection('user').authRefresh();
      userStore.saveUserData(mapAuthDataToUser(authData));
    } catch (error: any) {
      const hasLocalSession = Boolean(pocketbaseStore.pb.authStore.model?.id) && Boolean(pocketbaseStore.pb.authStore.token);
      const message = String(error?.message || '');
      const isTransientNetworkError =
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('fetch');

      // Conserve la session locale courante si le refresh échoue à cause d'un souci réseau temporaire.
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

  /**
   * Calcule la valeur « email change ».
   *
   * @param newEmail - Valeur utilisée par le traitement « email change ».
   * @returns Une promesse résolue une fois le traitement terminé.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const emailChange = async (newEmail: string) => {
    try {
      await pocketbaseStore.pb.collection('user').requestEmailChange(normalizeAuthEmail(newEmail));
    } catch (error: any) {
      throw new Error(getUserFacingErrorMessage(error, emailChangeMessage));
    }
  };

  /**
   * Exécute password reset.
   *
   * @param email - Valeur utilisée par le traitement « request password reset ».
   * @returns Une promesse résolue une fois le traitement terminé.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const requestPasswordReset = async (email: string) => {
    try {
      await pocketbaseStore.pb.collection('user').requestPasswordReset(email);
    } catch (error: any) {
      throw new Error(getUserFacingErrorMessage(error, passwordResetMessage));
    }
  };

  /**
   * Supprime account.
   *
   * @returns Une promesse résolue une fois le traitement terminé.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const deleteAccount = async () => {
    try {
      const userId = userStore.userData?.id;
      if (!userId) {
        throw new Error('Aucun utilisateur connecte n\'a été trouvé.');
      }

      await pocketbaseStore.pb.collection('user').delete(userId);
    } catch (error: any) {
      throw new Error(getUserFacingErrorMessage(error, accountDeletionMessage));
    }
  };

  return {
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    authRefresh,
    emailChange,
    requestPasswordReset,
    createAccount,
    deleteAccount
  };
});

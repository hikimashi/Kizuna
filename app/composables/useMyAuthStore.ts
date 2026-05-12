import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { authEmailCandidates, normalizeAuthEmail } from '~/utils/authEmail';

export const useMyAuthStore = defineStore('auth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const unverifiedEmailMessage = 'Veuillez verifier votre adresse e-mail avant de vous connecter.';
  const invalidLoginMessage = 'Identifiants invalides. Verifiez votre email et votre mot de passe.';

  const getAuthErrorMessage = (error: any, fallback: string) => {
    const candidateMessages = [
      error?.response?.data?.message,
      error?.response?.message,
      error?.data?.message,
      error?.message
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

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

  // Convertit les données PocketBase vers le format UserType utilise par l'app.
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
      const errorMsg = error.response?.data?.message || error.message || 'Account creation failed. Please try again.';
      throw new Error(errorMsg);
    }
  };

  // Connexion email/mot de passe.
  const login = async (email: string, password: string) => {
    let lastError: any = null;

    try {
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
  const loginWithGoogle = async () => {
    try {
      const authData = await pocketbaseStore.pb.collection('user').authWithOAuth2({ provider: 'google' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Google login failed. Please try again.');
    }
  };

  // Connexion OAuth GitHub.
  const loginWithGithub = async () => {
    try {
      const authData = await pocketbaseStore.pb.collection('user').authWithOAuth2({ provider: 'github' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'GitHub login failed. Please try again.');
    }
  };

  const logout = () => {
    pocketbaseStore.pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    userStore.clearUser();
  };

  // Rafraichit la session au demarrage et nettoie si invalide.
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

      // Conserve la session locale courante si le refresh echoue a cause d'un souci reseau temporaire.
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

  const emailChange = async (newEmail: string) => {
    try {
      await pocketbaseStore.pb.collection('user').requestEmailChange(normalizeAuthEmail(newEmail));
    } catch (error: any) {
      throw new Error(error?.message || 'Email change failed. Please try again.');
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await pocketbaseStore.pb.collection('user').requestPasswordReset(email);
    } catch (error: any) {
      throw new Error(error?.message || 'Password reset request failed. Please try again.');
    }
  };

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
    requestPasswordReset,
    createAccount,
    deleteAccount
  };
});

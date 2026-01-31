import { defineStore } from 'pinia';
import { navigateTo } from '#app';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { useThemeStore } from '~/composables/useThemeStore';
import { useAnilistAuth } from '~/composables/useAnilistAuth';
import { useToastStore } from '~/composables/useToastStore';

export const useMyAuthStore = defineStore('auth', () => {
  const pocketBaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const themeStore = useThemeStore();

  const mapAuthDataToUser = (authData: { token: string; record: any }): UserType => {
    const record = authData.record;

    const avatar = record.avatar
      ? pocketBaseStore.pb.files.getURL(record, record.avatar, { thumb: '100x250' })
      : '';

    const d = new Date(record.created);
    const created =
      `${String(d.getDate()).padStart(2, '0')}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${d.getFullYear()}`;

    // if (record.themeMode === '') {
    //   record.themeMode = themeStore.activeTheme;
    // }

    return {
      id: record.id,
      token: authData.token,
      // name: record.name,
      email: record.email,
      // avatar,
      created,
      // themeMode: record.themeMode,
      password: '',
      passwordConfirm: '',
      oldPassword: '',
      // avatarFile: null,
      avatarURL: avatar,

      // AniList integration fields
      anilist_user_id: record.anilist_user_id,
      anilist_username: record.anilist_username,
      anilist_avatar_url: record.anilist_avatar_url,
      anilist_token: record.anilist_token,
      anilist_token_expires_at: record.anilist_token_expires_at,
    };
  };

  const createAccount = async (newUser: NewUserType) => {

    const data = {
      "email": newUser.email,
      "emailVisibility": false,
      // "name": newUser.name,
      // "themeMode": newUser.themeMode,
      "password": newUser.password,
      "passwordConfirm": newUser.passwordConfirm,
    };

    try {
      await pocketBaseStore.pb.collection('user').create(data);
      const authData = await login(newUser.email, newUser.password);
      userStore.saveUserData(mapAuthDataToUser(authData));

      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Account creation failed. Please try again.');
    }

  };


  const login = async (email: string, password: string) => {
    try {
      const authData = await pocketBaseStore.pb.collection('user').authWithPassword(email, password);

      userStore.saveUserData(mapAuthDataToUser(authData));

      // Check if user needs to connect to AniList after successful login
      if (needsAnilistAuth()) {
        // Redirect to AniList verification page
        await navigateTo('/anilistVerification');
      }

      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Login failed. Please check your credentials.');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const authData = await pocketBaseStore.pb
        .collection('user')
        .authWithOAuth2({ provider: 'google' });

      userStore.saveUserData(mapAuthDataToUser(authData));

      // Check if user needs to connect to AniList after successful Google login
      if (needsAnilistAuth()) {
        // Redirect to AniList verification page
        await navigateTo('/anilistVerification');
      }

      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Google login failed. Please try again.');
    }
  };

  const logout = () => {
    pocketBaseStore.pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    userStore.clearUser();
  };

  const authRefresh = async () => {
    try {
      if (!pocketBaseStore.pb.authStore.isValid) {
        pocketBaseStore.pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        userStore.clearUser();
        return;
      }

      const authData = await pocketBaseStore.pb.collection('user').authRefresh();

      userStore.saveUserData(mapAuthDataToUser(authData));

      // Check if user needs to connect to AniList after successful auth refresh
      if (needsAnilistAuth()) {
        // Redirect to AniList verification page
        await navigateTo('/anilistVerification');
      }
    } catch (error: any) {
      pocketBaseStore.pb.authStore.clear();
      localStorage.removeItem('pocketbase_auth');
      userStore.clearUser();
    }
  };
  const emailChange = async (newEmail: string) => {
    console.log(newEmail)
    try {
      await pocketBaseStore.pb.collection('user').requestEmailChange(newEmail);
    } catch (error: any) {
      throw new Error(error?.message || 'Email change failed. Please try again.');
    }
  };
  const deleteAccount = async () => {
    try {
      await pocketBaseStore.pb.collection('user').delete(userStore.userData.id);
      
    } catch (error: any) {
      throw new Error(error?.message || 'Account deletion failed. Please try again.');
    }
  };

  const needsAnilistAuth = (): boolean => {
    // Check if the user has an AniList token and if it's valid
    if (!userStore.userData) {
      return false; // User not logged in
    }

    // Return true if the user doesn't have an AniList token
    // Note: According to requirements, AniList tokens don't expire, so we only check if it exists
    return !userStore.userData.anilist_token;
  };

  const isAnilistTokenValid = (): boolean => {
    if (!userStore.userData?.anilist_token) {
      return false;
    }

    // Check if the token exists and hasn't expired (though AniList tokens don't actually expire)
    const tokenExpiry = userStore.userData.anilist_token_expires_at;
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      return new Date() < expiryDate;
    }

    // If no expiry date is set, assume the token is valid
    return !!userStore.userData.anilist_token;
  };

  const checkAnilistConnectionAndRedirect = async () => {
    if (needsAnilistAuth()) {
      await navigateTo('/anilistVerification');
    }
  };

  return {
    login,
    loginWithGoogle,
    logout,
    authRefresh,
    emailChange,
    createAccount,
    deleteAccount,
    needsAnilistAuth,
    isAnilistTokenValid,
    checkAnilistConnectionAndRedirect,
  };
});

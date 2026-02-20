/**
 * useMyAuthStore.ts
 * Store Pinia pour la gestion de l'authentification.
 * Gère : connexion, déconnexion, OAuth (Google, GitHub), création de compte.
 */

import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { useThemeStore } from '~/composables/useThemeStore';

export const useMyAuthStore = defineStore('auth', () => {
  const pocketBaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const themeStore = useThemeStore();

  /**
   * Transforme les données PocketBase en objet UserType
   * @param authData - Données brutes de PocketBase
   * @returns Objet UserType formaté
   */
  const mapAuthDataToUser = (authData: { token: string; record: any }): UserType => {
    const record = authData.record;

    const avatar = record.avatar
      ? pocketBaseStore.pb.files.getURL(record, record.avatar, { thumb: '100x250' })
      : '';

    const d = new Date(record.created);
    const created = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

    return {
      id: record.id,
      token: authData.token,
      email: record.email,
      created,
      password: '',
      passwordConfirm: '',
      oldPassword: '',
      avatarURL: avatar,
    };
  };

  /**
   * Crée un nouveau compte utilisateur
   * @param newUser - Email et mot de passe
   */
  const createAccount = async (newUser: NewUserType) => {
    const data = {
      email: newUser.email,
      emailVisibility: false,
      password: newUser.password,
      passwordConfirm: newUser.passwordConfirm,
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

  /**
   * Connexion avec email et mot de passe
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe
   */
  const login = async (email: string, password: string) => {
    try {
      const authData = await pocketBaseStore.pb.collection('user').authWithPassword(email, password);
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Login failed. Please check your credentials.');
    }
  };

  /**
   * Connexion via OAuth Google
   */
  const loginWithGoogle = async () => {
    try {
      const authData = await pocketBaseStore.pb.collection('user').authWithOAuth2({ provider: 'google' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'Google login failed. Please try again.');
    }
  };

  /**
   * Connexion via OAuth GitHub
   */
  const loginWithGithub = async () => {
    try {
      const authData = await pocketBaseStore.pb.collection('user').authWithOAuth2({ provider: 'github' });
      userStore.saveUserData(mapAuthDataToUser(authData));
      return authData;
    } catch (error: any) {
      throw new Error(error?.message || 'GitHub login failed. Please try again.');
    }
  };

  /**
   * Déconnecte l'utilisateur et nettoie toutes les données
   */
  const logout = () => {
    pocketBaseStore.pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    userStore.clearUser();
  };

  /**
   * Rafraîchit le token d'authentification
   * Si échec, déconnecte l'utilisateur
   */
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
    } catch (error: any) {
      pocketBaseStore.pb.authStore.clear();
      localStorage.removeItem('pocketbase_auth');
      userStore.clearUser();
    }
  };

  /**
   * Demande un changement d'email (envoi email de confirmation)
   * @param newEmail - Nouvelle adresse email
   */
  const emailChange = async (newEmail: string) => {
    try {
      await pocketBaseStore.pb.collection('user').requestEmailChange(newEmail);
    } catch (error: any) {
      throw new Error(error?.message || 'Email change failed. Please try again.');
    }
  };

  /**
   * Supprime définitivement le compte utilisateur
   */
  const deleteAccount = async () => {
    try {
      await pocketBaseStore.pb.collection('user').delete(userStore.userData.id);
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
    deleteAccount,
  };
});

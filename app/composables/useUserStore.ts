/**
 * useUserStore.ts
 * Store Pinia pour la gestion des données utilisateur.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';

export const useUserStore = defineStore('userStore', () => {
  const pocketbase = usePocketbaseStore();
  const userData = ref<UserType | null>(null);

  /** Sauvegarde les données utilisateur */
  const saveUserData = (authData: UserType) => {
    userData.value = authData;
  };

  /** Efface les données utilisateur (déconnexion) */
  const clearUser = () => {
    userData.value = null;
  };

  /**
   * Met à jour les données dans PocketBase
   * @param newData - Données à mettre à jour (UserType ou FormData)
   */
  const updateUser = async (newData: UserType | FormData) => {
    try {
      await pocketbase.pb.collection('user').update(userData.value!.id, newData);
      return true;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update user data.');
    }
  };

  /**
   * Vérifie si les données ont été modifiées
   * @param data - Données actuelles dans le formulaire
   * @returns true si modifié
   */
  const userDataHasEdited = async (data: UserType) => {
    return JSON.stringify(data) !== JSON.stringify(userData.value);
  };

  return {
    userData,
    saveUserData,
    clearUser,
    updateUser,
    userDataHasEdited,
  };
});

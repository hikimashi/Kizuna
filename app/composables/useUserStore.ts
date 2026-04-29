import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';

export const useUserStore = defineStore('userStore', () => {
  const pocketbase = usePocketbaseStore();
  const userData = ref<UserType | null>(null);

  const saveUserData = (authData: UserType) => {
    userData.value = authData;
  };

  const clearUser = () => {
    userData.value = null;
  };

  const updateUser = async (newData: UserType | FormData) => {
    try {
      await pocketbase.pb.collection('user').update(userData.value!.id, newData);
      return true;
    } catch (error: any) {
      throw new Error(error?.message || 'Échec de la mise à jour des données utilisateur. Réessayez.');
    }
  };

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

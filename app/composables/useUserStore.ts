import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';

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
      throw new Error(error?.message || 'Echec de la mise a jour des données utilisateur. Reessayez.');
    }
  };

  return {
    userData,
    saveUserData,
    clearUser,
    updateUser,
  };
});

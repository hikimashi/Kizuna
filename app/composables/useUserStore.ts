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

  const updateUser = async (newData: Partial<UserType> | FormData) => {
    try {
      // If updating with a UserType object, we need to extract only the fields we want to update
      let updateData: any;
      if (!(newData instanceof FormData)) {
        // Extract only the fields that should be updated in the database
        const { id, token, password, passwordConfirm, oldPassword, ...updateFields } = newData;

        // Use the same field names as defined in UserType interface
        // Assuming PocketBase collection has the same field names
        updateData = { ...updateFields };

        // Remove undefined values to avoid overwriting existing data
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });
      } else {
        updateData = newData;
      }

      await pocketbase.pb.collection('user').update(userData.value!.id, updateData);

      // Update the local user data with the changes
      if (!(newData instanceof FormData)) {
        Object.assign(userData.value!, newData);
      }

      return true;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update user data. Please try again.');
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

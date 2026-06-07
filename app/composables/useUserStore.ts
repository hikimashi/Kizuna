import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


export const useUserStore = defineStore('userStore', () => {
  const pocketbase = usePocketbaseStore();
  const userData = ref<UserType | null>(null);

  /**
   * Enregistre user data.
   *
   * @param authData - Valeur utilisée par le traitement « save user data ».
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const saveUserData = (authData: UserType) => {
    userData.value = authData;
  };

  /**
   * Efface user.
   *
   * @returns Aucune valeur.
   * @sideEffects modifie l'état réactif.
   */
  const clearUser = () => {
    userData.value = null;
  };

  /**
   * Met à jour user.
   *
   * @param newData - Valeur utilisée par le traitement « update user ».
   * @returns Une promesse résolue avec le résultat du traitement.
   * @sideEffects effectue des appels réseau ou persistants.
   */
  const updateUser = async (newData: UserType | FormData) => {
    try {
      await pocketbase.pb.collection('user').update(userData.value!.id, newData);
      return true;
    } catch (error: any) {
      throw new Error(error?.message || 'Échec de la mise à jour des données utilisateur. Réessayez.');
    }
  };

  return {
    userData,
    saveUserData,
    clearUser,
    updateUser,
  };
});

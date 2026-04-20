import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';

// Ce store conserve les donnees de l'utilisateur connecte cote front.
// Il sert de source simple pour afficher ou modifier le profil sans relire partout PocketBase.
export const useUserStore = defineStore('userStore', () => {
  // Acces centralise au client PocketBase et aux donnees utilisateur locales.
  const pocketbase = usePocketbaseStore();
  const userData = ref<UserType | null>(null);

  // Sauvegarde la version courante des donnees utilisateur dans le store.
  const saveUserData = (authData: UserType) => {
    userData.value = authData;
  };

  // Vide completement l'utilisateur courant, par exemple apres une deconnexion.
  const clearUser = () => {
    userData.value = null;
  };

  // Envoie les modifications utilisateur a PocketBase.
  const updateUser = async (newData: UserType | FormData) => {
    try {
      // userData.value!.id suppose qu'un utilisateur est deja charge dans le store.
      await pocketbase.pb.collection('user').update(userData.value!.id, newData);
      return true;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update user data. Please try again.');
    }
  };

  // Compare les donnees affichees au snapshot local pour savoir si un formulaire a change.
  const userDataHasEdited = async (data: UserType) => {
    // JSON.stringify est une comparaison simple ici :
    // si le texte final change, on considere que les donnees ont ete modifiees.
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

/*
Definition des termes techniques :
- snapshot : etat capture a un instant donne servant de reference.
- FormData : structure navigateur utilisee pour envoyer des champs, notamment des fichiers.
- store : module centralise qui partage des donnees entre plusieurs vues.
- deconnexion : action qui ferme la session d'un utilisateur.
*/

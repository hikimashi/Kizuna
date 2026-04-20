import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AlertType, AlertTypeValue } from '#shared/types/AlertType';

// Ce store sert a piloter une fenetre d'alerte partagée dans toute l'application.
// L'idée est simple :
// 1. on stocke les informations de l'alerte a afficher,
// 2. on memorise quoi faire si l'utilisateur accepte ou refuse,
// 3. on nettoie tout quand l'alerte est terminee.
export const useAlertStore = defineStore('useAlertStore', () => {
  // Etat reactif de l'alerte actuellement visible.
  const alert = ref<AlertType | null>(null);

  // Fonctions appelees quand l'utilisateur accepte ou refuse l'alerte.
  const onAcceptRef = ref<() => void>();
  const onDenyRef = ref<() => void>();
  const showDenyButton = ref(true);

  // Ouvre une alerte et renvoie une promesse resolue selon le choix utilisateur.
  const openAlert = ({ type, message, showDeny = true }: { type: AlertTypeValue; message: string; showDeny?: boolean }): Promise<boolean> => {
    return new Promise(resolve => {
      // On place ici les donnees que le composant d'interface va lire pour s'afficher.
      alert.value = { type, message };
      showDenyButton.value = showDeny;

      // Si l'utilisateur accepte, on renvoie true au code appelant puis on nettoie.
      onAcceptRef.value = () => {
        resolve(true);
        clearAlert();
      };
      // Si l'utilisateur refuse, on renvoie false puis on remet le store a zero.
      onDenyRef.value = () => {
        resolve(false);
        clearAlert();
      };
    });
  };

  // Nettoie l'etat pour eviter de reutiliser d'anciens callbacks.
  const clearAlert = () => {
    alert.value = null;
    onAcceptRef.value = undefined;
    onDenyRef.value = undefined;
  };

  return {
    openAlert,
    alert,
    clearAlert,
    onAcceptRef,
    onDenyRef,
    showDenyButton,
  };
});

/*
Definition des termes techniques :
- store : espace centralise qui conserve un etat partage dans l'application.
- etat reactif : donnée observée automatiquement par Vue pour mettre a jour l'interface.
- callback : fonction executée plus tard en réponse a une action.
- promesse : objet JavaScript representant un résultat asynchrone futur.
*/

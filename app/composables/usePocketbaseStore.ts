import { defineStore } from 'pinia';
import { ref } from 'vue';
import PocketBase from 'pocketbase';

// Ce store encapsule le client PocketBase.
// Il expose a la fois :
// - l'instance pb pour faire des appels API,
// - quelques refs reactives pour suivre l'etat de connexion.
export const usePocketbaseStore = defineStore('usePocketBaseStore', () => {
  // Instancie le client PocketBase avec l'URL exposee par la configuration publique.
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.public.pocketbaseUrl as string);

  // Refs reactives exposees pour suivre l'etat d'authentification courant.
  const authRecord = ref(pb.authStore.model);
  const authToken = ref(pb.authStore.token);
  const isAuthValid = ref(pb.authStore.isValid);

  // Synchronise les refs avec le store interne de PocketBase et ecoute les changements futurs.
  const initializeAuthState = () => {
    // Copie l'etat actuel au moment de l'initialisation.
    authRecord.value = pb.authStore.model;
    authToken.value = pb.authStore.token;
    isAuthValid.value = pb.authStore.isValid;

    // Repercute automatiquement toute evolution de la session PocketBase.
    pb.authStore.onChange((token, model) => {
      // A chaque changement, on recopie les nouvelles valeurs dans les refs Vue.
      authRecord.value = model;
      authToken.value = token;
      isAuthValid.value = pb.authStore.isValid;
    }, true); // Le second argument force un premier rappel immediat avec l'etat courant.
  };

  // Initialise immediatement le suivi de session des la creation du store.
  initializeAuthState();

  return {
    pb,
    authRecord,
    authToken,
    isAuthValid,
  };
});

/*
Definition des termes techniques :
- client : objet logiciel charge de parler a un service distant.
- runtime config : configuration injectee au lancement de l'application.
- ref reactive : valeur observee par Vue pour declencher des mises a jour d'interface.
- listener : fonction qui ecoute un evenement ou un changement d'etat.
- auth store : mecanisme interne de PocketBase qui conserve la session courante.
*/

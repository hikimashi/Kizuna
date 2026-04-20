import { defineStore } from 'pinia';
import { ref } from 'vue';

export type DrawerName = 'drawerLogin' | 'drawerCreateUser';

// Ce store gere l'ouverture et la fermeture des drawers de l'interface.
// Un drawer est simplement un panneau qui s'affiche par-dessus la page.
export const useDrawersStore = defineStore('drawersStore', () => {
  // Nom du tiroir actuellement visible dans l'interface.
  const currentDrawer = ref<DrawerName | ''>('');
  const isOpen = ref<boolean>(false);

  // Ouvre le tiroir demande et memorise son identifiant.
  const openDrawer = (name: DrawerName) => {
    // On retient quel drawer afficher...
    currentDrawer.value = name;
    // ...puis on signale qu'il doit etre visible.
    isOpen.value = true;
  };

  // Ferme tout tiroir et remet l'etat a neutre.
  const closeDrawer = () => {
    currentDrawer.value = '';
    isOpen.value = false;
  };

  return {
    currentDrawer,
    isOpen,
    openDrawer,
    closeDrawer,
  };
});

/*
Definition des termes techniques :
- drawer : panneau lateral ou flottant qui s'ouvre au-dessus de la page.
- store : module centralise qui partage un etat commun.
- ref : conteneur reactif Vue pour suivre une valeur.
*/

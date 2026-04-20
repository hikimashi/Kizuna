import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ToastType, ToastTypeValue } from '#shared/types/ToastType';

// Ce store gere les petites notifications temporaires affichees a l'ecran.
// Chaque toast est ajoute, reste visible quelques secondes, puis disparait.
export const useToastStore = defineStore('useToastStore', () => {
  // File reactive des notifications temporaires a afficher.
  const toasts = ref<ToastType[]>([]);
  const lastToastKey = ref('');
  const lastToastAt = ref(0);

  // Cree une notification et ignore les doublons emis presque au meme instant.
  const openToast = ({ type, message }: { type: ToastTypeValue; message: string }) => {
    // La cle sert a reconnaitre "le meme toast" si deux actions proches le declenchent.
    const key = `${type}:${message}`;
    const now = Date.now();

    // Evite les toasts dupliques declenches quasi simultanement.
    if (lastToastKey.value === key && now - lastToastAt.value < 800) return;
    lastToastKey.value = key;
    lastToastAt.value = now;

    // On utilise l'heure actuelle comme identifiant simple.
    const id = Date.now();

    toasts.value.push({ id, type, message });

    // Quelques secondes plus tard, on retire automatiquement ce toast.
    setTimeout(() => {
      toasts.value = toasts.value.filter(toast => toast.id !== id);
    }, 3000);
  };

  // Expose une lecture derivee des notifications courantes.
  const getToasts = computed(() => toasts);

  return {
    openToast,
    toasts,
    getToasts,
  };
});

/*
Definition des termes techniques :
- toast : petite notification visuelle temporaire.
- computed : valeur derivee automatiquement recalculee par Vue.
- middleware : couche intermediaire qui intercepte une action ou une navigation.
- reactif : qualifie une donnee observee pour mettre a jour l'interface.
*/

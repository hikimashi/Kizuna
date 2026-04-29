<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Retour AniList</h1>
    <p v-if="!processed">Traitement de l'autorisation AniList...</p>
    <p v-else-if="success">Compte AniList lié avec succès. Redirection...</p>
    <p v-else>Erreur lors de la liaison du compte AniList. Veuillez réessayer.</p>
  </div>
</template>

<script setup lang="ts">
import { useAnilistAuthStore } from '~/composables/useAnilistAuthStore';
import { useRouter } from '#app';

const route = useRoute();
const router = useRouter();
const anilistAuthStore = useAnilistAuthStore();

const code = computed(() => route.query.code as string);
const state = computed(() => route.query.state as string);

const processed = ref(false);
const success = ref(false);

onMounted(async () => {
  if (code.value) {
    // Traite le retour OAuth AniList puis met a jour l'etat de l'interface.
    const result = await anilistAuthStore.handleCallback(code.value, state.value);
    processed.value = true;
    success.value = result;

    // Redirige vers l'accueil apres un court delai pour laisser le message visible.
    setTimeout(() => {
      router.push('/');
    }, 2000);
  } else {
    // Aucun code : callback invalide ou annulé.
    processed.value = true;
    success.value = false;
  }
});
</script>

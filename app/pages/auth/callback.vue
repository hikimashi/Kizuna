<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">AniList Callback</h1>
    <p v-if="!processed">Processing AniList authorization...</p>
    <p v-else-if="success">AniList account linked successfully! Redirecting...</p>
    <p v-else>Error linking AniList account. Please try again.</p>
  </div>
</template>

<script setup lang="ts">
import { useAnilistAuthStore } from '~/composables/useAnilistAuthStore';
import { useRouter } from '#app';

// Cette page est la destination de retour apres la connexion OAuth AniList.
// Son travail est simple :
// 1. lire le code dans l'URL,
// 2. demander au store de traiter la liaison,
// 3. afficher un message puis rediriger vers l'accueil.

const route = useRoute();
const router = useRouter();
const anilistAuthStore = useAnilistAuthStore();

const code = computed(() => route.query.code as string);
const state = computed(() => route.query.state as string);

const processed = ref(false);
const success = ref(false);

onMounted(async () => {
  if (code.value) {
    // Si un code existe, on peut tenter la finalisation de la liaison AniList.
    const result = await anilistAuthStore.handleCallback(code.value, state.value);
    processed.value = true;
    success.value = result;

    // Petit delai pour laisser le message visible avant de repartir vers l'accueil.
    setTimeout(() => {
      router.push('/');
    }, 2000);
  } else {
    // Sans code, le retour OAuth est incomplet ou invalide.
    processed.value = true;
    success.value = false;
  }
});
</script>

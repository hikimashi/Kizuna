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

const route = useRoute();
const router = useRouter();
const anilistAuthStore = useAnilistAuthStore();

const code = computed(() => route.query.code as string);
const state = computed(() => route.query.state as string);

const processed = ref(false);
const success = ref(false);

onMounted(async () => {
  if (code.value) {
    // Traite le retour OAuth AniList puis met à jour l'état UI.
    const result = await anilistAuthStore.handleCallback(code.value, state.value);
    processed.value = true;
    success.value = result;
    
    // Redirige vers l'accueil après un court délai pour laisser le message visible.
    setTimeout(() => {
      router.push('/');
    }, 2000);
  } else {
    // Aucun code => callback invalide ou annulé.
    processed.value = true;
    success.value = false;
  }
});
</script>

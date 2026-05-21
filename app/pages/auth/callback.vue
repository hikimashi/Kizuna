<template>
  <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
    <div class="card w-full max-w-xl border border-base-300/40 bg-base-200/80 shadow-xl backdrop-blur">
      <div class="card-body items-center text-center">
        <div class="badge badge-primary badge-outline">AniList</div>
        <h1 class="card-title text-2xl sm:text-3xl">Retour AniList</h1>
        <p class="max-w-md text-sm leading-6 text-base-content/80 sm:text-base">
          {{ statusMessage }}
        </p>
        <div class="mt-2">
          <span
            class="loading loading-dots loading-md"
            :class="processed ? (success ? 'text-success' : 'text-error') : 'text-primary'"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
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

const statusMessage = computed(() => {
  if (!processed.value) return "Traitement de l'autorisation AniList..."
  if (success.value) return 'Compte AniList lié avec succès. Redirection...'
  return 'Erreur lors de la liaison du compte AniList. Veuillez réessayer.'
})

onMounted(async () => {
  if (code.value) {
    // Traite le retour OAuth AniList puis met à jour l'état de l'interface.
    const result = await anilistAuthStore.handleCallback(code.value, state.value);
    processed.value = true;
    success.value = result;

    // Redirige vers l'accueil après un court délai pour laisser le message visible.
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

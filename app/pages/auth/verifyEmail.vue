<template>
  <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
    <div class="card w-full max-w-xl border border-base-300/40 bg-base-200/85 shadow-xl backdrop-blur">
      <div class="card-body items-center text-center">
        <div class="badge badge-primary badge-outline">Compte</div>
        <h1 class="card-title text-2xl sm:text-3xl">Verification de l'e-mail</h1>

        <p class="max-w-md text-sm leading-6 text-base-content/80 sm:text-base">
          {{ statusMessage }}
        </p>

        <div class="mt-2">
          <span
            class="loading loading-dots loading-md"
            :class="status === 'pending' ? 'text-primary' : status === 'success' ? 'text-success' : 'text-error'"
            aria-hidden="true"
          />
        </div>

        <div class="card-actions mt-4">
          <button class="btn btn-primary" @click="goHome">Retour à l'accueil</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────


const route = useRoute();
const router = useRouter();
const pocketbaseStore = usePocketbaseStore();

const status = ref<'pending' | 'success' | 'error'>('pending');
const errorMessage = ref("Lien de vérification invalide ou expiré.");

const statusMessage = computed(() => {
  if (status.value === 'pending') return "Verification de votre adresse e-mail...";
  if (status.value === 'success') return 'Votre adresse e-mail a été vérifiée. Vous pouvez maintenant vous connecter.';
  return errorMessage.value;
});

const token = computed(() => {
  const value = route.query.token;
  return typeof value === 'string' ? value : '';
});

/**
 * Calcule la valeur « go home ».
 *
 * @returns Une promesse résolue une fois le traitement terminé.
 * @sideEffects modifie l'état réactif.
 */
const goHome = async () => {
  await router.push('/');
};

onMounted(async () => {
  if (!token.value) {
    status.value = 'error';
    return;
  }

  try {
    await pocketbaseStore.pb.collection('user').confirmVerification(token.value);
    status.value = 'success';
  } catch (error: any) {
    errorMessage.value = error?.message || "Impossible de vérifier votre adresse e-mail.";
    status.value = 'error';
  }
});
</script>

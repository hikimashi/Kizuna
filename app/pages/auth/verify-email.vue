<template>
  <div class="container mx-auto max-w-xl p-4 sm:p-6">
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body items-center text-center">
        <h1 class="card-title text-2xl">Email Verification</h1>

        <p v-if="status === 'pending'">Verifying your email address...</p>
        <p v-else-if="status === 'success'">Your email has been verified. You can now log in.</p>
        <p v-else>{{ errorMessage }}</p>

        <div class="card-actions mt-4">
          <button class="btn btn-primary" @click="goHome">Go to home</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';

const route = useRoute();
const router = useRouter();
const pocketbaseStore = usePocketbaseStore();

const status = ref<'pending' | 'success' | 'error'>('pending');
const errorMessage = ref('Invalid or expired verification link.');

const token = computed(() => {
  const value = route.query.token;
  return typeof value === 'string' ? value : '';
});

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
    errorMessage.value = error?.message || 'Unable to verify your email.';
    status.value = 'error';
  }
});
</script>

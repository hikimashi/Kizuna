<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body items-center text-center">
        <h2 class="card-title text-2xl">AniList Account Verification</h2>
        <p class="py-4 text-center">
          To enhance your profile with anime and manga information, please connect your AniList account.
        </p>
        <div class="card-actions justify-center pt-4">
          <button 
            @click="connectToAnilist()" 
            class="btn btn-primary w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-anilist mr-2" viewBox="0 0 16 16">
              <!-- AniList icon - simplified representation -->
              <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
              <circle cx="8" cy="8" r="3"/>
            </svg>
            Connect to AniList
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnilistAuth } from '~/composables/useAnilistAuth';
import { useMyAuthStore } from '~/composables/useMyAuthStore';

const anilistAuth = useAnilistAuth();
const myAuthStore = useMyAuthStore();

const connectToAnilist = async () => {
  await anilistAuth.initiateAnilistAuth();
};

// Check if user already has AniList connected, redirect to profile if so
onMounted(() => {
  if (!myAuthStore.needsAnilistAuth()) {
    navigateTo('/profilePage');
  }
});
</script>

<style scoped>
.bi-anilist {
  /* Simple AniList-like icon */
}
</style>
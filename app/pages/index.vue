<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Welcome to Kizuna</h1>
    
    <!-- Using client-only to prevent hydration mismatch -->
    <ClientOnly>
      <!-- Check if user is authenticated with PocketBase -->
      <div v-if="!pocketbaseStore.authRecord">
        <p>Please log in</p>
      </div>
      <div v-else>
        <!-- Check if user has AniList token -->
        <div v-if="!pocketbaseStore.authRecord.anilist_token || 
                   !pocketbaseStore.authRecord.anilist_token.trim()">
          <button @click="loginWithAniList" class="btn btn-info">
            Link AniList Account
          </button>
        </div>
        <div v-else>
          <p>AniList account linked</p>
        </div>
      </div>
      
      <template #fallback>
        <p>Loading...</p>
      </template>
    </ClientOnly>
    
    <ScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { usePocketbaseStore } from '~/composables/usePocketbaseStore';
import { useAnilistAuthStore } from '~/composables/useAnilistAuthStore';

const pocketbaseStore = usePocketbaseStore();
const anilistAuthStore = useAnilistAuthStore();

const loginWithAniList = () => {
  anilistAuthStore.loginWithAniList();
};

// Watch for changes in the auth store to reactively update the UI
watch(() => pocketbaseStore.authRecord?.anilist_token, () => {
  // The component will automatically re-render when the token changes
}, { immediate: true });
</script>
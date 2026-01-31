<template>
  <div class="flex justify-center items-center min-h-screen">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg"></div>
      <p class="mt-4 text-lg">Processing AniList authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from '#app';
import { useRoute } from '#app';
import { useAnilistAuth } from '~/composables/useAnilistAuth';
import { useAlertStore } from '~/composables/useAlertStore';
import { useMyAuthStore } from '~/composables/useMyAuthStore';
import { useUserStore } from '~/composables/useUserStore';

const route = useRoute();
const anilistAuth = useAnilistAuth();
const alertStore = useAlertStore();
const myAuthStore = useMyAuthStore();
const userStore = useUserStore();

// On component mount, check for the authorization code in the URL
onMounted(async () => {
  // normalize code param (can be string | string[] | undefined)
  const rawCode = route.query.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : (rawCode as string | undefined);

  // state param validation
  const rawState = route.query.state;
  const state = Array.isArray(rawState) ? rawState[0] : (rawState as string | undefined);
  const storedState = typeof window !== 'undefined' ? sessionStorage.getItem('anilist:state') : null;

  if (!code) {
    console.error('OAuth code missing');
    // Using a timeout to prevent blocking the UI while showing the alert
    setTimeout(() => {
      alertStore.openAlert({
        type: 'error',
        message: 'OAuth code is missing'
      });
    }, 0);
    await navigateTo('/profilePage');
    return;
  }

  if (!state || !storedState || state !== storedState) {
    console.error('State parameter validation failed (CSRF)');
    // clear potential leftover
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('anilist:state');
      }
    } catch (e) { /* ignore */ }

    // Using a timeout to prevent blocking the UI while showing the alert
    setTimeout(() => {
      alertStore.openAlert({
        type: 'error',
        message: 'Invalid state parameter. Please try again.'
      });
    }, 0);

    await navigateTo({ path: '/profilePage', query: { error: 'invalid_state' } });
    return;
  }

  // prevent duplicate exchanges (e.g. page reloads, HMR)
  const processingKey = 'auth:processing';
  if (typeof window !== 'undefined' && sessionStorage.getItem(processingKey)) {
    console.warn('OAuth callback already processing, aborting duplicate attempt');
    // remove code from URL to be safe
    if (typeof window !== 'undefined' && window.history) {
      history.replaceState({}, '', window.location.pathname);
    }
    return;
  }

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(processingKey, '1');
  }

  try {
    // Handle the AniList callback with the authorization code
    await anilistAuth.handleAnilistCallback(code);

    // Remove code from the URL to avoid re-use on refresh
    if (typeof window !== 'undefined' && window.history) {
      history.replaceState({}, '', window.location.pathname);
    }

    // cleanup state
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('anilist:state');
      }
    } catch (e) { /* ignore */ }

  } catch (err: any) {
    // make error serializable for dev-server and show useful fields
    const clientErr: any = {};
    if (err?.data) clientErr.data = err.data;
    if (err?.statusCode) clientErr.statusCode = err.statusCode;
    if (err?.status) clientErr.status = err.status;
    if (!clientErr.data && err?.response && (err.response as any)._data) {
      clientErr.data = (err.response as any)._data;
    }
    clientErr.message = err?.message ?? String(err);

    console.error('AniList token retrieval error:', clientErr);

    // specific handling when AniList reports the code was revoked/used
    const msg = typeof clientErr.data === 'object' && clientErr.data?.hint ? String(clientErr.data.hint) : clientErr.message;
    if (msg && msg.toLowerCase().includes('revok')) {
      // code was revoked/used -> instruct user to retry login
      // optionally show a user-facing message (here we just redirect to login)
      await navigateTo({ path: '/profilePage', query: { error: 'code_revoked' } });
    } else {
      await navigateTo('/profilePage');
    }
  } finally {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(processingKey);
    }
  }
});
</script>
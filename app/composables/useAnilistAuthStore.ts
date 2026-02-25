import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { useToastStore } from './useToastStore';

export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const toastStore = useToastStore();

  const loginWithAniList = () => {
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store the state in localStorage to verify later
    localStorage.setItem('anilist_oauth_state', state);
    
    // Redirect to AniList OAuth URL
    const anilistClientId = useRuntimeConfig().public.anilistClientId;
    const anilistRedirectUri = useRuntimeConfig().public.anilistRedirectUri;
    
    if (!anilistClientId || !anilistRedirectUri) {
      console.error('Missing AniList configuration. Please check your runtime config.');
      return;
    }
    
    const oauthUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${anilistClientId}&redirect_uri=${encodeURIComponent(anilistRedirectUri)}&response_type=code&state=${state}`;
    
    window.location.href = oauthUrl;
  };

  const handleCallback = async (code: string, state?: string) => {
    try {
      // Verify the state parameter to prevent CSRF attacks
      const storedState = localStorage.getItem('anilist_oauth_state');
      
      // For debugging: skip strict state check if no stored state
      if (state && storedState && storedState !== state) {
        throw new Error('Invalid state parameter');
      }
      
      // Clear the stored state
      localStorage.removeItem('anilist_oauth_state');
      
      // Exchange the authorization code for an access token via server endpoint
      const response = await $fetch('/api/anilist/exchange-token', {
        method: 'POST',
        body: {
          code,
          redirect_uri: useRuntimeConfig().public.anilistRedirectUri
        }
      });
      
      if (!response.access_token) {
        throw new Error('Failed to get access token from AniList');
      }
      
      // Get user data from AniList using the access token
      const anilistUserData = await $fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${response.access_token}`
        },
        body: {
          query: `
            query {
              Viewer {
                id
                name
                avatar {
                  medium
                  large
                }
              }
            }
          `
        }
      });
      
      // Update the user record in PocketBase with AniList data
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) {
        throw new Error('User not authenticated with PocketBase');
      }
      console.log('Updating user with AniList data:', {
        anilist_token: response.access_token,
        anilist_user_id: anilistUserData.data.Viewer.id,
      });
      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token,
        anilist_user_id: anilistUserData.data.Viewer.id,
        anilist_username: anilistUserData.data.Viewer.name,
        anilist_avatar_url_medium: anilistUserData.data.Viewer.avatar.medium,
        anilist_avatar_url_large: anilistUserData.data.Viewer.avatar.large
      });
      
      // Refresh the auth store to update the local user data
      await pocketbaseStore.pb.collection('user').authRefresh();
      
      toastStore.openToast({
        type: 'success',
        message: 'AniList account linked successfully!'
      });
      
      return true;
    } catch (error: any) {
      console.error('AniList OAuth error:', error);
      
      toastStore.openToast({
        type: 'error',
        message: error.message || 'Failed to link AniList account'
      });
      
      return false;
    }
  };

  return {
    loginWithAniList,
    handleCallback
  };
});
import { defineStore } from 'pinia';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { useToastStore } from './useToastStore';
import { useAppConfig } from './useAppConfig';

export const useAnilistAuthStore = defineStore('anilistAuth', () => {
  const pocketbaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const toastStore = useToastStore();
  const { fetchConfig } = useAppConfig();

  const loginWithAniList = async () => {
    const config = await fetchConfig();
    
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem('anilist_oauth_state', state);
    
    const anilistClientId = config.anilistClientId;
    const anilistRedirectUri = config.anilistRedirectUri;
    
    if (!anilistClientId || !anilistRedirectUri) {
      console.error('Missing AniList configuration. Please check your runtime config.');
      return;
    }
    
    const oauthUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${anilistClientId}&redirect_uri=${encodeURIComponent(anilistRedirectUri)}&response_type=code&state=${state}`;
    
    window.location.href = oauthUrl;
  };

  const handleCallback = async (code: string, state?: string) => {
    try {
      const config = await fetchConfig();
      
      const storedState = localStorage.getItem('anilist_oauth_state');
      
      if (state && storedState !== state) {
        throw new Error('Invalid state parameter');
      }
      
      localStorage.removeItem('anilist_oauth_state');
      
      const response = await $fetch<{ access_token: string }>('/api/anilist/exchange-token', {
        method: 'POST',
        body: {
          code,
          redirect_uri: config.anilistRedirectUri
        }
      });
      
      if (!response.access_token) {
        throw new Error('Failed to get access token from AniList');
      }
      
      const anilistUserData = await $fetch<{ data: { Viewer: { id: number; name: string; avatar: { medium: string } } } }>('https://graphql.anilist.co', {
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
                }
              }
            }
          `
        }
      });
      
      const userId = pocketbaseStore.pb.authStore.model?.id;
      if (!userId) {
        throw new Error('User not authenticated with PocketBase');
      }
      
      await pocketbaseStore.pb.collection('user').update(userId, {
        anilist_token: response.access_token,
        anilist_user_id: anilistUserData.data.Viewer.id,
        anilist_username: anilistUserData.data.Viewer.name,
        anilist_avatar_url: anilistUserData.data.Viewer.avatar.medium
      });
      
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
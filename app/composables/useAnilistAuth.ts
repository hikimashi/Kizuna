import { defineStore } from 'pinia';
import { navigateTo } from '#app';
import { usePocketbaseStore } from './usePocketbaseStore';
import { useUserStore } from './useUserStore';
import { useToastStore } from './useToastStore';
import { useAlertStore } from './useAlertStore';

export const useAnilistAuth = defineStore('anilistAuth', () => {
  const pocketBaseStore = usePocketbaseStore();
  const userStore = useUserStore();
  const toastStore = useToastStore();
  const alertStore = useAlertStore();

  /**
   * Initiates the AniList OAuth flow by redirecting the user to the AniList authorization URL
   */
  const initiateAnilistAuth = () => {
    // Get environment variables for AniList OAuth
    const config = useRuntimeConfig();
    const clientId = config.public.anilistClientId;
    const redirectUri = config.public.anilistRedirectUri;

    if (!clientId || !redirectUri) {
      // Using a timeout to prevent blocking the UI while showing the alert
      setTimeout(() => {
        alertStore.openAlert({
          type: 'error',
          message: 'AniList OAuth is not properly configured. Please contact the administrator.'
        });
      }, 0);
      return;
    }

    // Generate a random state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store the state in sessionStorage for validation later
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('anilist:state', state);
    }

    // Construct the authorization URL with state parameter
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

    // Redirect to Anilist for authentication using Nuxt's navigateTo
    navigateTo(authUrl, { external: true });
  };

  /**
   * Handles the OAuth callback from AniList and exchanges the authorization code for an access token
   * @param code The authorization code received from AniList
   */
  const handleAnilistCallback = async (code: string) => {
    try {
      console.log('Starting AniList token exchange with code:', code.substring(0, 5) + '...');

      // Exchange authorization code for access token using our server endpoint
      const response = await $fetch('/api/anilist/exchange-token', {
        method: 'POST',
        body: { code }
      });

      if (!response || !response.success) {
        console.error('Token exchange unsuccessful:', response);
        throw new Error(response?.statusMessage || 'Failed to exchange code for token');
      }

      const tokenData = response.data;
      const accessToken = tokenData.access_token;

      console.log('Token exchange successful, proceeding with user data fetch');

      // Fetch user data from AniList using the access token
      const anilistUserData = await fetchAnilistUser(accessToken);

      // Update the user's profile in PocketBase with AniList data
      await updateAnilistUserData(anilistUserData, accessToken);

      toastStore.openToast({
        type: 'success',
        message: 'Successfully connected to AniList!'
      });

      // Don't redirect here - the callback page handles the redirect
      return { success: true, data: response };

    } catch (error: any) {
      console.error('AniList OAuth error:', error);
      throw error; // Re-throw the error so the callback page can handle it
    }
  };

  /**
   * Fetches user data from AniList using the access token
   * @param accessToken The access token obtained from AniList OAuth
   * @returns Promise resolving to the user data from AniList
   */
  const fetchAnilistUser = async (accessToken: string) => {
    const query = `
      query {
        Viewer {
          id
          name
          avatar {
            large
          }
        }
      }
    `;

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
      }

      return result.data.Viewer;
    } catch (error) {
      console.error('Error fetching AniList user:', error);
      throw error;
    }
  };

  /**
   * Updates the user's profile in PocketBase with AniList data
   * @param anilistUserData The user data fetched from AniList
   * @param accessToken The AniList access token to store
   */
  const updateAnilistUserData = async (anilistUserData: any, accessToken: string) => {
    if (!userStore.userData) {
      throw new Error('User not authenticated');
    }

    try {
      // Update the user record in PocketBase with AniList data
      await pocketBaseStore.pb.collection('user').update(userStore.userData.id, {
        anilist_user_id: anilistUserData.id.toString(),
        anilist_username: anilistUserData.name,
        anilist_avatar_url: anilistUserData.avatar?.large,
        anilist_token: accessToken,
        anilist_token_expires_at: calculateTokenExpiryDate(), // Since AniList tokens don't expire for a year, we'll set a date 1 year from now
      });

      // Update the local user data
      userStore.userData.anilist_user_id = anilistUserData.id.toString();
      userStore.userData.anilist_username = anilistUserData.name;
      userStore.userData.anilist_avatar_url = anilistUserData.avatar?.large;
      userStore.userData.anilist_token = accessToken;

      toastStore.openToast({
        type: 'success',
        message: 'AniList data successfully saved to your profile'
      });
    } catch (error) {
      console.error('Error updating user data in PocketBase:', error);
      throw error;
    }
  };

  /**
   * Calculates the expiry date for the AniList token (1 year from now)
   * Note: According to the requirements, AniList tokens don't actually expire,
   * but we'll set a date 1 year from now as a reference point
   */
  const calculateTokenExpiryDate = (): string => {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1); // Add 1 year
    return now.toISOString();
  };

  /**
   * Checks if the user has a valid AniList token
   * @returns boolean indicating if the user has a valid AniList token
   */
  const hasValidAnilistToken = (): boolean => {
    if (!userStore.userData?.anilist_token) {
      return false;
    }

    // Check if the token exists and hasn't expired (though AniList tokens don't actually expire)
    const tokenExpiry = userStore.userData.anilist_token_expires_at;
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      return new Date() < expiryDate;
    }

    // If no expiry date is set, assume the token is valid
    return !!userStore.userData.anilist_token;
  };

  /**
   * Refreshes the AniList token if needed
   * Note: Since AniList tokens don't expire, this function might not be needed,
   * but we'll implement it for completeness
   */
  const refreshAnilistTokenIfNeeded = async () => {
    if (!hasValidAnilistToken()) {
      // If the token is invalid or expired, initiate the auth flow again
      initiateAnilistAuth();
    }
  };

  /**
   * Disconnects the user's AniList account by removing the token and related data
   */
  const disconnectAnilistAccount = async () => {
    if (!userStore.userData) {
      throw new Error('User not authenticated');
    }

    try {
      // Clear AniList data from the user record in PocketBase
      await pocketBaseStore.pb.collection('user').update(userStore.userData.id, {
        anilist_user_id: null,
        anilist_username: null,
        anilist_avatar_url: null,
        anilist_token: null,
        anilist_token_expires_at: null,
      });

      // Update the local user data
      userStore.userData.anilist_user_id = undefined;
      userStore.userData.anilist_username = undefined;
      userStore.userData.anilist_avatar_url = undefined;
      userStore.userData.anilist_token = undefined;

      toastStore.openToast({
        type: 'info',
        message: 'AniList account disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting AniList account:', error);
      throw error;
    }
  };

  return {
    initiateAnilistAuth,
    handleAnilistCallback,
    fetchAnilistUser,
    updateAnilistUserData,
    hasValidAnilistToken,
    refreshAnilistTokenIfNeeded,
    disconnectAnilistAccount,
  };
});
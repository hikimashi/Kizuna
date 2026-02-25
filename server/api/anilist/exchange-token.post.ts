// server/api/anilist/exchange-token.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  const body = await readBody(event);
  const { code, redirect_uri } = body;
  
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is required'
    });
  }
  
  try {
    // Exchange authorization code for access token
    const response = await $fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        grant_type: 'authorization_code',
        client_id: config.public.anilistClientId,
        client_secret: config.anilistClientSecret,
        code,
        redirect_uri,
      },
    });

    return {
      access_token: response.access_token,
      expires_in: response.expires_in,
    };
  } catch (error: any) {
    console.error('Error exchanging AniList code for token:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange authorization code for access token'
    });
  }
});
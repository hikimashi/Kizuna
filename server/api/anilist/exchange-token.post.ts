export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { code } = body;

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is required'
    });
  }

  // Log the incoming request for debugging
  console.log('AniList token exchange request received');
  console.log('Config values present:', {
    clientId: !!config.public.anilistClientId,
    clientSecret: !!config.private.anilistClientSecret,
    redirectUri: !!config.public.anilistRedirectUri,
  });
  console.log('Code parameter present:', !!code);

  // Validate that required config values are present
  if (!config.public.anilistClientId || !config.private.anilistClientSecret || !config.public.anilistRedirectUri) {
    console.error('Missing AniList configuration values');
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Missing AniList credentials'
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await $fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        grant_type: 'authorization_code',
        client_id: config.public.anilistClientId,
        client_secret: config.private.anilistClientSecret,
        code: code,
        redirect_uri: config.public.anilistRedirectUri,
      },
    });

    console.log('AniList token exchange successful');
    return {
      success: true,
      data: tokenResponse
    };
  } catch (error: any) {
    console.error('AniList token exchange error details:', {
      error: error,
      message: error.message,
      status: error.status,
      data: error.data,
      url: 'https://anilist.co/api/v2/oauth/token',
      requestBody: {
        grant_type: 'authorization_code',
        client_id: config.public.anilistClientId,
        // Don't log client_secret for security
        code: code ? 'present' : 'missing',
        redirect_uri: config.public.anilistRedirectUri,
      }
    });

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to exchange code for token'
    });
  }
});
// server/api/anilist/exchangeToken.post.ts
export default defineEventHandler(async (event) => {
  type ExchangeTokenBody = {
    code?: string;
    redirect_uri?: string;
  };

  type AniListTokenResponse = {
    access_token: string;
    expires_in: number;
  };

  const config = useRuntimeConfig(event);

  const body = await readBody<ExchangeTokenBody>(event);
  const { code, redirect_uri } = body;

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is required'
    });
  }

  try {
    // Echange le code OAuth contre un token sans exposer le client_secret au navigateur.
    const response = await $fetch<AniListTokenResponse>('https://anilist.co/api/v2/oauth/token', {
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

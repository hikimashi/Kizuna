// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────

/**
 *  ENDPOINT EXCHANGE TOKEN
 * 
 * Échange le "code" OAuth contre un "token" d'accès AniList.
 * Le client n'envoie que le code (reçu du callback OAuth).
 * Le serveur envoie le code + client_secret (secret) à AniList.
 * 
 * FLUX:
 * 1. Client: POST /api/anilist/exchangeToken { code }
 * 2. Serveur: Appelle AniList avec { code, client_secret }
 * 3. AniList retourne: { access_token, expires_in }
 * 4. Serveur retourne le token au client
 */
export default defineEventHandler(async (event) => {
  type ExchangeTokenBody = {
    code?: string; // Code OAuth d'AniList
    redirect_uri?: string; // L'URI utilisée dans le redirect
  };

  type AniListTokenResponse = {
    access_token: string; // Le token pour future requêtes GraphQL
    expires_in: number; // Durée de vie du token en secondes
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
    // ON ENVOIE À ANILIST:
    // - code: le code reçu du callback OAuth
    // - client_secret: SECRET qui ne doit JAMAIS être exposé au client
    const response = await $fetch<AniListTokenResponse>('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        grant_type: 'authorization_code',
        client_id: config.public.anilistClientId,
        client_secret: config.anilistClientSecret, // JAMAIS exposé au client !
        code,
        redirect_uri,
      },
    });

    // ON REÇOIT D'ANILIST:
    // {
    //   "access_token": "eyJhbGc...",
    //   "expires_in": 31536000,
    //   "token_type": "Bearer"
    // }

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

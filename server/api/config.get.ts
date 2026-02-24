export default defineEventHandler(() => {
  return {
    pocketbaseUrl: process.env.POCKETBASE_URL,
    anilistClientId: process.env.ANILIST_CLIENT_ID,
    anilistRedirectUri: process.env.ANILIST_REDIRECT_URI,
  };
});

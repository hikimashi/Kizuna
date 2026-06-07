// ─────────────────────────────────────────
// SECTION : Logique applicative
// ─────────────────────────────────────────

/**
 *  COMPOSABLE GRAPHQL ANILIST (CLIENT SIDE)
 * 
 * C'est le client qui utilise ce composable pour faire des requêtes GraphQL.
 * Le composable envoie la requête au serveur Nitro qui la transmet à AniList.
 * 
 * FLUX CLIENT:
 * 1. Component/Page appelle: anilistGraphql.request(query, variables, options)
 * 2. Envoie POST /api/anilist/graphql { query, variables, token }
 * 3. Le serveur traite la requête (voir server/api/anilist/graphql.post.ts)
 * 4. Reçoit le JSON depuis AniList
 * 5. Le client reçoit: { data: { ... } } ou { errors: [...] }
 */

type AniListGraphqlOptions = {
  token?: string // Token d'authentification de l'utilisateur
  cacheTtlMs?: number // Durée du cache en millisecondes
  skipCache?: boolean // Ignorer le cache et forcer une requête à AniList
}

/**
 * Calcule la valeur « anilist graphql ».
 *
 * @returns Le résultat calculé par la fonction.
 * @sideEffects effectue des appels réseau ou persistants.
 */
export const useAnilistGraphql = () => {
  /**
   * @param query - La requête GraphQL (string)
   * @param variables - Variables de la requête
   * @param options - Options (token, cache, etc.)
   * @returns Réponse GraphQL: { data: {...} } ou { errors: [...] }
   */
  const request = async <T = any>(
    query: string,
    variables: Record<string, any> = {},
    options: AniListGraphqlOptions = {}
  ): Promise<T> => {
    try {
      //  ENVOIE LA REQUÊTE AU SERVEUR NITRO
      const response = await $fetch('/api/anilist/graphql', {
        method: 'POST',
        body: {
          query, // ex: "query { Viewer { id name } }"
          variables, // ex: { userId: 123 }
          token: options.token ?? '', // Token du user (vide si anon)
          cacheTtlMs: options.cacheTtlMs,
          skipCache: options.skipCache
        }
      })

      //  REÇOIT LE JSON DEPUIS LE SERVEUR (qui l'a reçu d'AniList)
      // Retour au component qui a appelé ce composable
      return response as T
    } catch (error: any) {
      // Le proxy renvoie parfois les erreurs GraphQL dans error.data; les appelants les interpretent eux-memes.
      if (error?.data !== undefined) {
        return error.data as T
      }

      throw error
    }
  }

  return { request }
}

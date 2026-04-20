type AniListGraphqlOptions = {
  token?: string
  cacheTtlMs?: number
  skipCache?: boolean
}

// Ce composable est un petit "pont" entre le front Nuxt et notre endpoint serveur.
// Au lieu de reecrire partout le meme $fetch, on passe toujours par request().
export const useAnilistGraphql = () => {
  // Enveloppe unique pour centraliser les appels GraphQL vers l'endpoint serveur Nuxt.
  const request = async <T = any>(
    query: string,
    variables: Record<string, any> = {},
    options: AniListGraphqlOptions = {}
  ): Promise<T> => {
    // On envoie au serveur :
    // - la requete GraphQL,
    // - les variables de la requete,
    // - le token eventuel,
    // - les options de cache.
    const response = await $fetch('/api/anilist/graphql', {
      method: 'POST',
      body: {
        query,
        variables,
        token: options.token ?? '',
        cacheTtlMs: options.cacheTtlMs,
        skipCache: options.skipCache
      }
    })

    // On cast la reponse dans le type demande par l'appelant.
    return response as T
  }

  return { request }
}

/*
Definition des termes techniques :
- endpoint : point d'entree HTTP cible par une requete.
- GraphQL : format de requete permettant de choisir les donnees renvoyees par l'API.
- generique : parametre de type TypeScript reutilisable, ici represente par T.
- cache : stockage temporaire d'une reponse pour eviter des appels repetes.
- TTL : duree de vie d'une entree de cache avant expiration.
*/

type AniListGraphqlOptions = {
  token?: string
  cacheTtlMs?: number
  skipCache?: boolean
}

export const useAnilistGraphql = () => {
  const request = async <T = any>(
    query: string,
    variables: Record<string, any> = {},
    options: AniListGraphqlOptions = {}
  ): Promise<T> => {
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

    return response as T
  }

  return { request }
}
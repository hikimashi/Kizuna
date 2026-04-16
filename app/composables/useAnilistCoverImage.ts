export type AnilistCoverImage = {
  medium?: string | null
  large?: string | null
  extraLarge?: string | null
}

export type AnilistCoverVariant = 'thumb' | 'card' | 'hero'

const buildDensitySrcSet = (candidates: Array<[string | null | undefined, string]>) => {
  const resolved = candidates.filter(([url]) => Boolean(url))
  if (resolved.length === 0) return undefined

  const unique = new Map<string, string>()
  for (const [url, density] of resolved) {
    if (!url) continue
    unique.set(density, url)
  }

  return Array.from(unique.entries()).map(([density, url]) => `${url} ${density}`).join(', ')
}

export const getAnilistCoverSrc = (
  coverImage?: AnilistCoverImage | null,
  variant: AnilistCoverVariant = 'card'
) => {
  if (!coverImage) return ''

  if (variant === 'thumb') {
    return coverImage.medium || coverImage.large || coverImage.extraLarge || ''
  }

  if (variant === 'hero') {
    return coverImage.extraLarge || coverImage.large || coverImage.medium || ''
  }

  return coverImage.large || coverImage.medium || coverImage.extraLarge || ''
}

export const getAnilistCoverSrcSet = (
  coverImage?: AnilistCoverImage | null,
  variant: AnilistCoverVariant = 'card'
) => {
  if (!coverImage) return undefined

  if (variant === 'thumb') {
    return buildDensitySrcSet([
      [coverImage.medium || coverImage.large || coverImage.extraLarge, '1x'],
      [coverImage.large || coverImage.extraLarge, '2x']
    ])
  }

  if (variant === 'hero') {
    return buildDensitySrcSet([
      [coverImage.large || coverImage.medium || coverImage.extraLarge, '1x'],
      [coverImage.extraLarge || coverImage.large, '2x']
    ])
  }

  return buildDensitySrcSet([
    [coverImage.large || coverImage.medium || coverImage.extraLarge, '1x'],
    [coverImage.extraLarge || coverImage.large, '2x']
  ])
}

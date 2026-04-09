type AnilistPageResponse = {
  data?: {
    MediaListCollection?: {
      lists?: Array<{
        entries?: Array<{
          mediaId?: number | null
          media?: { id?: number | null } | null
        }>
      }>
    }
  }
  errors?: Array<{ message?: string }>
}

const LIST_QUERY = `
  query ($userId: Int, $userName: String, $statusIn: [MediaListStatus]) {
    MediaListCollection(userId: $userId, userName: $userName, type: ANIME, status_in: $statusIn) {
      lists {
        entries {
          mediaId
          media { id }
        }
      }
    }
  }
`

const requestAnilist = async (query: string, variables: Record<string, any>) => {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })

  let payload: AnilistPageResponse | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!payload || typeof payload !== 'object') {
    throw createError({ statusCode: 502, statusMessage: 'Invalid AniList response' })
  }

  if (Array.isArray(payload.errors) && payload.errors.length) {
    const msg = String(payload.errors[0]?.message || 'AniList query failed')
    throw createError({
      statusCode: 502,
      statusMessage: msg,
      data: {
        anilistErrors: payload.errors,
        variables
      }
    })
  }

  return payload
}

const fetchUserMediaIds = async (opts: { userId?: number; userName?: string }) => {
  const ids = new Set<number>()
  const payload = await requestAnilist(LIST_QUERY, {
    userId: opts.userId || null,
    userName: opts.userId ? null : (opts.userName || null),
    statusIn: ['CURRENT', 'COMPLETED']
  })

  const lists = Array.isArray(payload.data?.MediaListCollection?.lists)
    ? payload.data?.MediaListCollection?.lists
    : []

  for (const list of lists) {
    const entries = Array.isArray(list?.entries) ? list.entries : []
    for (const entry of entries) {
      const id = Number(entry?.mediaId ?? entry?.media?.id ?? 0)
      if (id > 0) ids.add(id)
    }
  }

  return ids
}

export default defineEventHandler(async (event) => {
  const friendId = Number(getRouterParam(event, 'id') || 0)
  const query = getQuery(event)
  const selfUserId = Number(query.selfUserId || 0)
  const selfUserName = String(query.selfUserName || '').trim()
  const friendUserName = String(query.friendUserName || '').trim()

  if (!friendId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing friend AniList id' })
  }
  if (!selfUserId && !selfUserName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing self AniList identity' })
  }

  try {
    const fetchSelfIds = async () => {
      try {
        return await fetchUserMediaIds({
          userId: selfUserId || undefined,
          userName: selfUserName || undefined
        })
      } catch (error: any) {
        // AniList can return 500 for a valid userId; retry with username.
        if (selfUserName) {
          return await fetchUserMediaIds({ userName: selfUserName })
        }
        throw error
      }
    }

    const fetchFriendIds = async () => {
      try {
        return await fetchUserMediaIds({ userId: friendId })
      } catch (error: any) {
        // AniList occasionally returns 500 for specific userId lookups; retry with userName.
        if (friendUserName) {
          return await fetchUserMediaIds({ userName: friendUserName })
        }
        throw error
      }
    }

    const [selfIds, friendIds] = await Promise.all([
      fetchSelfIds(),
      fetchFriendIds()
    ])

    let common = 0
    for (const id of selfIds) {
      if (friendIds.has(id)) common += 1
    }

    return {
      commonCount: common,
      onlySelfCount: Math.max(selfIds.size - common, 0),
      onlyFriendCount: Math.max(friendIds.size - common, 0),
      selfCount: selfIds.size,
      friendCount: friendIds.size
    }
  } catch (error: any) {
    console.error('[api/social/compare] compare failed', {
      friendId,
      friendUserName,
      selfUserId,
      selfUserName,
      errorMessage: error?.statusMessage || error?.message || 'unknown'
    })
    setResponseStatus(event, 502)
    return {
      error: true,
      message: String(error?.statusMessage || error?.message || 'Compare failed'),
      details: error?.data ?? null
    }
  }
})

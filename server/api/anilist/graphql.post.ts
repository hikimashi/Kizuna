export default defineEventHandler(async (event) => {
  const body = await readBody<{
    query?: string
    variables?: Record<string, any>
    token?: string
  }>(event)

  if (!body?.query) {
    return {
      errors: [{ message: 'Missing AniList GraphQL query.' }]
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (body.token) {
    headers.Authorization = `Bearer ${body.token}`
  }

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: body.query,
        variables: body.variables ?? {}
      })
    })

    let payload: any = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!payload || typeof payload !== 'object') {
      return {
        errors: [{ message: `AniList HTTP ${response.status}` }]
      }
    }

    if (!response.ok && !payload.errors) {
      payload.errors = [{ message: `AniList HTTP ${response.status}` }]
    }

    return payload
  } catch (error: any) {
    return {
      errors: [{ message: error?.message || 'AniList request failed.' }]
    }
  }
})


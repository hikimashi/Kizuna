<template>
  <div class="media-page">
    <div v-if="loading" class="state-card">
      <div class="state-spinner" aria-hidden="true"></div>
      <p>Loading anime details...</p>
    </div>

    <div v-else-if="errorMessage" class="state-card">
      <h1>Unable to load this anime</h1>
      <p>{{ errorMessage }}</p>
      <button class="state-action" type="button" @click="loadMedia">Try again</button>
    </div>

    <section v-else-if="media">
      <div class="header-wrap">
        <div class="banner" :style="bannerStyle">
          <div class="shadow"></div>
        </div>

        <div class="header">
          <div class="container anime-container">
            <div class="cover-wrap overlap-banner">
              <div class="cover-wrap-inner">
                <img v-if="coverImage" :src="coverImage" :alt="pageTitle" class="cover">
                <div v-else class="cover cover-placeholder" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>

                <div class="actions">
                  <button class="list" type="button" :disabled="adding || inUserList" @click="addToPlanning">
                    <span class="add">{{ addLabel }}</span>
                    <span class="dropdown" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  <a
                    v-if="media.siteUrl"
                    class="favourite"
                    :href="media.siteUrl"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open on AniList"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M12 21s-6.7-4.35-9.33-8.17C-.2 8.56 1.25 4.5 5.1 3.54 7.34 2.98 9.27 3.8 10.5 5.27 11.73 3.8 13.66 2.98 15.9 3.54c3.85.96 5.3 5.02 2.43 9.29C18.7 16.65 12 21 12 21Z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div class="header-copy">
                <h1>{{ pageTitle }}</h1>

                <div class="header-description" :class="{ truncated: hasExtendedDescription }">
                  <p class="description" v-html="descriptionHtml"></p>
                </div>

                <a v-if="hasExtendedDescription" href="#description" class="description-length-toggle">
                  Read More
                </a>

                <div class="nav">
                  <span class="link active">Overview</span>
                  <a v-if="watchLinks.length" href="#watch" class="link">Watch</a>
                  <span v-else class="link disabled">Watch</span>
                  <a v-if="characters.length" href="#characters" class="link">Characters</a>
                  <span v-else class="link disabled">Characters</span>
                  <span class="link disabled">Staff</span>
                  <span class="link disabled">Reviews</span>
                  <a href="#meta" class="link">Stats</a>
                  <span class="link disabled">Social</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content container anime-container">
        <aside class="sidebar">
          <div v-if="displayRankings.length" class="rankings">
            <a
              v-for="ranking in displayRankings"
              :key="`${ranking.type}-${ranking.rank}`"
              class="ranking"
              :class="rankingClass(ranking)"
              :href="media.siteUrl || '#'"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                v-if="ranking.type === 'RATED'"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="12"
                height="12"
                class="icon"
              >
                <path d="m12 2.5 2.96 6 6.62.96-4.79 4.67 1.13 6.6L12 17.62 6.08 20.73l1.13-6.6L2.42 9.46l6.62-.96L12 2.5Z" />
              </svg>
              <svg
                v-else
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="12"
                height="12"
                class="icon"
              >
                <path d="M12 21s-6.7-4.35-9.33-8.17C-.2 8.56 1.25 4.5 5.1 3.54 7.34 2.98 9.27 3.8 10.5 5.27 11.73 3.8 13.66 2.98 15.9 3.54c3.85.96 5.3 5.02 2.43 9.29C18.7 16.65 12 21 12 21Z" />
              </svg>
              <span class="rank-text">{{ rankingText(ranking) }}</span>
            </a>
          </div>

          <div id="meta" class="data">
            <div v-for="row in dataRows" :key="row.label" class="data-set" :class="{ 'data-list': row.values?.length }">
              <div class="type">{{ row.label }}</div>
              <div class="value">
                <template v-if="row.values?.length">
                  <span v-for="(item, index) in row.values" :key="`${row.label}-${item}-${index}`">
                    {{ item }}<br v-if="index < row.values.length - 1">
                  </span>
                </template>
                <a v-else-if="row.href" :href="row.href" target="_blank" rel="noreferrer">{{ row.value }}</a>
                <template v-else>{{ row.value }}</template>
              </div>
            </div>
          </div>

          <div v-if="topTags.length" class="tags">
            <h2>Tags</h2>
            <div v-for="tag in topTags" :key="tag.id" class="tag-row">
              <span class="tag-name">{{ tag.name }}</span>
              <div class="tag-rank">{{ tag.rank }}%</div>
            </div>
          </div>
        </aside>

        <div class="overview">
          <section id="description" class="section description-section">
            <h2>Description</h2>
            <p class="content-wrap" v-html="descriptionHtml"></p>
          </section>

          <section v-if="relations.length" class="section relations">
            <h2>Relations</h2>
            <div class="grid-wrap relations-grid">
              <template v-for="relation in relations" :key="`${relation.node?.id}-${relation.relationType}`">
                <NuxtLink v-if="relation.node?.type === 'ANIME'" :to="`/anime/${relation.node.id}`" class="media-preview-card">
                  <div class="preview-cover" :style="coverStyle(relationCover(relation))"></div>
                  <div class="preview-content">
                    <div class="info-header">{{ label(relation.relationType) }}</div>
                    <div class="title">{{ relationTitle(relation) }}</div>
                    <div class="info">{{ relationInfo(relation) }}</div>
                  </div>
                </NuxtLink>

                <a
                  v-else-if="relation.node?.siteUrl"
                  :href="relation.node.siteUrl"
                  class="media-preview-card"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div class="preview-cover" :style="coverStyle(relationCover(relation))"></div>
                  <div class="preview-content">
                    <div class="info-header">{{ label(relation.relationType) }}</div>
                    <div class="title">{{ relationTitle(relation) }}</div>
                    <div class="info">{{ relationInfo(relation) }}</div>
                  </div>
                </a>

                <div v-else class="media-preview-card">
                  <div class="preview-cover" :style="coverStyle(relationCover(relation))"></div>
                  <div class="preview-content">
                    <div class="info-header">{{ label(relation.relationType) }}</div>
                    <div class="title">{{ relationTitle(relation) }}</div>
                    <div class="info">{{ relationInfo(relation) }}</div>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <section v-if="characters.length" id="characters" class="section characters">
            <h2 class="link-title">Characters</h2>
            <div class="grid-wrap characters-grid">
              <article v-for="character in characters" :key="character.node?.id" class="role-card view-character-staff">
                <div class="role-side">
                  <div class="role-content">
                    <div class="name">{{ character.node?.name?.full || 'Unknown character' }}</div>
                    <div class="role">{{ label(character.role) }}</div>
                  </div>
                  <div class="role-cover" :style="coverStyle(character.node?.image?.large || character.node?.image?.medium || '')"></div>
                </div>

                <div class="role-side role-side-staff">
                  <div class="role-content">
                    <div class="name">{{ actorName(character) }}</div>
                    <div class="role">{{ actorRole(character) }}</div>
                  </div>
                  <div class="role-cover" :style="coverStyle(actorImage(character))"></div>
                </div>
              </article>
            </div>
          </section>

          <section v-if="watchLinks.length" id="watch" class="section watch-section">
            <h2>External &amp; Streaming Links</h2>
            <div class="watch-grid">
              <a
                v-for="link in watchLinks"
                :key="link.id"
                :href="link.url"
                class="external-link"
                target="_blank"
                rel="noreferrer"
                :style="{ '--link-color': watchLinkColor(link) }"
              >
                <div class="icon-wrap">
                  <img v-if="watchIcon(link)" :src="watchIcon(link)" :alt="link.site" class="icon-image">
                  <span v-else>{{ String(link.site || '?').charAt(0) }}</span>
                </div>
                <span class="name">
                  {{ link.site }}
                  <span v-if="link.notes" class="notes">({{ link.notes }})</span>
                </span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch } from 'vue'
import { useAnilistGraphql } from '~/composables/useAnilistGraphql'
import { useAnilistSync } from '~/composables/useAnilistSync'
import { usePocketbaseStore } from '~/composables/usePocketbaseStore'
import { useToastStore } from '~/composables/useToastStore'

// Cette page affiche le detail d'un anime AniList.
// Elle charge la fiche complete, prepare des blocs lisibles pour le template
// et permet un ajout rapide a la liste "Planning".

type AnimeMedia = Record<string, any>
type DataRow = {
  label: string
  value?: string
  values?: string[]
  href?: string
}

const QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      siteUrl
      title { romaji english native userPreferred }
      description(asHtml: true)
      bannerImage
      coverImage { medium large extraLarge }
      format
      status
      season
      seasonYear
      source
      episodes
      duration
      averageScore
      meanScore
      popularity
      favourites
      hashtag
      genres
      synonyms
      mediaListEntry { id status progress score }
      rankings { rank type context allTime }
      externalLinks {
        id
        url
        site
        color
        icon
        notes
        language
        type
      }
      tags { id name rank isMediaSpoiler }
      studios {
        edges {
          isMain
          node { id name }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            siteUrl
            type
            format
            status
            title { romaji english native userPreferred }
            coverImage { medium large }
          }
        }
      }
      characters(perPage: 12, sort: [ROLE, RELEVANCE]) {
        edges {
          role
          node {
            id
            name { full }
            image { medium large }
          }
          voiceActors(sort: [RELEVANCE]) {
            id
            languageV2
            name { full }
            image { medium large }
          }
        }
      }
    }
  }
`

const route = useRoute()
const graphql = useAnilistGraphql()
const anilistSync = useAnilistSync()
const pocketbaseStore = usePocketbaseStore()
const toastStore = useToastStore()

const authRecord = computed(() => (unref(pocketbaseStore.authRecord) ?? {}) as Record<string, any>)
const token = computed(() => String(authRecord.value.anilist_token ?? ''))
const loading = ref(true)
const adding = ref(false)
const errorMessage = ref('')
const media = ref<AnimeMedia | null>(null)

const mediaId = computed(() => {
  // L'id vient de l'URL ; on le valide avant de lancer une requete.
  const raw = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : 0
})

const cleanList = (values: Array<string | null | undefined>) => {
  // Nettoyage utilitaire : supprime les vides et les doublons.
  const seen = new Set<string>()
  return values.reduce<string[]>((items, value) => {
    const next = String(value || '').trim()
    const key = next.toLowerCase()
    if (!next || seen.has(key)) return items
    seen.add(key)
    items.push(next)
    return items
  }, [])
}

const label = (value?: string | null) => {
  if (!value) return '-'
  const map: Record<string, string> = {
    TV: 'TV',
    TV_SHORT: 'TV Short',
    ONA: 'ONA',
    OVA: 'OVA',
    FINISHED: 'Finished',
    RELEASING: 'Airing',
    NOT_YET_RELEASED: 'Not Yet Released',
    CANCELLED: 'Cancelled',
    CURRENT: 'Watching',
    COMPLETED: 'Completed',
    PAUSED: 'Paused',
    DROPPED: 'Dropped',
    PLANNING: 'Planning',
    LIGHT_NOVEL: 'Light Novel',
    WEB_NOVEL: 'Web Novel',
    VIDEO_GAME: 'Video Game',
    SIDE_STORY: 'Side Story',
    SPIN_OFF: 'Spin Off'
  }
  return map[value] || value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

const sanitizeHtml = (value: string) => {
  // Petit nettoyage defensif avant affichage de HTML venant de l'API.
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

const plainText = (value: string) => {
  // Version texte de la description HTML, utile pour calculer sa longueur.
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const titleFrom = (title: Record<string, any> | null | undefined) => {
  return cleanList([
    title?.romaji,
    title?.english,
    title?.userPreferred,
    title?.native
  ])[0] || 'Unknown title'
}

const pageTitle = computed(() => titleFrom(media.value?.title))
const englishTitle = computed(() => cleanList([media.value?.title?.english])[0] || '')
const nativeTitle = computed(() => cleanList([media.value?.title?.native])[0] || '')
const coverImage = computed(() => media.value?.coverImage?.extraLarge || media.value?.coverImage?.large || media.value?.coverImage?.medium || '')
const bannerImage = computed(() => media.value?.bannerImage || coverImage.value)
const bannerStyle = computed(() => bannerImage.value
  ? { backgroundImage: `url(${bannerImage.value})` }
  : { background: 'linear-gradient(180deg, rgba(21,31,46,.4), rgba(6,12,19,.9))' })

const descriptionHtml = computed(() => {
  const html = sanitizeHtml(String(media.value?.description || ''))
  return html || 'No description provided by AniList.'
})

const descriptionText = computed(() => plainText(descriptionHtml.value))
const hasExtendedDescription = computed(() => descriptionText.value.length > 280 || (descriptionHtml.value.match(/<br/gi) || []).length > 5)

const studioEdges = computed(() => media.value?.studios?.edges ?? [])
const mainStudios = computed(() => cleanList(studioEdges.value
  .filter((edge: any) => edge?.isMain && edge.node?.name)
  .map((edge: any) => String(edge.node.name))))
const producers = computed(() => cleanList(studioEdges.value
  .filter((edge: any) => !edge?.isMain && edge.node?.name)
  .map((edge: any) => String(edge.node.name))))

const displayRankings = computed(() => {
  const all = [...(media.value?.rankings ?? [])]
    .filter((item: any) => item?.rank && item?.type && item?.allTime)
    .sort((a: any, b: any) => Number(a.rank) - Number(b.rank))
  const rated = all.find((item: any) => item.type === 'RATED')
  const popular = all.find((item: any) => item.type === 'POPULAR')
  return [rated, popular].filter(Boolean)
})

const topTags = computed(() => [...(media.value?.tags ?? [])]
  .filter((tag: any) => tag?.name && !tag.isMediaSpoiler)
  .sort((a: any, b: any) => Number(b.rank ?? 0) - Number(a.rank ?? 0))
  .slice(0, 10))

const relations = computed(() => (media.value?.relations?.edges ?? [])
  .filter((edge: any) => edge?.node?.id)
  .slice(0, 12))

const characters = computed(() => (media.value?.characters?.edges ?? [])
  .filter((edge: any) => edge?.node?.id)
  .slice(0, 12))

const watchLinks = computed(() => [...(media.value?.externalLinks ?? [])]
  .filter((link: any) => link?.url && link?.site)
  .slice(0, 8))

const inUserList = computed(() => Boolean(media.value?.mediaListEntry?.id))
const addLabel = computed(() => {
  if (adding.value) return 'Adding...'
  if (inUserList.value) return label(media.value?.mediaListEntry?.status) || 'In List'
  return 'Add to List'
})

const hashtagHref = computed(() => media.value?.hashtag
  ? `https://twitter.com/search?q=${encodeURIComponent(String(media.value.hashtag))}`
  : '')

const dataRows = computed<DataRow[]>(() => {
  // Conversion des infos brutes AniList en lignes simples pour la sidebar.
  const rows: DataRow[] = [
    { label: 'Format', value: label(media.value?.format) },
    { label: 'Episodes', value: media.value?.episodes ? String(media.value.episodes) : '-' },
    { label: 'Episode Duration', value: media.value?.duration ? `${media.value.duration} mins` : '-' },
    { label: 'Status', value: label(media.value?.status) },
    { label: 'Season', value: media.value?.season && media.value?.seasonYear ? `${label(media.value.season)} ${media.value.seasonYear}` : '-' },
    { label: 'Average Score', value: media.value?.averageScore ? `${media.value.averageScore}%` : '-' },
    { label: 'Mean Score', value: media.value?.meanScore ? `${media.value.meanScore}%` : '-' },
    { label: 'Popularity', value: media.value?.popularity ? String(media.value.popularity) : '-' },
    { label: 'Favorites', value: media.value?.favourites ? String(media.value.favourites) : '-' }
  ]

  if (mainStudios.value.length) rows.push({ label: 'Studios', values: mainStudios.value })
  if (producers.value.length) rows.push({ label: 'Producers', values: producers.value })
  rows.push({ label: 'Source', value: label(media.value?.source) })
  if (media.value?.hashtag) rows.push({ label: 'Hashtag', value: String(media.value.hashtag), href: hashtagHref.value })
  if (media.value?.genres?.length) rows.push({ label: 'Genres', values: cleanList(media.value.genres) })
  rows.push({ label: 'Romaji', value: pageTitle.value })
  if (englishTitle.value) rows.push({ label: 'English', value: englishTitle.value })
  if (nativeTitle.value) rows.push({ label: 'Native', value: nativeTitle.value })
  const synonyms = cleanList(media.value?.synonyms ?? [])
  if (synonyms.length) rows.push({ label: 'Synonyms', values: synonyms })

  return rows
})

const rankingClass = (ranking: any) => ranking?.type === 'POPULAR' ? 'popular' : 'rated'
const rankingText = (ranking: any) => `#${ranking.rank} ${ranking.type === 'POPULAR' ? 'most popular all time' : 'highest rated all time'}`
const relationTitle = (relation: any) => titleFrom(relation.node?.title)
const relationCover = (relation: any) => relation.node?.coverImage?.large || relation.node?.coverImage?.medium || ''
const relationInfo = (relation: any) => [label(relation.node?.format), label(relation.node?.status)].filter((item) => item && item !== '-').join(' · ')
const actorName = (character: any) => String(character.voiceActors?.[0]?.name?.full || 'No voice actor listed')
const actorRole = (character: any) => String(character.voiceActors?.[0]?.languageV2 || 'Voice Actor')
const actorImage = (character: any) => String(character.voiceActors?.[0]?.image?.large || character.voiceActors?.[0]?.image?.medium || '')
const watchLinkColor = (link: any) => String(link?.color || '#3db4f2')
const watchIcon = (link: any) => String(link?.icon || '')
const coverStyle = (image: string) => image ? { backgroundImage: `url(${image})` } : {}

const loadMedia = async () => {
  // Charge la fiche complete de l'anime courant.
  if (!mediaId.value) {
    media.value = null
    errorMessage.value = 'Invalid anime id.'
    loading.value = false
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    const response = await graphql.request<any>(QUERY, { id: mediaId.value }, { token: token.value, cacheTtlMs: token.value ? 30000 : 90000 })
    if (response?.errors?.length) throw new Error(response.errors[0]?.message || 'Unable to fetch anime details.')
    if (!response?.data?.Media?.id) throw new Error('AniList did not return this anime.')
    media.value = response.data.Media
  } catch (error: any) {
    media.value = null
    errorMessage.value = error?.message || 'Unable to fetch anime details.'
  } finally {
    loading.value = false
  }
}

const addToPlanning = async () => {
  // Ajoute l'anime a la liste AniList de l'utilisateur avec le statut PLANNING.
  if (!media.value?.id || adding.value || inUserList.value) return

  try {
    adding.value = true
    const saved = await anilistSync.saveEntry({ mediaId: media.value.id, status: 'PLANNING' })
    media.value = {
      ...media.value,
      mediaListEntry: {
        id: Number(saved.id),
        status: String(saved.status || 'PLANNING'),
        progress: Number(saved.progress || 0),
        score: saved.score == null ? null : Number(saved.score)
      }
    }
    toastStore.openToast({ type: 'success', message: 'Anime added to Planning.' })
  } catch (error: any) {
    toastStore.openToast({ type: 'error', message: error?.message || 'Unable to add anime to AniList.' })
  } finally {
    adding.value = false
  }
}

watch(mediaId, async () => {
  await loadMedia()
}, { immediate: true })

useHead(() => ({ title: media.value ? `${pageTitle.value} - Kizuna` : 'Anime Details - Kizuna' }))
</script>

<style scoped>
.media-page {
  --color-background: 11, 22, 34;
  --color-foreground: 21, 31, 46;
  --color-foreground-dark: 6, 12, 19;
  --color-text: 159, 173, 189;
  --color-text-light: 114, 138, 161;
  --color-text-lighter: 133, 150, 165;
  --color-blue: 61, 180, 242;
  --color-white: 255, 255, 255;
  --color-red: 232, 93, 117;
  --color-red-strong: 236, 41, 75;
  --color-shadow: 49, 54, 68;
  background: rgb(var(--color-background));
  color: rgb(var(--color-text));
  font-family: 'Overpass', sans-serif;
  min-height: calc(100vh - 64px);
  padding-bottom: 72px;
}

.anime-container {
  margin: 0 auto;
  max-width: 1520px;
  min-width: 320px;
  padding-left: 20px;
  padding-right: 20px;
  width: 100%;
}

.state-card {
  margin: 40px auto 72px;
  max-width: 720px;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  padding: 48px 28px;
  text-align: center;
}

.state-card h1 {
  margin: 0 0 12px;
  color: rgb(var(--color-white));
  font-size: 2.4rem;
  font-weight: 600;
}

.state-card p {
  margin: 0;
  color: rgb(var(--color-text-light));
  font-size: 1.4rem;
}

.state-spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto 14px;
  border-radius: 999px;
  border: 3px solid rgba(var(--color-blue), 0.16);
  border-top-color: rgb(var(--color-blue));
  animation: spin 0.75s linear infinite;
}

.state-action {
  margin-top: 20px;
  border: none;
  border-radius: 3px;
  background: rgb(var(--color-blue));
  color: rgb(var(--color-white));
  cursor: pointer;
  font-family: 'Overpass', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  padding: 11px 18px;
}

.header-wrap {
  position: relative;
  z-index: 2;
}

.banner {
  height: 400px;
  margin-top: -58px;
  background-position: 50% 35%;
  background-repeat: no-repeat;
  background-size: cover;
}

.shadow {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(var(--color-foreground-dark), 0) 40%, rgba(var(--color-foreground-dark), 0.6));
}

.header {
  position: relative;
  background: rgb(var(--color-foreground));
}

.cover-wrap {
  position: relative;
}

.cover-wrap.overlap-banner {
  margin-top: -125px;
}

.cover-wrap-inner {
  display: grid;
  grid-template-columns: 100px auto;
  align-items: end;
  gap: 20px;
}

.cover {
  width: 100%;
  margin-top: 15px;
  border-radius: 2px;
  background-color: rgba(212, 230, 245, 0.5);
  box-shadow: 0 0 29px rgba(var(--color-shadow), 0.25);
}

.cover-placeholder {
  align-items: center;
  color: rgba(var(--color-white), 0.65);
  display: flex;
  justify-content: center;
  aspect-ratio: 100 / 142;
}

.actions {
  display: grid;
  grid-template-columns: auto 35px;
  gap: 15px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.list,
.favourite {
  height: 35px;
}

.list {
  align-items: center;
  display: flex;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: rgb(var(--color-blue));
  color: rgb(var(--color-white));
  cursor: pointer;
  font-family: 'Overpass', sans-serif;
  font-size: 1.4rem;
  line-height: 1.3rem;
  padding: 0;
}

.list:disabled {
  cursor: default;
  opacity: 0.72;
}

.add {
  align-items: center;
  display: flex;
  justify-content: center;
  width: calc(100% - 34px);
  height: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 10px;
  font-weight: 700;
}

.dropdown {
  align-items: center;
  display: flex;
  justify-content: center;
  width: 34px;
  height: 100%;
  border-radius: 0 3px 3px 0;
  background: rgba(var(--color-white), 0.14);
  color: rgba(var(--color-white), 0.84);
}

.dropdown svg {
  width: 13px;
  height: 13px;
}

.favourite {
  align-items: center;
  display: flex;
  justify-content: center;
  min-width: 35px;
  border-radius: 5px;
  background: rgb(var(--color-red-strong));
  color: rgb(var(--color-white));
  padding: 0 14px;
  transition: 0.2s;
}

.favourite:hover {
  color: rgb(var(--color-white));
  filter: brightness(1.05);
}

.header-copy {
  display: inline-grid;
  grid-template-rows: min-content min-content auto;
  padding-top: 25px;
  width: 100%;
}

.header-copy h1 {
  margin: 0;
  color: rgb(var(--color-white));
  font-size: 1.8rem;
  font-weight: 500;
}

.header-description {
  position: relative;
}

.header-description.truncated {
  max-height: 112px;
  overflow: hidden;
}

.header-description.truncated::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 44px;
  background: linear-gradient(180deg, rgba(21, 31, 46, 0), rgba(21, 31, 46, 1));
  pointer-events: none;
}

.description {
  margin: 0;
  max-width: 900px;
  padding: 15px 0 12px;
  color: rgb(var(--color-text-light));
  font-size: 1.4rem;
  line-height: 1.5;
}

.description-length-toggle {
  color: rgb(var(--color-text-lighter));
  font-size: 1.2rem;
  font-weight: 700;
  opacity: 1;
}

.description-length-toggle:hover {
  color: rgb(var(--color-blue));
}

.nav {
  align-self: end;
  display: flex;
  justify-content: space-evenly;
  justify-self: center;
  width: 100%;
  max-width: 800px;
  padding-top: 10px;
  font-size: 1.3rem;
}

.link {
  color: rgb(var(--color-text-lighter));
  padding: 15px;
}

.link:hover {
  color: rgb(var(--color-blue));
}

.link.active {
  color: rgb(var(--color-text));
}

.link.disabled {
  cursor: default;
  opacity: 0.7;
}

.content {
  display: grid;
  grid-template-columns: 208px auto;
  gap: 40px;
  margin-top: 30px;
  position: relative;
}

.sidebar {
  min-width: 0;
}

.ranking {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  padding: 8px 12px;
}

.rank-text {
  display: inline-block;
  width: calc(100% - 20px);
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  text-transform: capitalize;
}

.ranking.rated {
  color: #ffcc4d;
}

.ranking.popular {
  color: rgb(var(--color-red));
}

.ranking .rank-text {
  color: rgb(var(--color-text));
}

.data {
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  padding: 18px;
}

.data-set {
  padding-bottom: 14px;
}

.data-set:last-child {
  padding-bottom: 0;
}

.type {
  padding-bottom: 5px;
  color: rgb(var(--color-white));
  font-size: 1.3rem;
  font-weight: 500;
}

.value {
  color: rgb(var(--color-text-lighter));
  font-size: 1.2rem;
  line-height: 1.3;
}

.value a {
  color: inherit;
}

.value a:hover {
  color: rgb(var(--color-blue));
}

.tags {
  margin-top: 20px;
}

.tags h2,
.section h2,
.link-title {
  margin: 0 0 10px;
  color: rgb(var(--color-white));
  font-size: 1.4rem;
  font-weight: 500;
}

.tag-row {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  font-size: 1.3rem;
  padding: 8px 10px;
}

.tag-row + .tag-row {
  margin-top: 8px;
}

.tag-name {
  color: rgb(var(--color-white));
}

.tag-rank {
  margin-left: auto;
  color: rgb(var(--color-text-lighter));
  font-size: 1.2rem;
}

.overview {
  overflow: hidden;
}

.section {
  margin-bottom: 34px;
}

.content-wrap {
  margin: 0;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  padding: 18px 20px;
  color: rgb(var(--color-text-light));
  font-size: 1.4rem;
  line-height: 1.6;
}

.grid-wrap {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px 30px;
}

.media-preview-card {
  display: inline-grid;
  grid-template-columns: 85px auto;
  height: 115px;
  max-height: 115px;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  min-width: 0;
}

.preview-cover {
  border-radius: 3px 0 0 3px;
  background-color: rgba(212, 230, 245, 0.15);
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
}

.preview-content {
  position: relative;
  border-radius: 0 3px 3px 0;
  background: rgb(var(--color-foreground));
  padding: 12px;
}

.info-header {
  margin-bottom: 8px;
  color: rgb(var(--color-blue));
  font-size: 1.2rem;
  font-weight: 500;
}

.title {
  display: -webkit-box;
  overflow: hidden;
  color: rgb(var(--color-white));
  font-size: 1.4rem;
  line-height: 1.25;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.info {
  position: absolute;
  left: 12px;
  bottom: 12px;
  color: rgb(var(--color-text-lighter));
  font-size: 1.2rem;
}

.characters-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.role-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 80px;
  overflow: hidden;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
}

.role-side {
  display: grid;
  grid-template-columns: auto 52px;
  min-width: 0;
}

.role-side-staff {
  border-left: 1px solid rgba(var(--color-white), 0.05);
}

.role-content {
  overflow: hidden;
  padding: 10px;
  font-size: 1.2rem;
}

.role-content .name {
  height: 38px;
  overflow: hidden;
  color: rgb(var(--color-white));
  line-height: 1.25;
}

.role-content .role {
  color: rgb(var(--color-text-lighter));
  font-size: 1rem;
}

.role-cover {
  background-color: rgba(212, 230, 245, 0.15);
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
}

.watch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.external-link {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 3px;
  background: rgb(var(--color-foreground));
  padding: 10px 12px;
}

.icon-wrap {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--link-color);
  color: rgb(var(--color-white));
  flex-shrink: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.icon-image {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.external-link .name {
  color: rgb(var(--color-white));
  font-size: 1.3rem;
  line-height: 1.3;
}

.notes {
  color: rgb(var(--color-text-lighter));
  font-size: 1.1rem;
}

.content-wrap :deep(i),
.description :deep(i) {
  color: rgb(var(--color-text-lighter));
}

.content-wrap :deep(a),
.description :deep(a) {
  color: rgb(var(--color-blue));
}

@media (min-width: 1540px) {
  .anime-container {
    padding-left: 100px;
    padding-right: 100px;
  }
}

@media (min-width: 1040px) and (max-width: 1540px) {
  .anime-container {
    max-width: 1140px;
    padding-left: 50px;
    padding-right: 50px;
  }

  .grid-wrap,
  .characters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 760px) and (max-width: 1040px) {
  .anime-container {
    padding-left: 30px;
    padding-right: 30px;
  }

  .grid-wrap,
  .characters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .banner {
    margin-top: 0;
    height: 300px;
  }

  .cover-wrap.overlap-banner {
    margin-top: -80px;
  }

  .cover-wrap-inner {
    grid-template-columns: 92px auto;
    gap: 14px;
  }

  .actions {
    gap: 10px;
  }

  .header-copy {
    padding-top: 18px;
  }

  .nav {
    justify-content: flex-start;
    overflow-x: auto;
    max-width: none;
  }

  .nav::-webkit-scrollbar {
    display: none;
  }

  .link {
    padding: 15px 12px 15px 0;
    white-space: nowrap;
  }

  .content {
    display: block;
  }

  .rankings,
  .tags {
    display: none;
  }

  .sidebar {
    margin-bottom: 24px;
  }

  .grid-wrap,
  .characters-grid,
  .watch-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

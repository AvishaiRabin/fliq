import { cacheGet, cacheSet, TTL } from './cache'

const API_KEY = import.meta.env.VITE_OMDB_API_KEY
const BASE_URL = 'https://www.omdbapi.com'

export interface OMDbRatings {
  imdbRating: string | null
  rottenTomatoesScore: string | null
  metacriticScore: string | null
  awards: string | null
}

interface OMDbResponse {
  Response: 'True' | 'False'
  imdbRating?: string
  Ratings?: { Source: string; Value: string }[]
  Awards?: string
  Error?: string
}

export async function getOMDbRatings(imdbId: string): Promise<OMDbRatings> {
  const key = `omdb_${imdbId}`
  const cached = cacheGet<OMDbRatings>(key)
  if (cached) return cached

  const url = `${BASE_URL}/?apikey=${API_KEY}&i=${imdbId}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`OMDb request failed: ${res.status}`)
    return { imdbRating: null, rottenTomatoesScore: null, metacriticScore: null, awards: null }
  }
  const data: OMDbResponse = await res.json()

  if (data.Response === 'False') {
    console.warn(`OMDb error: ${data.Error}`)
    return { imdbRating: null, rottenTomatoesScore: null, metacriticScore: null, awards: null }
  }

  const rtRating = data.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')
  const metacritic = data.Ratings?.find((r) => r.Source === 'Metacritic')

  const result: OMDbRatings = {
    imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null,
    rottenTomatoesScore: rtRating ? rtRating.Value : null,
    metacriticScore: metacritic ? metacritic.Value : null,
    awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : null,
  }

  cacheSet(key, result, TTL.ONE_WEEK)
  return result
}

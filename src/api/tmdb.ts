import type { TMDBSearchResult, MovieDetails } from '../types'
import { cacheGet, cacheSet, TTL } from './cache'

const READ_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'

const headers = {
  Authorization: `Bearer ${READ_TOKEN}`,
  'Content-Type': 'application/json',
}

async function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return []
  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>('/search/movie', {
    query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  })
  return data.results
}

export async function getMovieDetails(movieId: number): Promise<MovieDetails> {
  const key = `tmdb_details_${movieId}`
  const cached = cacheGet<MovieDetails>(key)
  if (cached) return cached

  const data = await tmdbFetch<{
    id: number
    title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    vote_average: number
    vote_count: number
    runtime: number | null
    genres: { id: number; name: string }[]
    imdb_id: string | null
  }>(`/movie/${movieId}`, { language: 'en-US' })

  const result: MovieDetails = {
    id: data.id,
    title: data.title,
    overview: data.overview,
    posterUrl: data.poster_path ? `${IMG_BASE}/w500${data.poster_path}` : null,
    backdropUrl: data.backdrop_path ? `${IMG_BASE}/w1280${data.backdrop_path}` : null,
    releaseDate: data.release_date,
    year: data.release_date?.split('-')[0] ?? '',
    tmdbRating: data.vote_average,
    tmdbVoteCount: data.vote_count,
    runtime: data.runtime,
    genres: data.genres.map((g) => g.name),
    imdbId: data.imdb_id,
  }

  cacheSet(key, result, TTL.ONE_WEEK)
  return result
}

export async function getTrending(): Promise<TMDBSearchResult[]> {
  const key = 'tmdb_trending'
  const cached = cacheGet<TMDBSearchResult[]>(key)
  if (cached) return cached

  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>('/trending/movie/week', {
    language: 'en-US',
  })
  const result = data.results.slice(0, 18)
  cacheSet(key, result, TTL.ONE_HOUR)
  return result
}

export async function getSimilarMovies(movieId: number): Promise<TMDBSearchResult[]> {
  const key = `tmdb_similar_${movieId}`
  const cached = cacheGet<TMDBSearchResult[]>(key)
  if (cached) return cached

  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>(`/movie/${movieId}/similar`, {
    language: 'en-US',
    page: '1',
  })
  const result = data.results.slice(0, 12)
  cacheSet(key, result, TTL.ONE_DAY)
  return result
}

export async function getMovieTrailer(movieId: number): Promise<string | null> {
  const key = `tmdb_trailer_${movieId}`
  const cached = cacheGet<string | null>(key)
  if (cached !== null) return cached

  const data = await tmdbFetch<{
    results: { key: string; site: string; type: string; official: boolean }[]
  }>(`/movie/${movieId}/videos`, { language: 'en-US' })

  const trailer = data.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  ) ?? data.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  ) ?? data.results.find(
    (v) => v.site === 'YouTube'
  )

  const result = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
  cacheSet(key, result, TTL.ONE_WEEK)
  return result
}

export function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' = 'w342'): string | null {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

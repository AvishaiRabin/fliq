export interface TMDBSearchResult {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
}

export interface MovieDetails {
  id: number
  title: string
  overview: string
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string
  year: string
  tmdbRating: number
  tmdbVoteCount: number
  runtime: number | null
  genres: string[]
  imdbId: string | null
  // OMDb enrichment
  imdbRating?: string | null
  rottenTomatoesScore?: string | null
  metacriticScore?: string | null
  awards?: string | null
}

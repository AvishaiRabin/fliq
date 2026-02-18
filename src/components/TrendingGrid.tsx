import { useEffect, useState } from 'react'
import { getTrending, getPosterUrl } from '../api/tmdb'
import type { TMDBSearchResult } from '../types'

interface Props {
  onSelect: (movieId: number) => void
}

export default function TrendingGrid({ onSelect }: Props) {
  const [movies, setMovies] = useState<TMDBSearchResult[]>([])

  useEffect(() => {
    getTrending().then(setMovies).catch(() => {})
  }, [])

  if (movies.length === 0) return null

  return (
    <div className="trending-section">
      <h2 className="trending-heading">Trending This Week</h2>
      <div className="trending-grid">
        {movies.map((movie, i) => (
          <button
            key={movie.id}
            className="trending-item"
            onClick={() => onSelect(movie.id)}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {getPosterUrl(movie.poster_path, 'w342') ? (
              <img
                src={getPosterUrl(movie.poster_path, 'w342')!}
                alt={movie.title}
                className="trending-poster"
                loading="lazy"
              />
            ) : (
              <div className="trending-poster no-poster-small">
                <span>{movie.title[0]}</span>
              </div>
            )}
            <div className="trending-overlay">
              <span className="trending-title">{movie.title}</span>
              <span className="trending-year">{movie.release_date?.split('-')[0]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

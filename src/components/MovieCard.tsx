import { useEffect, useRef, useState } from 'react'
import { getMovieDetails, getSimilarMovies, getMovieTrailer, getPosterUrl } from '../api/tmdb'
import { getOMDbRatings } from '../api/omdb'
import { getStreamingAvailability, type StreamingOption } from '../api/streaming'
import { useCountUp } from '../hooks/useCountUp'
import SkeletonCard from './SkeletonCard'
import type { MovieDetails, TMDBSearchResult } from '../types'

const GENRE_COLORS: Record<string, string> = {
  Action: '#ff6b6b',
  Adventure: '#ff9f43',
  Animation: '#ffd93d',
  Comedy: '#6bcbff',
  Crime: '#a29bfe',
  Documentary: '#55efc4',
  Drama: '#fd79a8',
  Fantasy: '#e17055',
  Horror: '#b2bec3',
  Music: '#00cec9',
  Mystery: '#a29bfe',
  Romance: '#fd79a8',
  'Science Fiction': '#6bcbff',
  Thriller: '#ff6b6b',
  War: '#b2bec3',
  Western: '#ff9f43',
}

interface Props {
  movieId: number
  onSelect: (movieId: number) => void
  onDismiss: () => void
}

function RatingDisplay({ label, value, isRt }: { label: string; value: string; isRt?: boolean }) {
  const numeric = parseFloat(value)
  const counted = useCountUp(isNaN(numeric) ? 0 : numeric)
  const display = isNaN(numeric) ? value : (value.includes('%') ? `${Math.round(counted)}%` : counted.toFixed(1))
  return (
    <div className={`rating${isRt ? ' rating-rt' : ''}`}>
      <span className="rating-label">{label}</span>
      <span className="rating-value">{display}</span>
    </div>
  )
}

export default function MovieCard({ movieId, onSelect, onDismiss }: Props) {
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [streaming, setStreaming] = useState<StreamingOption[]>([])
  const [similar, setSimilar] = useState<TMDBSearchResult[]>([])
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Parallax on scroll
  useEffect(() => {
    function handleScroll() {
      if (backdropRef.current) {
        const offset = window.scrollY * 0.25
        backdropRef.current.style.backgroundPositionY = `calc(top + ${offset}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setMovie(null)
    setStreaming([])
    setSimilar([])
    setTrailerUrl(null)

    getMovieDetails(movieId)
      .then(async (details) => {
        if (cancelled) return
        const [omdb, streamingOpts, similarMovies, trailer] = await Promise.allSettled([
          details.imdbId ? getOMDbRatings(details.imdbId) : Promise.resolve(null),
          getStreamingAvailability(movieId),
          getSimilarMovies(movieId),
          getMovieTrailer(movieId),
        ])
        if (cancelled) return
        const ratings = omdb.status === 'fulfilled' && omdb.value ? omdb.value : {}
        setMovie({ ...details, ...ratings })
        setStreaming(streamingOpts.status === 'fulfilled' ? streamingOpts.value : [])
        setSimilar(similarMovies.status === 'fulfilled' ? similarMovies.value : [])
        setTrailerUrl(trailer.status === 'fulfilled' ? trailer.value : null)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [movieId])

  function handleShare() {
    const text = movie ? `Check out ${movie.title} on Fliq!` : 'Check this out on Fliq!'
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function dedup(options: StreamingOption[]): StreamingOption[] {
    const map = new Map<string, StreamingOption>()
    for (const opt of options) {
      const existing = map.get(opt.service)
      if (!existing || (opt.price && existing.price && parseFloat(opt.price.amount) < parseFloat(existing.price.amount))) {
        map.set(opt.service, opt)
      }
    }
    return Array.from(map.values())
  }

  if (loading) return <SkeletonCard />
  if (error) return <div className="movie-card-error">Error: {error}</div>
  if (!movie) return null

  const subscriptionStreams = streaming.filter((s) => s.type === 'subscription')
  const freeStreams = streaming.filter((s) => s.type === 'free')
  const rentOptions = streaming.filter((s) => s.type === 'rent')
  const buyOptions = streaming.filter((s) => s.type === 'buy')
  const addonStreams = streaming.filter((s) => s.type === 'addon')
  const glowImage = movie.posterUrl || movie.backdropUrl

  return (
    <div className="movie-card-wrapper">
      {glowImage && (
        <div className="movie-card-glow" style={{ backgroundImage: `url(${glowImage})` }} />
      )}
      <div className="movie-card movie-card-enter">
        {movie.backdropUrl && (
          <div
            ref={backdropRef}
            className="movie-backdrop"
            style={{ backgroundImage: `url(${movie.backdropUrl})` }}
          />
        )}

        {/* Dismiss + Share buttons */}
        <div className="card-actions">
          <button className="card-action-btn share-btn" onClick={handleShare} title="Share">
            {copied ? '✓ Copied!' : '⬡ Share'}
          </button>
          <button className="card-action-btn dismiss-btn" onClick={onDismiss} title="Close">✕</button>
        </div>

        <div className="movie-card-content">
          <div className="movie-card-top">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
            ) : (
              <div className="movie-poster no-poster">
                <span>{movie.title[0]}</span>
              </div>
            )}

            <div className="movie-info">
              <h2 className="movie-title">
                {movie.title} <span className="movie-year">({movie.year})</span>
              </h2>

              <div className="movie-meta">
                {movie.runtime && <span>{movie.runtime} min</span>}
              </div>

              {/* Genre pills */}
              <div className="genre-pills">
                {movie.genres.map((g) => (
                  <span key={g} className="genre-pill" style={{ '--genre-color': GENRE_COLORS[g] ?? '#8b87a8' } as React.CSSProperties}>
                    {g}
                  </span>
                ))}
              </div>

              <div className="movie-ratings">
                {movie.imdbRating ? (
                  <RatingDisplay label="IMDb" value={movie.imdbRating} />
                ) : (
                  <RatingDisplay label="TMDB" value={movie.tmdbRating.toFixed(1)} />
                )}
                {movie.rottenTomatoesScore && (
                  <RatingDisplay label="RT Critics" value={movie.rottenTomatoesScore} isRt />
                )}
                {movie.metacriticScore && (
                  <RatingDisplay label="Metacritic" value={movie.metacriticScore} />
                )}
              </div>

              {movie.awards && <p className="movie-awards">🏆 {movie.awards}</p>}

              {/* Trailer button */}
              {trailerUrl && (
                <a href={trailerUrl} target="_blank" rel="noopener noreferrer" className="trailer-btn">
                  ▶ Watch Trailer
                </a>
              )}

              {movie.overview && <p className="movie-overview">{movie.overview}</p>}
            </div>
          </div>

          {/* Streaming */}
          {streaming.length > 0 ? (
            <div className="watch-providers">
              <ProviderGroup label="Stream" options={dedup([...subscriptionStreams, ...freeStreams])} />
              <ProviderGroup label="Add-ons" options={dedup(addonStreams)} />
              <ProviderGroup label="Rent" options={dedup(rentOptions)} showPrice />
              <ProviderGroup label="Buy" options={dedup(buyOptions)} showPrice />
            </div>
          ) : (
            <div className="watch-providers">
              <p className="no-providers">No US streaming info available.</p>
            </div>
          )}

          {/* Similar movies */}
          {similar.length > 0 && (
            <div className="similar-section">
              <h3 className="similar-heading">More Like This</h3>
              <div className="similar-scroll">
                {similar.map((m) => (
                  <SimilarCard key={m.id} movie={m} onSelect={onSelect} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SimilarCard({ movie, onSelect }: { movie: TMDBSearchResult; onSelect: (id: number) => void }) {
  const posterUrl = getPosterUrl(movie.poster_path, 'w185')
  return (
    <div className="similar-card" onClick={() => { onSelect(movie.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
      {posterUrl ? (
        <img src={posterUrl} alt={movie.title} className="similar-poster" loading="lazy" />
      ) : (
        <div className="similar-poster no-poster-small"><span>{movie.title[0]}</span></div>
      )}
      <span className="similar-title">{movie.title}</span>
    </div>
  )
}

function ProviderGroup({ label, options, showPrice }: {
  label: string
  options: StreamingOption[]
  showPrice?: boolean
}) {
  if (options.length === 0) return null
  return (
    <div className="provider-section">
      <h3>{label}</h3>
      <div className="provider-list">
        {options.map((opt, i) => (
          <a
            key={`${opt.service}-${i}`}
            href={opt.link}
            target="_blank"
            rel="noopener noreferrer"
            className="provider-chip"
          >
            {opt.serviceLogo && <img src={opt.serviceLogo} alt={opt.service} />}
            <span className="provider-name">{opt.service}</span>
            {showPrice && opt.price && (
              <span className="provider-price">{opt.price.formatted}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { searchMovies, getPosterUrl } from '../api/tmdb'
import type { TMDBSearchResult } from '../types'

const HISTORY_KEY = 'fliq_search_history'
const MAX_HISTORY = 5

interface Props {
  onSelect: (movieId: number, title: string) => void
}

function getHistory(): { id: number; title: string; year: string; poster: string | null }[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveToHistory(movie: TMDBSearchResult) {
  const history = getHistory().filter((h) => h.id !== movie.id)
  history.unshift({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.split('-')[0] ?? '',
    poster: movie.poster_path,
  })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [history, setHistory] = useState(getHistory())
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setActiveIndex(-1)
      return
    }
    let cancelled = false
    setLoading(true)
    searchMovies(debouncedQuery).then((data) => {
      if (!cancelled) {
        setResults(data.slice(0, 8))
        setIsOpen(true)
        setActiveIndex(-1)
        setLoading(false)
      }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayItems = query.trim() ? results : history

  function handleSelect(movieId: number, title: string, movieObj?: TMDBSearchResult) {
    if (movieObj) saveToHistory(movieObj)
    setHistory(getHistory())
    setIsOpen(false)
    setQuery('')
    onSelect(movieId, title)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || displayItems.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, displayItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const item = displayItems[activeIndex]
      handleSelect(item.id, item.title, results.find(r => r.id === item.id))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showDropdown = isOpen && displayItems.length > 0

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-glass">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {loading && <div className="search-spinner" />}
        {!loading && query && (
          <button className="search-clear" onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}>✕</button>
        )}
      </div>

      {showDropdown && (
        <ul className="search-dropdown">
          {!query.trim() && history.length > 0 && (
            <li className="dropdown-section-label">Recent searches</li>
          )}
          {displayItems.map((item, i) => (
            <li
              key={item.id}
              className={`dropdown-item ${i === activeIndex ? 'dropdown-item-active' : ''}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(item.id, item.title, results.find(r => r.id === item.id))}
            >
              {getPosterUrl('poster_path' in item ? item.poster_path : null, 'w185') ? (
                <img
                  src={getPosterUrl('poster_path' in item ? item.poster_path : null, 'w185')!}
                  alt=""
                  className="dropdown-poster"
                  loading="lazy"
                />
              ) : (
                <div className="dropdown-poster no-poster-thumb">
                  <span>{item.title[0]}</span>
                </div>
              )}
              <div className="dropdown-info">
                <span className="dropdown-title">{item.title}</span>
                <span className="dropdown-year">{'release_date' in item ? item.release_date?.split('-')[0] : (item as { year: string }).year}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

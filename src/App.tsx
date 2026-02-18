import { useState } from 'react'
import SearchBar from './components/SearchBar'
import MovieCard from './components/MovieCard'
import TrendingGrid from './components/TrendingGrid'

export default function App() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)

  function handleSelect(movieId: number) {
    setSelectedMovieId(movieId)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Fliq</h1>
        <p className="tagline">find where to stream any movie</p>
      </header>

      <main className="main">
        <SearchBar onSelect={handleSelect} />
        {selectedMovieId ? (
          <MovieCard
            key={selectedMovieId}
            movieId={selectedMovieId}
            onSelect={handleSelect}
            onDismiss={() => setSelectedMovieId(null)}
          />
        ) : (
          <TrendingGrid onSelect={handleSelect} />
        )}
      </main>
    </div>
  )
}

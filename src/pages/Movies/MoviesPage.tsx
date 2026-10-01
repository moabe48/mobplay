import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Film, Search } from 'lucide-react';
import { Movie, Category } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';

interface MoviesPageProps {
  movies: Movie[];
  categories: Category[];
  favoritesMap: Record<string, boolean>;
  onPlayMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  onToggleFavorite: (id: string, type: 'movie') => void;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
  movies = [],
  categories = [],
  favoritesMap = {},
  onPlayMovie,
  onSelectMovie,
  onToggleFavorite,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(60);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const movieCategories = useMemo(
    () => (categories || []).filter((c) => c.type === 'movie' || !c.type),
    [categories]
  );

  const filteredMovies = useMemo(() => {
    let result = movies;
    if (selectedCategoryId === 'favorites') {
      result = result.filter((m) => favoritesMap[m.id]);
    } else if (selectedCategoryId !== 'all') {
      result = result.filter((m) => m.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    return result;
  }, [movies, selectedCategoryId, favoritesMap, searchQuery]);

  // Resetar limite de itens visíveis ao trocar de categoria ou filtro
  useEffect(() => {
    setVisibleLimit(60);
  }, [selectedCategoryId, searchQuery]);

  // Carregar mais itens ao rolar a tela
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 400) {
      if (visibleLimit < filteredMovies.length) {
        setVisibleLimit((prev) => Math.min(prev + 60, filteredMovies.length));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 text-slate-100 font-sans pb-20 md:pb-0">
      {/* Categories Sidebar */}
      <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-emerald-400" />
            <span>Filmes VOD</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar filme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          <button
            tabIndex={0}
            onClick={() => setSelectedCategoryId('all')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              selectedCategoryId === 'all'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span>Todos os Filmes</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300">
              {movies.length}
            </span>
          </button>

          {movieCategories.map((cat) => (
            <button
              key={cat.id}
              tabIndex={0}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold truncate transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                selectedCategoryId === cat.id
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <p className="text-xs text-slate-400 font-medium">
            Exibindo <span className="text-emerald-400 font-bold">{Math.min(visibleLimit, filteredMovies.length)}</span> de{' '}
            <span className="text-white font-bold">{filteredMovies.length}</span> filmes
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.slice(0, visibleLimit).map((mov) => (
            <MediaCard
              key={mov.id}
              item={mov}
              type="movie"
              onPlay={() => onPlayMovie(mov)}
              onSelect={() => onSelectMovie(mov)}
              onToggleFavorite={onToggleFavorite}
              isFavorite={!!favoritesMap[mov.id]}
            />
          ))}
        </div>

        {visibleLimit < filteredMovies.length && (
          <div className="flex justify-center pt-4">
            <button
              tabIndex={0}
              onClick={() => setVisibleLimit((prev) => Math.min(prev + 60, filteredMovies.length))}
              className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 hover:bg-slate-800 focus:ring-4 focus:ring-cyan-400 focus:outline-none"
            >
              Carregar Mais Filmes...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon, Tv, Film, Clapperboard, Loader2 } from 'lucide-react';
import { Channel, Movie, Series } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';

interface SearchPageProps {
  query: string;
  setQuery: (q: string) => void;
  channels: Channel[];
  movies: Movie[];
  series: Series[];
  favoritesMap: Record<string, boolean>;
  onPlay: (item: Channel | Movie | Series) => void;
  onOpenDetails: (item: Movie | Series) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  query,
  setQuery,
  channels,
  movies,
  series,
  favoritesMap,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'live' | 'movie' | 'series'>('all');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Limite de itens renderizados por página de busca
  const [liveLimit, setLiveLimit] = useState<number>(48);
  const [movieLimit, setMovieLimit] = useState<number>(48);
  const [seriesLimit, setSeriesLimit] = useState<number>(48);

  // Debounce da busca (200ms) para não travar enquanto o usuário digita
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
      // Resetar limites ao mudar de termo
      setLiveLimit(48);
      setMovieLimit(48);
      setSeriesLimit(48);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const qLower = useMemo(() => debouncedQuery.toLowerCase().trim(), [debouncedQuery]);

  // Filtragem ultra otimizada com useMemo
  const matchingChannels = useMemo(() => {
    if (!qLower || qLower.length < 2) return [];
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(qLower) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(qLower))
    );
  }, [channels, qLower]);

  const matchingMovies = useMemo(() => {
    if (!qLower || qLower.length < 2) return [];
    return movies.filter(
      (m) =>
        m.name.toLowerCase().includes(qLower) ||
        (m.categoryName && m.categoryName.toLowerCase().includes(qLower)) ||
        (m.genre && m.genre.toLowerCase().includes(qLower))
    );
  }, [movies, qLower]);

  const matchingSeries = useMemo(() => {
    if (!qLower || qLower.length < 2) return [];
    return series.filter(
      (s) =>
        s.name.toLowerCase().includes(qLower) ||
        (s.categoryName && s.categoryName.toLowerCase().includes(qLower)) ||
        (s.genre && s.genre.toLowerCase().includes(qLower))
    );
  }, [series, qLower]);

  // Slices limitados para DOM leve
  const displayedChannels = useMemo(
    () => matchingChannels.slice(0, liveLimit),
    [matchingChannels, liveLimit]
  );
  const displayedMovies = useMemo(
    () => matchingMovies.slice(0, movieLimit),
    [matchingMovies, movieLimit]
  );
  const displayedSeries = useMemo(
    () => matchingSeries.slice(0, seriesLimit),
    [matchingSeries, seriesLimit]
  );

  const hasResults =
    matchingChannels.length > 0 || matchingMovies.length > 0 || matchingSeries.length > 0;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 font-sans no-scrollbar bg-dark-bg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-brand-500" />
            <span>Pesquisa Global</span>
          </h1>
          {debouncedQuery ? (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Resultados para &ldquo;<strong className="text-white">{debouncedQuery}</strong>&rdquo;</span>
              {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Digite pelo menos 2 caracteres na barra acima para buscar instantaneamente.
            </p>
          )}
        </div>
      </div>

      {/* Filter Type Pills */}
      {debouncedQuery.length >= 2 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-dark-card border border-dark-border/60 text-slate-400 hover:text-white'
            }`}
          >
            Todos os Resultados ({matchingChannels.length + matchingMovies.length + matchingSeries.length})
          </button>
          <button
            onClick={() => setFilterType('live')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'live'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-dark-card border border-dark-border/60 text-slate-400 hover:text-white'
            }`}
          >
            Canais ({matchingChannels.length})
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'movie'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-dark-card border border-dark-border/60 text-slate-400 hover:text-white'
            }`}
          >
            Filmes ({matchingMovies.length})
          </button>
          <button
            onClick={() => setFilterType('series')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'series'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-dark-card border border-dark-border/60 text-slate-400 hover:text-white'
            }`}
          >
            Séries ({matchingSeries.length})
          </button>
        </div>
      )}

      {/* Display Results */}
      {debouncedQuery.length >= 2 ? (
        hasResults ? (
          <div className="space-y-8">
            {/* Canais */}
            {(filterType === 'all' || filterType === 'live') && matchingChannels.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-brand-500" />
                  <span>Canais ao Vivo ({matchingChannels.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {displayedChannels.map((c) => (
                    <MediaCard
                      key={c.id}
                      item={c}
                      type="live"
                      onPlay={onPlay}
                      onToggleFavorite={onToggleFavorite}
                      isFavorite={favoritesMap[c.id]}
                    />
                  ))}
                </div>
                {liveLimit < matchingChannels.length && (
                  <button
                    onClick={() => setLiveLimit((prev) => prev + 48)}
                    className="px-5 py-2 rounded-xl bg-dark-cardHover border border-dark-border text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Ver mais canais ({matchingChannels.length - liveLimit} restantes)
                  </button>
                )}
              </div>
            )}

            {/* Filmes */}
            {(filterType === 'all' || filterType === 'movie') && matchingMovies.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-brand-500" />
                  <span>Filmes (VOD) ({matchingMovies.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {displayedMovies.map((m) => (
                    <div key={m.id} onClick={() => onOpenDetails(m)}>
                      <MediaCard
                        item={m}
                        type="movie"
                        onPlay={onOpenDetails}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={favoritesMap[m.id]}
                      />
                    </div>
                  ))}
                </div>
                {movieLimit < matchingMovies.length && (
                  <button
                    onClick={() => setMovieLimit((prev) => prev + 48)}
                    className="px-5 py-2 rounded-xl bg-dark-cardHover border border-dark-border text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Ver mais filmes ({matchingMovies.length - movieLimit} restantes)
                  </button>
                )}
              </div>
            )}

            {/* Séries */}
            {(filterType === 'all' || filterType === 'series') && matchingSeries.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-brand-500" />
                  <span>Séries ({matchingSeries.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {displayedSeries.map((s) => (
                    <div key={s.id} onClick={() => onOpenDetails(s)}>
                      <MediaCard
                        item={s}
                        type="series"
                        onPlay={onOpenDetails}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={favoritesMap[s.id]}
                      />
                    </div>
                  ))}
                </div>
                {seriesLimit < matchingSeries.length && (
                  <button
                    onClick={() => setSeriesLimit((prev) => prev + 48)}
                    className="px-5 py-2 rounded-xl bg-dark-cardHover border border-dark-border text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Ver mais séries ({matchingSeries.length - seriesLimit} restantes)
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400 bg-dark-card/40 border border-dark-border/40 rounded-3xl">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold">Nenhum resultado encontrado para &ldquo;{debouncedQuery}&rdquo;.</p>
          </div>
        )
      ) : (
        <div className="p-16 text-center text-slate-400 bg-dark-card/40 border border-dark-border/40 rounded-3xl">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-semibold">Digite o nome de um canal, filme ou série na barra de busca acima.</p>
        </div>
      )}
    </div>
  );
};

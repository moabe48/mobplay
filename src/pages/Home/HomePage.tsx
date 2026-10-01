import React from 'react';
import { Play, Tv, Film, Clapperboard, Heart, Clock, Sparkles } from 'lucide-react';
import { Channel, Movie, Series, WatchHistoryItem } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';
import { NavTab } from '../../components/layout/Sidebar';

interface HomePageProps {
  channels?: Channel[];
  movies?: Movie[];
  seriesList?: Series[];
  history?: WatchHistoryItem[];
  favoritesMap?: Record<string, boolean>;
  setActiveTab: (tab: NavTab) => void;
  onPlayItem: (item: any, type: 'live' | 'movie' | 'series') => void;
  onSelectMovie: (movie: Movie) => void;
  onSelectSeries: (series: Series) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  channels = [],
  movies = [],
  seriesList = [],
  history = [],
  favoritesMap = {},
  setActiveTab,
  onPlayItem,
  onSelectMovie,
  onSelectSeries,
  onToggleFavorite,
}) => {
  // Filmes e Séries favoritados para a seção de Favoritos da Home
  const favoriteMovies = movies.filter((m) => favoritesMap[m.id]);
  const favoriteSeries = seriesList.filter((s) => favoritesMap[s.id]);
  const favoriteChannels = channels.filter((c) => favoritesMap[c.id]);

  return (
    <div className="flex-1 overflow-y-auto space-y-8 p-4 md:p-8 font-sans no-scrollbar pb-24 md:pb-8 bg-slate-950 text-slate-100">
      {/* HEADER DA HOME - LOGO & TITULO */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-wider flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              MobPlay
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium">
            Selecione uma categoria para começar
          </p>
        </div>
      </div>

      {/* 1. NAVEGAÇÃO PRINCIPAL - 3 TILES GRANDES SMART TV */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* TV AO VIVO */}
        <button
          tabIndex={0}
          onClick={() => setActiveTab('livetv')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-cyan-900/60 via-slate-900 to-slate-950 border-2 border-cyan-500/30 hover:border-cyan-400 transition-all focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none shadow-2xl text-center"
        >
          <div className="p-4 rounded-2xl bg-cyan-500/20 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
            <Tv className="w-12 h-12 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-white uppercase tracking-wider">
            [ TV AO VIVO ]
          </span>
          <span className="text-xs font-bold text-cyan-400 mt-1">
            {channels.length > 0 ? `${channels.length} CANAIS DISPONÍVEIS` : 'ACESSAR CANAIS'}
          </span>
        </button>

        {/* FILMES */}
        <button
          tabIndex={0}
          onClick={() => setActiveTab('movies')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-emerald-900/60 via-slate-900 to-slate-950 border-2 border-emerald-500/30 hover:border-emerald-400 transition-all focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none shadow-2xl text-center"
        >
          <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Film className="w-12 h-12 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-white uppercase tracking-wider">
            [ FILMES ]
          </span>
          <span className="text-xs font-bold text-emerald-400 mt-1">
            {movies.length > 0 ? `${movies.length} TÍTULOS DISPONÍVEIS` : 'CATÁLOGO VOD'}
          </span>
        </button>

        {/* SÉRIES */}
        <button
          tabIndex={0}
          onClick={() => setActiveTab('series')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-purple-900/60 via-slate-900 to-slate-950 border-2 border-purple-500/30 hover:border-purple-400 transition-all focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none shadow-2xl text-center"
        >
          <div className="p-4 rounded-2xl bg-purple-500/20 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Clapperboard className="w-12 h-12 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-white uppercase tracking-wider">
            [ SÉRIES ]
          </span>
          <span className="text-xs font-bold text-purple-400 mt-1">
            {seriesList.length > 0 ? `${seriesList.length} SÉRIES NO CATÁLOGO` : 'TEMPORADAS & EPISÓDIOS'}
          </span>
        </button>
      </div>

      {/* 2. CONTINUAR ASSISTINDO */}
      {history && history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Continuar assistindo</span>
            </h2>
            <button
              tabIndex={0}
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-cyan-400 hover:underline focus:ring-2 focus:ring-cyan-400 focus:outline-none px-2 py-1 rounded-lg"
            >
              Ver Histórico Completo
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => {
                  const ch = channels.find((c) => c.id === item.contentId);
                  const mov = movies.find((m) => m.id === item.contentId);
                  if (ch) onPlayItem(ch, 'live');
                  else if (mov) onPlayItem(mov, 'movie');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23) {
                    const ch = channels.find((c) => c.id === item.contentId);
                    const mov = movies.find((m) => m.id === item.contentId);
                    if (ch) onPlayItem(ch, 'live');
                    else if (mov) onPlayItem(mov, 'movie');
                  }
                }}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer transition-all hover:border-cyan-500 focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none flex flex-col justify-between"
              >
                <div className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Tv className="w-8 h-8 text-slate-700" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-cyan-400 fill-cyan-400" />
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                  {/* Barra de Progresso */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, item.progressPercentage || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. FAVORITOS */}
      {(favoriteMovies.length > 0 || favoriteSeries.length > 0 || favoriteChannels.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>Favoritos</span>
            </h2>
            <button
              tabIndex={0}
              onClick={() => setActiveTab('favorites')}
              className="text-xs font-semibold text-cyan-400 hover:underline focus:ring-2 focus:ring-cyan-400 focus:outline-none px-2 py-1 rounded-lg"
            >
              Ver Todos ({Object.keys(favoritesMap).length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {favoriteMovies.slice(0, 6).map((mov) => (
              <MediaCard
                key={mov.id}
                item={mov}
                type="movie"
                onPlay={() => onPlayItem(mov, 'movie')}
                onSelect={() => onSelectMovie(mov)}
                onToggleFavorite={onToggleFavorite}
                isFavorite={true}
              />
            ))}

            {favoriteSeries.slice(0, 6).map((ser) => (
              <MediaCard
                key={ser.id}
                item={ser}
                type="series"
                onPlay={() => onPlayItem(ser, 'series')}
                onSelect={() => onSelectSeries(ser)}
                onToggleFavorite={onToggleFavorite}
                isFavorite={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. ADICIONADOS RECENTEMENTE */}
      {movies && movies.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Assistidos recentemente / Adicionados recente</span>
            </h2>
            <button
              tabIndex={0}
              onClick={() => setActiveTab('movies')}
              className="text-xs font-semibold text-cyan-400 hover:underline focus:ring-2 focus:ring-cyan-400 focus:outline-none px-2 py-1 rounded-lg"
            >
              Ver Catálogo Completo
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {movies.slice(0, 12).map((mov) => (
              <MediaCard
                key={mov.id}
                item={mov}
                type="movie"
                onPlay={() => onPlayItem(mov, 'movie')}
                onSelect={() => onSelectMovie(mov)}
                onToggleFavorite={onToggleFavorite}
                isFavorite={!!favoritesMap[mov.id]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};


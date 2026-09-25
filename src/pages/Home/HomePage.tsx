import React from 'react';
import { Play, Tv, Film, Clapperboard, Calendar, Settings, Sparkles, Heart } from 'lucide-react';
import { Channel, Movie, Series, WatchHistoryItem } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';
import { NavTab } from '../../components/layout/Sidebar';

interface HomePageProps {
  channels: Channel[];
  movies: Movie[];
  seriesList: Series[];
  history: WatchHistoryItem[];
  favoritesMap: Record<string, boolean>;
  setActiveTab: (tab: NavTab) => void;
  onPlayItem: (item: any, type: 'live' | 'movie' | 'series') => void;
  onSelectMovie: (movie: Movie) => void;
  onSelectSeries: (series: Series) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  channels,
  movies,
  seriesList,
  history,
  favoritesMap,
  setActiveTab,
  onPlayItem,
  onSelectMovie,
  onSelectSeries,
  onToggleFavorite,
}) => {
  // Filme em destaque no Hero Banner
  const heroMovie = movies[0] || null;

  return (
    <div className="flex-1 overflow-y-auto space-y-8 p-4 md:p-8 font-sans no-scrollbar pb-24 md:pb-8">
      {/* 1. HERO BANNER CINEMATOGRÁFICO PARA SMART TV */}
      {heroMovie && (
        <div className="relative w-full h-[360px] md:h-[440px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col justify-end p-6 md:p-12">
          {/* Background Image */}
          {heroMovie.backdrop || heroMovie.poster ? (
            <img
              src={heroMovie.backdrop || heroMovie.poster}
              alt={heroMovie.name}
              className="absolute inset-0 w-full h-full object-cover filter brightness-75"
            />
          ) : null}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />

          {/* Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Destaque da Semana</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide uppercase leading-tight">
              {heroMovie.name}
            </h1>

            <p className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3">
              {heroMovie.plot || 'Aproveite este lançamento exclusivo no MobPlay com máxima qualidade de transmissão em 4K Ultra HD.'}
            </p>

            {/* D-Pad Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                tabIndex={0}
                onClick={() => onSelectMovie(heroMovie)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm md:text-base shadow-xl flex items-center gap-2.5 transition-transform focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>ASSISTIR AGORA</span>
              </button>

              <button
                tabIndex={0}
                onClick={() => onToggleFavorite(heroMovie.id, 'movie')}
                className="px-6 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-white font-bold text-sm md:text-base flex items-center gap-2 transition-transform focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none"
              >
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span>FAVORITO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ATALHOS DE CATEGORIAS SMART TV (TILES GRANDES) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[
          { id: 'livetv', label: 'TV ao Vivo', count: `${channels.length} canais`, icon: <Tv className="w-7 h-7 text-cyan-400" />, color: 'from-cyan-600/30 to-blue-600/20' },
          { id: 'movies', label: 'Filmes', count: `${movies.length} títulos`, icon: <Film className="w-7 h-7 text-emerald-400" />, color: 'from-emerald-600/30 to-teal-600/20' },
          { id: 'series', label: 'Séries', count: `${seriesList.length} séries`, icon: <Clapperboard className="w-7 h-7 text-purple-400" />, color: 'from-purple-600/30 to-indigo-600/20' },
          { id: 'epg', label: 'Guia EPG', count: 'Grade de Programação', icon: <Calendar className="w-7 h-7 text-amber-400" />, color: 'from-amber-600/30 to-orange-600/20' },
          { id: 'settings', label: 'Configurações', count: 'Preferências', icon: <Settings className="w-7 h-7 text-slate-400" />, color: 'from-slate-600/30 to-slate-800/20' },
        ].map((item) => (
          <button
            key={item.id}
            tabIndex={0}
            onClick={() => setActiveTab(item.id as NavTab)}
            className={`flex flex-col p-5 rounded-3xl bg-gradient-to-br ${item.color} border border-slate-800 hover:border-cyan-500/50 text-left transition-all group focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none`}
          >
            <div className="p-3 rounded-2xl bg-slate-950/80 w-fit mb-3 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <span className="text-base font-bold text-white tracking-wide">{item.label}</span>
            <span className="text-xs text-slate-400 font-medium mt-0.5">{item.count}</span>
          </button>
        ))}
      </div>

      {/* 3. CARROSSÉIS SMART TV (FILMES E SÉRIES RECENTES) */}
      {movies.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Film className="w-5 h-5 text-emerald-400" />
              <span>Filmes Adicionados Recente</span>
            </h2>
            <button
              tabIndex={0}
              onClick={() => setActiveTab('movies')}
              className="text-xs font-semibold text-cyan-400 hover:underline focus:ring-2 focus:ring-cyan-400 focus:outline-none px-2 py-1 rounded-lg"
            >
              Ver Todos
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

      {seriesList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-purple-400" />
              <span>Séries em Alta</span>
            </h2>
            <button
              tabIndex={0}
              onClick={() => setActiveTab('series')}
              className="text-xs font-semibold text-cyan-400 hover:underline focus:ring-2 focus:ring-cyan-400 focus:outline-none px-2 py-1 rounded-lg"
            >
              Ver Todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {seriesList.slice(0, 12).map((ser) => (
              <MediaCard
                key={ser.id}
                item={ser}
                type="series"
                onPlay={() => onPlayItem(ser, 'series')}
                onSelect={() => onSelectSeries(ser)}
                onToggleFavorite={onToggleFavorite}
                isFavorite={!!favoritesMap[ser.id]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

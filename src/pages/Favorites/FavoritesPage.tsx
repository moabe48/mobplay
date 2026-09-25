import React, { useState } from 'react';
import { Heart, Tv, Film, Clapperboard } from 'lucide-react';
import { Channel, Movie, Series } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';

interface FavoritesPageProps {
  channels: Channel[];
  movies: Movie[];
  series: Series[];
  favoritesMap: Record<string, boolean>;
  onPlay: (item: Channel | Movie | Series) => void;
  onOpenDetails: (item: Movie | Series) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  channels,
  movies,
  series,
  favoritesMap,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'movie' | 'series'>('live');

  const favChannels = channels.filter((c) => favoritesMap[c.id]);
  const favMovies = movies.filter((m) => favoritesMap[m.id]);
  const favSeries = series.filter((s) => favoritesMap[s.id]);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 font-sans no-scrollbar">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-brand-500 fill-current" />
          <span>Meus Favoritos</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Acesse rapidamente seus canais, filmes e séries marcados como favoritos.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 p-1.5 bg-dark-card border border-dark-border/60 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'live'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Canais ({favChannels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movie')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'movie'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Filmes ({favMovies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'series'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          <span>Séries ({favSeries.length})</span>
        </button>
      </div>

      {/* Favorites Content */}
      {activeTab === 'live' && (
        favChannels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {favChannels.map((c) => (
              <MediaCard
                key={c.id}
                item={c}
                type="live"
                onPlay={onPlay}
                onToggleFavorite={onToggleFavorite}
                isFavorite={true}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 p-8 text-center bg-dark-card/40 border border-dark-border/40 rounded-2xl">
            Nenhum canal favoritado ainda.
          </p>
        )
      )}

      {activeTab === 'movie' && (
        favMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {favMovies.map((m) => (
              <div key={m.id} onClick={() => onOpenDetails(m)}>
                <MediaCard
                  item={m}
                  type="movie"
                  onPlay={onOpenDetails}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 p-8 text-center bg-dark-card/40 border border-dark-border/40 rounded-2xl">
            Nenhum filme favoritado ainda.
          </p>
        )
      )}

      {activeTab === 'series' && (
        favSeries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {favSeries.map((s) => (
              <div key={s.id} onClick={() => onOpenDetails(s)}>
                <MediaCard
                  item={s}
                  type="series"
                  onPlay={onOpenDetails}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 p-8 text-center bg-dark-card/40 border border-dark-border/40 rounded-2xl">
            Nenhuma série favoritada ainda.
          </p>
        )
      )}
    </div>
  );
};

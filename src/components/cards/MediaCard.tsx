import React from 'react';
import { Play, Heart, Star, Tv } from 'lucide-react';
import { Channel, Movie, Series } from '../../types/iptv';

interface MediaCardProps {
  item: Channel | Movie | Series;
  type: 'live' | 'movie' | 'series';
  onPlay: (item: Channel | Movie | Series) => void;
  onToggleFavorite?: (id: string, type: 'live' | 'movie' | 'series') => void;
  isFavorite?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = React.memo(({
  item,
  type,
  onPlay,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const isChannel = type === 'live';
  const title = item.name;
  const image = isChannel
    ? (item as Channel).logo
    : (item as Movie | Series).poster;
  const rating = 'rating' in item ? (item as Movie | Series).rating : null;
  const year = 'year' in item ? (item as Movie | Series).year : null;

  return (
    <div className="group relative bg-dark-card border border-dark-border/60 hover:border-brand-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col">
      {/* Poster / Thumbnail Container */}
      <div className="relative aspect-[2/3] w-full bg-dark-bg/60 overflow-hidden flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback Icon se a imagem não carregar ou não existir */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center -z-10">
          <Tv className="w-10 h-10 mb-2 text-slate-600" />
          <span className="text-xs font-semibold text-slate-400 line-clamp-2">{title}</span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {rating && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-amber-400 font-bold text-[11px]">
              <Star className="w-3 h-3 fill-current" />
              {rating}
            </span>
          )}

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id, type);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                isFavorite
                  ? 'bg-brand-600 text-white'
                  : 'bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Play Overlay em Hover */}
        <div
          onClick={() => onPlay(item)}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Media Info Footer */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-dark-card">
        <div>
          <h4 className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {title}
          </h4>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            {item.categoryName || 'Geral'}
          </span>
        </div>

        {year && (
          <span className="text-[10px] font-semibold text-slate-500 mt-2 block">
            {year}
          </span>
        )}
      </div>
    </div>
  );
});

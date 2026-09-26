import React from 'react';
import { Play, Heart, Star, Tv } from 'lucide-react';
import { Channel, Movie, Series } from '../../types/iptv';
import { clsx } from 'clsx';

interface MediaCardProps {
  item: Channel | Movie | Series;
  type: 'live' | 'movie' | 'series';
  onPlay: (item: any) => void;
  onSelect?: (item: any) => void;
  onToggleFavorite?: (id: string, type: 'live' | 'movie' | 'series') => void;
  isFavorite?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  type,
  onPlay,
  onSelect,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const isLive = type === 'live';
  const channel = isLive ? (item as Channel) : null;
  const movie = type === 'movie' ? (item as Movie) : null;
  const series = type === 'series' ? (item as Series) : null;

  const title = item.name;
  const logo = isLive ? channel?.logo : movie?.poster || series?.poster;
  const rating = movie?.rating || series?.rating;
  const year = movie?.year;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item);
    } else {
      onPlay(item);
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (
          e.key === 'Enter' ||
          e.key === 'Select' ||
          e.key === ' ' ||
          e.keyCode === 13 ||
          e.keyCode === 23 ||
          e.keyCode === 66
        ) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={clsx(
        'group relative bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:z-40 focus:border-cyan-400',
        isLive ? 'aspect-square flex flex-col items-center justify-center p-3' : 'aspect-[2/3] flex flex-col justify-end'
      )}
    >
      {/* Poster Image or Channel Logo */}
      {isLive ? (
        <div className="w-full h-full flex items-center justify-center p-2">
          {logo ? (
            <img
              src={logo}
              alt={title}
              className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-110 group-focus:scale-110 transition-transform duration-200"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Tv className="w-12 h-12 text-slate-500" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-slate-950">
          {logo ? (
            <img
              src={logo}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 text-sm font-bold">
              {title}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Badges / Rating */}
      {!isLive && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          {rating ? (
            <div className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{rating}</span>
            </div>
          ) : (
            <div />
          )}

          {year && (
            <div className="px-2 py-0.5 rounded-lg bg-slate-950/80 text-slate-300 text-[11px] font-semibold border border-slate-800">
              {year}
            </div>
          )}
        </div>
      )}

      {/* Favorite Button */}
      {onToggleFavorite && (
        <button
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id, type);
          }}
          className={clsx(
            'absolute top-3 right-3 p-2 rounded-xl z-20 transition-all opacity-0 group-hover:opacity-100 group-focus:opacity-100',
            isFavorite ? 'bg-red-600 text-white opacity-100' : 'bg-slate-900/80 text-slate-300 hover:text-white'
          )}
        >
          <Heart className={clsx('w-4 h-4', isFavorite && 'fill-white')} />
        </button>
      )}

      {/* Title Bar */}
      <div className={clsx('relative z-10 p-3 text-left w-full', isLive ? 'border-t border-slate-800/60 bg-slate-950/90' : '')}>
        <p className="text-xs md:text-sm font-bold text-white truncate tracking-wide group-hover:text-cyan-400 group-focus:text-cyan-400 transition-colors">
          {title}
        </p>

        {isLive && channel && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {channel.categoryName || 'Canal ao Vivo'}
          </p>
        )}
      </div>

      {/* Play Overlay Button */}
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-cyan-950/40 pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 group-focus:scale-100 transition-transform">
          <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
        </div>
      </div>
    </div>
  );
};

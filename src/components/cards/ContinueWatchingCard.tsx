import React from 'react';
import { Play, Clock } from 'lucide-react';
import { WatchHistoryItem } from '../../types/iptv';

interface ContinueWatchingCardProps {
  item: WatchHistoryItem;
  onPlay: (item: WatchHistoryItem) => void;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onPlay }) => {
  const remainingSec = Math.max(0, item.durationSec - item.currentPosSec);
  const remainingMins = Math.ceil(remainingSec / 60);

  return (
    <div
      onClick={() => onPlay(item)}
      className="group relative bg-dark-card border border-dark-border/60 hover:border-brand-500/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col shrink-0 w-64 md:w-72"
    >
      {/* Thumbnail Aspect 16:9 */}
      <div className="relative aspect-video w-full bg-dark-bg overflow-hidden flex items-center justify-center">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-500">
            <Clock className="w-8 h-8" />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badge Tempo Restante */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-semibold text-slate-200 flex items-center gap-1">
          <Clock className="w-3 h-3 text-brand-400" />
          <span>{remainingMins} min restantes</span>
        </div>
      </div>

      {/* Info & Progress */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-dark-card">
        <div>
          <h4 className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {item.title}
          </h4>
          <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
            {item.categoryName || 'Filmes & Séries'}
            {item.seasonNum && ` • Temp ${item.seasonNum} Ep ${item.episodeNum}`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-dark-border/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500 block text-right mt-1">
            {Math.round(item.progressPercentage)}% concluído
          </span>
        </div>
      </div>
    </div>
  );
};

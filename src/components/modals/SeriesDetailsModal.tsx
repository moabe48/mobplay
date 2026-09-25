import React, { useState } from 'react';
import { Play, Heart, Star, X, Clapperboard, Clock } from 'lucide-react';
import { Series, Episode } from '../../types/iptv';

interface SeriesDetailsModalProps {
  series: Series | null;
  episodes: Episode[];
  onClose: () => void;
  onPlayEpisode: (episode: Episode, series: Series) => void;
  onToggleFavorite?: (id: string, type: 'series') => void;
  isFavorite?: boolean;
}

export const SeriesDetailsModal: React.FC<SeriesDetailsModalProps> = ({
  series,
  episodes,
  onClose,
  onPlayEpisode,
  onToggleFavorite,
  isFavorite = false,
}) => {
  if (!series) return null;

  // Extrair temporadas disponíveis
  const seasons = Array.from(new Set(episodes.map((ep) => ep.seasonNum))).sort((a, b) => a - b);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasons[0] || 1);

  const filteredEpisodes = episodes.filter((ep) => ep.seasonNum === selectedSeason);
  const backdrop = series.backdrop || series.poster;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Backdrop Banner */}
        <div className="relative h-64 md:h-72 w-full bg-dark-bg">
          {backdrop ? (
            <img src={backdrop} alt={series.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-900/40 to-slate-900 flex items-center justify-center">
              <Clapperboard className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
        </div>

        {/* Series Header Content */}
        <div className="p-6 md:p-8 relative -mt-20 z-10">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {series.poster && (
              <div className="w-36 md:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-dark-border shrink-0 bg-dark-bg">
                <img src={series.poster} alt={series.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {series.rating && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {series.rating}
                    </span>
                  )}
                  {series.year && (
                    <span className="text-xs text-slate-300 font-medium">{series.year}</span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-dark-border/80 text-[11px] font-semibold text-slate-300">
                    {series.categoryName || 'Série'}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                  {series.name}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {series.synopsis || 'Nenhuma sinopse disponível para esta série.'}
                </p>
              </div>

              {/* Favoritar */}
              {onToggleFavorite && (
                <div className="mt-4">
                  <button
                    onClick={() => onToggleFavorite(series.id, 'series')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs border transition-all ${
                      isFavorite
                        ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                        : 'bg-dark-cardHover border-dark-border text-slate-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-brand-500' : ''}`} />
                    <span>{isFavorite ? 'Favoritado' : 'Favoritar Série'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Season Selector Tabs */}
          <div className="border-t border-dark-border/60 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Temporadas e Episódios</h3>
              {seasons.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {seasons.map((seasonNum) => (
                    <button
                      key={seasonNum}
                      onClick={() => setSelectedSeason(seasonNum)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        selectedSeason === seasonNum
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'bg-dark-cardHover text-slate-400 hover:text-white'
                      }`}
                    >
                      Temporada {seasonNum}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes Grid/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
              {filteredEpisodes.length > 0 ? (
                filteredEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      onPlayEpisode(ep, series);
                      onClose();
                    }}
                    className="group flex gap-4 p-3 rounded-2xl bg-dark-cardHover/60 border border-dark-border/50 hover:border-brand-500/50 cursor-pointer transition-all hover:bg-dark-cardHover"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-32 aspect-video rounded-xl bg-dark-bg overflow-hidden shrink-0">
                      {ep.cover ? (
                        <img src={ep.cover} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-dark-border/50 text-slate-500">
                          <Clapperboard className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </div>
                    </div>

                    {/* Ep Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                            Episódio {ep.episodeNum}
                          </span>
                          {ep.duration && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ep.duration}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1 mt-0.5">
                          {ep.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {ep.overview || 'Sem descrição.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 col-span-2 text-center py-6">
                  Nenhum episódio encontrado para esta temporada.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

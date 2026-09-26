import React, { useState, useEffect, useRef } from 'react';
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
  const firstEpRef = useRef<HTMLDivElement | null>(null);

  // Extrair temporadas disponíveis
  const seasons = Array.from(new Set(episodes.map((ep) => ep.seasonNum))).sort((a, b) => a - b);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasons[0] || 1);

  const filteredEpisodes = episodes.filter((ep) => ep.seasonNum === selectedSeason);

  // Auto-focar no primeiro episódio ao abrir no controle da TV
  useEffect(() => {
    if (series) {
      const timer = setTimeout(() => {
        firstEpRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [series, selectedSeason]);

  if (!series) return null;

  const backdrop = series.backdrop || series.poster;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp my-8">
        {/* Close Button */}
        <button
          tabIndex={0}
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-white/20 text-white transition-colors focus:ring-4 focus:ring-cyan-400 focus:outline-none"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Backdrop Banner */}
        <div className="relative h-64 md:h-72 w-full bg-slate-950">
          {backdrop ? (
            <img src={backdrop} alt={series.name} className="w-full h-full object-cover filter brightness-90" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-950 to-slate-950 flex items-center justify-center">
              <Clapperboard className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Series Header Content */}
        <div className="p-6 md:p-8 relative -mt-20 z-10">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {series.poster && (
              <div className="w-36 md:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 shrink-0 bg-slate-900">
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
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-[11px] font-semibold text-slate-300">
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
                    tabIndex={0}
                    onClick={() => onToggleFavorite(series.id, 'series')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                      isFavorite
                        ? 'bg-red-600/20 border-red-500 text-red-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                    <span>{isFavorite ? 'Favoritado' : 'Favoritar Série'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Season Selector Tabs */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-white">Temporadas e Episódios</h3>
              {seasons.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {seasons.map((seasonNum) => (
                    <button
                      key={seasonNum}
                      tabIndex={0}
                      onClick={() => setSelectedSeason(seasonNum)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                        selectedSeason === seasonNum
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Temporada {seasonNum}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes Grid/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
              {filteredEpisodes.length > 0 ? (
                filteredEpisodes.map((ep, idx) => (
                  <div
                    key={ep.id}
                    ref={idx === 0 ? firstEpRef : null}
                    tabIndex={0}
                    role="button"
                    onClick={() => {
                      onPlayEpisode(ep, series);
                      onClose();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                        e.preventDefault();
                        onPlayEpisode(ep, series);
                        onClose();
                      }
                    }}
                    className="group flex gap-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition-all focus:ring-4 focus:ring-cyan-400 focus:scale-[1.02] focus:outline-none"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-32 aspect-video rounded-xl bg-slate-950 overflow-hidden shrink-0">
                      {ep.cover ? (
                        <img src={ep.cover} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
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
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                            Episódio {ep.episodeNum}
                          </span>
                          {ep.duration && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ep.duration}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mt-0.5">
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

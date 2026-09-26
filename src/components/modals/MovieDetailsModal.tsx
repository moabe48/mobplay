import React, { useEffect, useRef } from 'react';
import { Play, Heart, Star, X, Calendar, Clock, Film } from 'lucide-react';
import { Movie } from '../../types/iptv';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onToggleFavorite?: (id: string, type: 'movie') => void;
  isFavorite?: boolean;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onPlay,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const playButtonRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focar no botão "Assistir Filme" ao abrir o modal no controle da TV
  useEffect(() => {
    if (movie) {
      const timer = setTimeout(() => {
        playButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [movie]);

  if (!movie) return null;

  const backdrop = movie.backdrop || movie.poster;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
        {/* Close Button */}
        <button
          tabIndex={0}
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-white/20 text-white transition-colors focus:ring-4 focus:ring-cyan-400 focus:outline-none"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-64 md:h-80 w-full bg-slate-950">
          {backdrop ? (
            <img src={backdrop} alt={movie.name} className="w-full h-full object-cover filter brightness-90" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 to-slate-950 flex items-center justify-center">
              <Film className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        </div>

        {/* Content Details */}
        <div className="p-6 md:p-8 relative -mt-20 z-10 flex flex-col md:flex-row gap-6">
          {/* Poster */}
          {movie.poster && (
            <div className="w-36 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 shrink-0 bg-slate-900">
              <img src={movie.poster} alt={movie.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Details Column */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                {movie.rating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {movie.rating}
                  </span>
                )}
                {movie.year && (
                  <span className="flex items-center gap-1 text-xs text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {movie.year}
                  </span>
                )}
                {movie.duration && (
                  <span className="flex items-center gap-1 text-xs text-slate-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {movie.duration}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-[11px] font-semibold text-slate-300">
                  {movie.categoryName || 'Filme'}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                {movie.name}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {movie.synopsis || 'Nenhuma sinopse disponível para este filme.'}
              </p>

              {movie.cast && (
                <p className="text-xs text-slate-400 mb-4">
                  <strong className="text-slate-200">Elenco:</strong> {movie.cast}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-4">
              <button
                ref={playButtonRef}
                tabIndex={0}
                onClick={() => {
                  onPlay(movie);
                  onClose();
                }}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-base shadow-xl transition-transform focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>ASSISTIR FILME</span>
              </button>

              {onToggleFavorite && (
                <button
                  tabIndex={0}
                  onClick={() => onToggleFavorite(movie.id, 'movie')}
                  className={`flex items-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm border transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                    isFavorite
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                  <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

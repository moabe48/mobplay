import React from 'react';
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
  if (!movie) return null;

  const backdrop = movie.backdrop || movie.poster;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-64 md:h-80 w-full bg-dark-bg">
          {backdrop ? (
            <img src={backdrop} alt={movie.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-900/40 to-slate-900 flex items-center justify-center">
              <Film className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
        </div>

        {/* Content Details */}
        <div className="p-6 md:p-8 relative -mt-20 z-10 flex flex-col md:flex-row gap-6">
          {/* Poster */}
          {movie.poster && (
            <div className="w-36 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-dark-border shrink-0 bg-dark-bg">
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
                <span className="px-2.5 py-0.5 rounded-md bg-dark-border/80 text-[11px] font-semibold text-slate-300">
                  {movie.categoryName || 'Filme'}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
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
                onClick={() => {
                  onPlay(movie);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Assistir Filme</span>
              </button>

              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(movie.id, 'movie')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm border transition-all ${
                    isFavorite
                      ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                      : 'bg-dark-cardHover border-dark-border text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-brand-500' : ''}`} />
                  <span>{isFavorite ? 'Favoritado' : 'Adicionar aos Favoritos'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { WatchHistoryItem } from '../../types/iptv';
import { ContinueWatchingCard } from '../../components/cards/ContinueWatchingCard';

interface HistoryPageProps {
  history: WatchHistoryItem[];
  onPlay: (item: WatchHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onPlay, onClearHistory }) => {
  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 font-sans no-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-500" />
            <span>Histórico de Reprodução</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Veja seu progresso de onde parou em cada vídeo e retome a reprodução a qualquer momento.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Histórico</span>
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {history.map((item) => (
            <div key={item.id} className="w-full">
              <ContinueWatchingCard item={item} onPlay={onPlay} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-dark-card/40 border border-dark-border/40 rounded-3xl">
          <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-semibold">Nenhum histórico de reprodução registrado ainda.</p>
        </div>
      )}
    </div>
  );
};

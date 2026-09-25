import React from 'react';
import { Tv2, Loader2 } from 'lucide-react';

interface SyncPageProps {
  progressMessage: string;
  progressPercent: number;
}

export const SyncPage: React.FC<SyncPageProps> = ({ progressMessage, progressPercent }) => {
  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        {/* Animated Brand Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-red-500 shadow-2xl shadow-brand-500/40 flex items-center justify-center text-white mb-8 animate-bounce">
          <Tv2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2">
          Preparando sua biblioteca...
        </h2>
        <p className="text-xs text-slate-400 mb-8 h-6">{progressMessage}</p>

        {/* Progress Bar Container */}
        <div className="w-full bg-dark-card border border-dark-border/80 h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-4">
          <div
            className="bg-gradient-to-r from-brand-600 to-red-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-brand-500/50"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Percentage Label */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>
    </div>
  );
};

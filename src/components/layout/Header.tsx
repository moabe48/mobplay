import React from 'react';
import { Search, RefreshCw, Wifi, ShieldCheck, UserCheck } from 'lucide-react';
import { IPTVAccount } from '../../types/iptv';

interface HeaderProps {
  account: IPTVAccount | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSearch: () => void;
  onRefreshData: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  searchQuery,
  setSearchQuery,
  onOpenSearch,
  onRefreshData,
  isSyncing,
}) => {
  return (
    <header className="h-20 bg-dark-header/80 backdrop-blur-md border-b border-dark-border/40 px-6 flex items-center justify-between gap-4 z-20">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onOpenSearch();
          }}
          placeholder="Pesquisar canais, filmes, séries, episódios..."
          className="w-full pl-10 pr-4 py-2.5 bg-dark-card/80 border border-dark-border/60 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
        />
      </div>

      {/* Account Info & Refresh Controls */}
      <div className="flex items-center gap-4">
        {account && (
          <div className="flex items-center gap-3 bg-dark-card/60 border border-dark-border/50 px-3.5 py-1.5 rounded-xl text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="font-semibold text-white max-w-[140px] truncate">
                {account.name}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                {account.type === 'xtream'
                  ? 'Xtream Codes'
                  : account.type === 'm3u_url'
                  ? 'Lista M3U'
                  : account.type === 'm3u_file'
                  ? 'Arquivo M3U'
                  : 'Modo Demonstração'}
              </span>
            </div>
          </div>
        )}

        {/* Sync / Refresh Button */}
        <button
          onClick={onRefreshData}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-xs font-medium disabled:opacity-50"
          title="Sincronizar Lista e EPG"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>
      </div>
    </header>
  );
};

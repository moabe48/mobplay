import React, { useState, useEffect } from 'react';
import { Tv, Film, Clapperboard, Heart, Search, Settings, Play } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onRefreshData?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefreshData,
  isSyncing = false,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'livetv', label: 'AO VIVO', icon: <Tv className="w-4 h-4" /> },
    { id: 'movies', label: 'FILMES', icon: <Film className="w-4 h-4" /> },
    { id: 'series', label: 'SÉRIES', icon: <Clapperboard className="w-4 h-4" /> },
    { id: 'favorites', label: 'FAVORITOS', icon: <Heart className="w-4 h-4" /> },
    { id: 'search', label: 'BUSCAR', icon: <Search className="w-4 h-4" /> },
    { id: 'settings', label: 'CONFIGURAÇÕES', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="h-16 md:h-20 bg-slate-950/95 border-b border-slate-900 px-4 md:px-8 flex items-center justify-between gap-4 z-40 select-none">
      {/* 1. LOGO MOBPLAY ESQUERDA */}
      <button
        tabIndex={0}
        onClick={() => setActiveTab('home')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
            e.preventDefault();
            setActiveTab('home');
          }
        }}
        className="flex items-center gap-2.5 shrink-0 cursor-pointer focus:ring-2 focus:ring-cyan-400 focus:outline-none p-1.5 rounded-xl"
      >
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Play className="w-5 h-5 fill-cyan-400 text-cyan-400 ml-0.5" />
        </div>
        <span className="text-xl md:text-2xl font-black text-white tracking-wide font-sans">
          Mob<span className="text-cyan-400">Play</span>
        </span>
      </button>

      {/* 2. BARRA DE NAVEGAÇÃO CENTRAL (PILLS SMART TV - SEMPRE VISÍVEL) */}
      <nav className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              tabIndex={0}
              onClick={() => setActiveTab(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                  e.preventDefault();
                  setActiveTab(item.id);
                }
              }}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-2xl text-xs font-bold tracking-wider transition-all duration-150 shrink-0 cursor-pointer focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                isActive
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. ÍCONES E RELÓGIO DIREITA */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          tabIndex={0}
          onClick={() => setActiveTab('search')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
              e.preventDefault();
              setActiveTab('search');
            }
          }}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
          title="Buscar"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          tabIndex={0}
          onClick={() => setActiveTab('settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
              e.preventDefault();
              setActiveTab('settings');
            }
          }}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
          title="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>

        {timeStr && (
          <span className="text-sm font-bold text-slate-300 font-mono pl-2 tracking-wider">
            {timeStr}
          </span>
        )}
      </div>
    </header>
  );
};


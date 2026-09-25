import React from 'react';
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  Heart,
  Clock,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

export type NavTab =
  | 'home'
  | 'livetv'
  | 'movies'
  | 'series'
  | 'favorites'
  | 'history'
  | 'epg'
  | 'search'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-6 h-6" /> },
    { id: 'livetv', label: 'TV ao Vivo', icon: <Tv className="w-6 h-6" /> },
    { id: 'movies', label: 'Filmes', icon: <Film className="w-6 h-6" /> },
    { id: 'series', label: 'Séries', icon: <Clapperboard className="w-6 h-6" /> },
    { id: 'favorites', label: 'Favoritos', icon: <Heart className="w-6 h-6" /> },
    { id: 'history', label: 'Continuar Assistindo', icon: <Clock className="w-6 h-6" /> },
    { id: 'epg', label: 'Guia EPG', icon: <Calendar className="w-6 h-6" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-6 h-6" /> },
  ];

  return (
    <aside
      className={clsx(
        'hidden md:flex relative flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 z-30 select-none shrink-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* App Logo Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/95 p-1.5 shadow-lg shadow-cyan-500/20 shrink-0 border border-cyan-500/30">
            <img src="/logo.png" alt="MobPlay Logo" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fadeIn">
              <span className="text-xl font-black tracking-wider text-white uppercase font-sans">
                Mob<span className="text-cyan-400">Play</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                IPTV Player
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-150 group relative focus:ring-4 focus:ring-cyan-400 focus:outline-none',
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <div
                className={clsx(
                  'transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                )}
              >
                {item.icon}
              </div>

              {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Badge */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <p className="text-xs text-slate-200 font-bold">MobPlay v1.0.1</p>
          <p className="text-[11px] text-cyan-400 font-semibold mt-0.5">Android TV, Mobile & PC</p>
        </div>
      )}
    </aside>
  );
};

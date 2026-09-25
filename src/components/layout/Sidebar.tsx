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
  Tv2,
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
    { id: 'home', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'livetv', label: 'TV ao Vivo', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'Filmes', icon: <Film className="w-5 h-5" /> },
    { id: 'series', label: 'Séries', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favoritos', icon: <Heart className="w-5 h-5" /> },
    { id: 'history', label: 'Continuar Assistindo', icon: <Clock className="w-5 h-5" /> },
    { id: 'epg', label: 'Guia EPG', icon: <Calendar className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={clsx(
        'relative flex flex-col bg-dark-sidebar border-r border-dark-border/60 transition-all duration-300 z-30 select-none',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* App Logo Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-dark-border/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/90 p-1 shadow-lg shadow-cyan-500/20 shrink-0">
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
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-cardHover transition-colors"
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-brand-600/90 to-red-600/80 text-white shadow-md shadow-brand-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-dark-cardHover/70'
              )}
            >
              <div
                className={clsx(
                  'transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'
                )}
              >
                {item.icon}
              </div>

              {!collapsed && (
                <span className="truncate tracking-wide">{item.label}</span>
              )}

              {/* Tooltip quando recolhido */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-dark-card text-white text-xs rounded-md shadow-xl border border-dark-border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Badge / Footer */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-xl bg-dark-card/50 border border-dark-border/40 text-center">
          <p className="text-xs text-slate-300 font-semibold">MobPlay v1.0</p>
          <p className="text-[11px] text-cyan-400 font-medium mt-0.5">Android TV, Mobile & PC</p>
        </div>
      )}
    </aside>
  );
};

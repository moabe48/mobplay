import React from 'react';
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  Heart,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { APP_CONFIG } from '../../config/updateConfig';

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
    { id: 'home', label: 'INÍCIO', icon: <Home className="w-5 h-5" /> },
    { id: 'livetv', label: 'AO VIVO', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'FILMES', icon: <Film className="w-5 h-5" /> },
    { id: 'series', label: 'SÉRIES', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'favorites', label: 'FAVORITOS', icon: <Heart className="w-5 h-5" /> },
    { id: 'search', label: 'BUSCAR', icon: <Search className="w-5 h-5" /> },
    { id: 'settings', label: 'CONFIGURAÇÕES', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={clsx(
        'hidden md:flex relative flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-200 z-30 select-none shrink-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* App Logo Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/95 p-1.5 shadow-md shrink-0 border border-cyan-500/30">
            <img src="/logo.png" alt="MobPlay Logo" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fadeIn">
              <span className="text-xl font-black tracking-wider text-white uppercase font-sans">
                Mob<span className="text-cyan-400">Play</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                Android TV
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          tabIndex={0}
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors focus:ring-4 focus:ring-cyan-400 focus:outline-none"
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
              tabIndex={0}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black text-sm tracking-wider transition-all duration-100 group relative focus:ring-4 focus:ring-cyan-400 focus:scale-[1.03] focus:outline-none',
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              )}
            >
              <div
                className={clsx(
                  'transition-transform duration-150 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                )}
              >
                {item.icon}
              </div>

              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Badge */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
          <p className="text-xs text-slate-200 font-extrabold">MobPlay v{APP_CONFIG.version}</p>
          <p className="text-[10px] text-cyan-400 font-bold mt-0.5 uppercase tracking-wider">Android TV & Box</p>
        </div>
      )}
    </aside>
  );
};

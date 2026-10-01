import React from 'react';
import { Home, Tv, Film, Clapperboard, Settings } from 'lucide-react';
import { NavTab } from './Sidebar';
import { clsx } from 'clsx';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const items: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'livetv', label: 'TV ao Vivo', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'Filmes', icon: <Film className="w-5 h-5" /> },
    { id: 'series', label: 'Séries', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'settings', label: 'Config', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="hidden md:hidden landscape:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 border-t border-slate-800 items-center justify-around z-40 px-2 select-none">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              'flex flex-col items-center justify-center w-full py-1 gap-1 text-xs font-medium transition-colors',
              isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <div className={clsx(isActive && 'scale-110 text-cyan-400 transition-transform')}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

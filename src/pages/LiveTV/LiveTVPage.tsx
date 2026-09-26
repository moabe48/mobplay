import React, { useState, useMemo } from 'react';
import { Tv, Search, Heart, Play, ListFilter } from 'lucide-react';
import { Channel, Category, EPGProgram } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';

interface LiveTVPageProps {
  channels: Channel[];
  categories: Category[];
  favoritesMap: Record<string, boolean>;
  onPlayChannel: (channel: Channel) => void;
  onToggleFavorite: (id: string, type: 'live') => void;
  epgPrograms?: EPGProgram[];
}

export const LiveTVPage: React.FC<LiveTVPageProps> = ({
  channels = [],
  categories = [],
  favoritesMap = {},
  onPlayChannel,
  onToggleFavorite,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels[0] || null);

  const liveCategories = useMemo(
    () => (categories || []).filter((c) => c.type === 'live' || !c.type),
    [categories]
  );

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (selectedCategoryId === 'favorites') {
      result = result.filter((ch) => favoritesMap[ch.id]);
    } else if (selectedCategoryId !== 'all') {
      result = result.filter((ch) => ch.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }

    return result;
  }, [channels, selectedCategoryId, favoritesMap, searchQuery]);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 text-slate-100 font-sans pb-20 md:pb-0">
      {/* 1. CATEGORIAS DE CANAIS (COLUNA DA ESQUERDA NA TV) */}
      <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-cyan-400" />
            <span>TV ao Vivo</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar canal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
        </div>

        {/* Lista de Categorias Focável por D-Pad */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          <button
            tabIndex={0}
            onClick={() => setSelectedCategoryId('all')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              selectedCategoryId === 'all'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span className="truncate">Todos os Canais</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300">
              {channels.length}
            </span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setSelectedCategoryId('favorites')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              selectedCategoryId === 'favorites'
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>Favoritos</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300">
              {Object.keys(favoritesMap).length}
            </span>
          </button>

          {liveCategories.map((cat) => (
            <button
              key={cat.id}
              tabIndex={0}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold truncate transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                selectedCategoryId === cat.id
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. GRADE DE CANAIS (PAINEL CENTRAL) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <p className="text-xs text-slate-400 font-medium">
            Exibindo <span className="text-cyan-400 font-bold">{filteredChannels.length}</span> canais
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredChannels.slice(0, 72).map((ch) => (
            <MediaCard
              key={ch.id}
              item={ch}
              type="live"
              onPlay={() => onPlayChannel(ch)}
              onSelect={() => {
                setSelectedChannel(ch);
                onPlayChannel(ch);
              }}
              onToggleFavorite={onToggleFavorite}
              isFavorite={!!favoritesMap[ch.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

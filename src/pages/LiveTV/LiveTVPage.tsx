import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tv, Search, Heart, Play, List } from 'lucide-react';
import { Channel, Category, EPGProgram } from '../../types/iptv';
import { LiveMiniPreview } from '../../components/player/LiveMiniPreview';

interface LiveTVPageProps {
  channels?: Channel[];
  categories?: Category[];
  favoritesMap?: Record<string, boolean>;
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
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Ao mudar de categoria, definir primeiro canal por padrão
  useEffect(() => {
    if (filteredChannels.length > 0 && (!selectedChannel || !filteredChannels.some(c => c.id === selectedChannel.id))) {
      setSelectedChannel(filteredChannels[0]);
    }
  }, [filteredChannels]);

  // Debounce no foco para evitar gargalos durante rolagem rápida do D-Pad
  const handleChannelFocus = (ch: Channel) => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    focusTimeoutRef.current = setTimeout(() => {
      setSelectedChannel(ch);
    }, 120);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 text-slate-100 font-sans pb-20 md:pb-0">
      {/* 1. CATEGORIAS DE CANAIS (COLUNA DA ESQUERDA) */}
      <div className="w-full md:w-60 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
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

      {/* 2. MODO LISTA DE CANAIS (COLUNA CENTRAL) */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 no-scrollbar">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 px-2">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
            <List className="w-4 h-4 text-cyan-400" />
            <span>Lista de Canais ({filteredChannels.length})</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {filteredChannels.slice(0, 300).map((ch, idx) => {
            const isSelected = selectedChannel?.id === ch.id;
            const isFav = !!favoritesMap[ch.id];

            return (
              <div
                key={ch.id}
                tabIndex={0}
                role="button"
                onFocus={() => handleChannelFocus(ch)}
                onClick={() => {
                  setSelectedChannel(ch);
                  onPlayChannel(ch);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23) {
                    e.preventDefault();
                    onPlayChannel(ch);
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:scale-[1.01] ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/60 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Número de Sequência */}
                  <span className="text-xs font-extrabold text-slate-500 w-6 text-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* Logo Quadrada sem Corte */}
                  <div className="w-12 h-12 rounded-xl bg-white/95 p-1 shadow-md shrink-0 border border-cyan-500/30 flex items-center justify-center">
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Tv className="w-6 h-6 text-slate-800" />
                    )}
                  </div>

                  {/* Nome do Canal & Categoria */}
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-white truncate tracking-wide">{ch.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {ch.categoryName || 'Canal ao Vivo'}
                    </p>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex items-center gap-2 shrink-0">
                  {isFav && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}

                  <button
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayChannel(ch);
                    }}
                    className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PAINEL DE PRÉ-VISUALIZAÇÃO AO VIVO (COLUNA DA DIREITA) */}
      <div className="hidden lg:block w-96 shrink-0 h-full">
        <LiveMiniPreview
          channel={selectedChannel}
          onFullscreen={onPlayChannel}
          onToggleFavorite={onToggleFavorite}
          isFavorite={selectedChannel ? !!favoritesMap[selectedChannel.id] : false}
        />
      </div>
    </div>
  );
};

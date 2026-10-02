import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Tv,
  Search,
  Heart,
  Play,
  List,
  Clock,
  Star,
  Grid,
  Trophy,
  Film,
  Newspaper,
  Smile,
  Music,
  Radio,
  Maximize2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
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
  epgPrograms = [],
  onPlayChannel,
  onToggleFavorite,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels[0] || null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionTimeRef = useRef<number>(0);

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

  // Contagem por categoria
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ch of channels) {
      if (ch.categoryId) {
        map[ch.categoryId] = (map[ch.categoryId] || 0) + 1;
      }
    }
    return map;
  }, [channels]);

  // Mapeamento EPG Atual
  const currentEpgMap = useMemo(() => {
    const map: Record<string, string> = {};
    const nowMs = Date.now();

    for (const ch of channels) {
      const chId = String(ch.id).toLowerCase();
      const streamId = String(ch.streamId || '').toLowerCase();
      const epgId = String(ch.epgId || '').toLowerCase();
      const chName = String(ch.name).toLowerCase();

      const foundProg = epgPrograms.find((p) => {
        if (!p) return false;
        const pChId = String(p.channelId).toLowerCase();
        const s = new Date(p.start).getTime();
        const e = new Date(p.end).getTime();
        const isCurrentTime = nowMs >= s && nowMs <= e;

        return (
          isCurrentTime &&
          (pChId === chId || pChId === streamId || (epgId && pChId === epgId) || pChId === chName)
        );
      });

      if (foundProg) {
        map[ch.id] = foundProg.title;
      } else {
        const catLower = (ch.categoryName || '').toLowerCase();
        if (catLower.includes('esporte') || catLower.includes('sport')) {
          map[ch.id] = `Jornal da Noite`;
        } else if (catLower.includes('notíc') || catLower.includes('news')) {
          map[ch.id] = `Notícias do Mundo`;
        } else if (catLower.includes('filme') || catLower.includes('cinema')) {
          map[ch.id] = `Sessão da Tarde`;
        } else if (catLower.includes('infantil') || catLower.includes('kids')) {
          map[ch.id] = `Mundo Infantil`;
        } else {
          map[ch.id] = `Transmissão ao Vivo`;
        }
      }
    }
    return map;
  }, [channels, epgPrograms]);

  useEffect(() => {
    if (filteredChannels.length > 0 && (!selectedChannel || !filteredChannels.some(c => c.id === selectedChannel.id))) {
      setSelectedChannel(filteredChannels[0]);
    }
  }, [filteredChannels]);

  const handleChannelFocus = (ch: Channel) => {
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      setSelectedChannel(ch);
    }, 150);
  };

  /**
   * Gerenciador de Ação do Canal (OK ou Clique) com Trava Anti-Duplo Disparo do D-Pad
   */
  const handleChannelAction = (ch: Channel) => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 250) return;
    lastActionTimeRef.current = now;

    if (selectedChannel?.id === ch.id) {
      // Segundo clique consecutivo no canal selecionado: abre em tela cheia!
      onPlayChannel(ch);
    } else {
      // Primeiro clique: seleciona o canal e inicia o preview
      setSelectedChannel(ch);
    }
  };

  // Helper para ícone por nome de categoria
  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('esporte') || lower.includes('sport')) return <Trophy className="w-4 h-4 text-cyan-400" />;
    if (lower.includes('filme') || lower.includes('cinema')) return <Film className="w-4 h-4 text-emerald-400" />;
    if (lower.includes('notíc') || lower.includes('news')) return <Newspaper className="w-4 h-4 text-amber-400" />;
    if (lower.includes('infantil') || lower.includes('kids')) return <Smile className="w-4 h-4 text-pink-400" />;
    if (lower.includes('música') || lower.includes('music')) return <Music className="w-4 h-4 text-purple-400" />;
    return <Tv className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden bg-slate-950 text-slate-100 font-sans p-3 md:p-6 gap-3 md:gap-4 select-none pb-3 md:pb-6">
      {/* 1. CARD CATEGORIAS (COLUNA ESQUERDA) */}
      <div className="w-56 lg:w-64 bg-slate-900/80 border border-slate-800/80 rounded-3xl flex flex-col shrink-0 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <h2 className="text-base font-bold text-white tracking-wide">Categorias</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          {/* Favoritos */}
          <button
            id="live-cat-favorites"
            tabIndex={0}
            onClick={() => setSelectedCategoryId('favorites')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                const targetId = selectedChannel ? `live-ch-${selectedChannel.id}` : 'live-ch-0';
                document.getElementById(targetId)?.focus();
              }
            }}
            className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              selectedCategoryId === 'favorites'
                ? 'bg-cyan-500/20 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>Favoritos</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {Object.keys(favoritesMap).length}
            </span>
          </button>

          {/* Todos */}
          <button
            id="live-cat-all"
            tabIndex={0}
            onClick={() => setSelectedCategoryId('all')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                const targetId = selectedChannel ? `live-ch-${selectedChannel.id}` : 'live-ch-0';
                document.getElementById(targetId)?.focus();
              }
            }}
            className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              selectedCategoryId === 'all'
                ? 'bg-cyan-500/20 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Grid className="w-4 h-4 text-cyan-400" />
              <span>Todos</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {channels.length}
            </span>
          </button>

          {/* Lista de Categorias Reais */}
          {liveCategories.map((cat) => (
            <button
              key={cat.id}
              id={`live-cat-${cat.id}`}
              tabIndex={0}
              onClick={() => setSelectedCategoryId(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const targetId = selectedChannel ? `live-ch-${selectedChannel.id}` : 'live-ch-0';
                  document.getElementById(targetId)?.focus();
                }
              }}
              className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                selectedCategoryId === cat.id
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate pr-2">
                {getCategoryIcon(cat.name)}
                <span className="truncate">{cat.name}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {categoryCounts[cat.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. CARD CANAIS (COLUNA CENTRAL) */}
      <div className="flex-1 min-w-[280px] bg-slate-900/80 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-wide">Canais</h2>
          <span className="text-xs text-slate-400 font-mono">
            {filteredChannels.length} canais
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {filteredChannels.slice(0, 300).map((ch, idx) => {
            const isSelected = selectedChannel?.id === ch.id;
            const seqNum = String(idx + 1).padStart(3, '0');
            const programName = currentEpgMap[ch.id] || 'Transmissão ao Vivo';

            return (
              <div
                key={ch.id}
                id={idx === 0 ? 'live-ch-0' : `live-ch-${ch.id}`}
                tabIndex={0}
                role="button"
                onFocus={() => handleChannelFocus(ch)}
                onClick={() => handleChannelAction(ch)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' ||
                    e.key === 'Select' ||
                    e.key === ' ' ||
                    e.keyCode === 13 ||
                    e.keyCode === 23 ||
                    e.keyCode === 66
                  ) {
                    e.preventDefault();
                    handleChannelAction(ch);
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const catBtn =
                      document.getElementById(`live-cat-${selectedCategoryId}`) ||
                      document.getElementById('live-cat-all');
                    catBtn?.focus();
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    document.getElementById('live-preview-box')?.focus();
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-cyan-400 ${
                  isSelected
                    ? 'bg-cyan-950/60 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Número de Sequência 001, 002... */}
                  <span className="text-xs font-bold text-slate-400 font-mono w-8 text-center shrink-0">
                    {seqNum}
                  </span>

                  {/* Logo Quadrada Estilizada */}
                  <div className="w-10 h-10 rounded-xl bg-slate-950 p-1 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
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
                      <Tv className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>

                  {/* Nome do Canal & Subtítulo do Programa */}
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-white truncate">{ch.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">{programName}</p>
                  </div>
                </div>

                {/* Ícone de Favorito */}
                {favoritesMap[ch.id] && (
                  <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CARD PREVIEW & EPG (COLUNA DIREITA SEMPRE VISÍVEL NA TV) */}
      <div
        id="live-preview-box"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (selectedChannel) {
              document.getElementById(`live-ch-${selectedChannel.id}`)?.focus();
            } else {
              document.getElementById('live-ch-0')?.focus();
            }
          } else if (
            e.key === 'Enter' ||
            e.key === 'Select' ||
            e.key === ' ' ||
            e.keyCode === 13 ||
            e.keyCode === 23 ||
            e.keyCode === 66
          ) {
            e.preventDefault();
            if (selectedChannel) onPlayChannel(selectedChannel);
          }
        }}
        className="w-80 lg:w-96 bg-slate-900/80 border border-slate-800/80 rounded-3xl flex flex-col shrink-0 overflow-hidden shadow-2xl focus:outline-none focus:ring-4 focus:ring-cyan-400"
      >
        <LiveMiniPreview
          channel={selectedChannel}
          epgPrograms={epgPrograms}
          onFullscreen={onPlayChannel}
          onToggleFavorite={onToggleFavorite}
          isFavorite={selectedChannel ? !!favoritesMap[selectedChannel.id] : false}
        />
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Tv, Heart, Radio, Calendar, Play, LayoutGrid, List, Maximize2, Star } from 'lucide-react';
import { Channel, Category, EPGProgram } from '../../types/iptv';

interface LiveTVPageProps {
  channels: Channel[];
  categories: Category[];
  epgPrograms: EPGProgram[];
  favoritesMap: Record<string, boolean>;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
}

// Sub-componente de Pré-visualização de Vídeo ao Vivo no Painel da Direita
const LivePreviewPlayer: React.FC<{ channel: Channel; onPlayFullscreen: () => void }> = ({
  channel,
  onPlayFullscreen,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channel || !channel.url || !videoRef.current) return;
    setLoading(true);
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported() && channel.url.includes('.m3u8')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 5,
      });

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });
    } else {
      video.src = channel.url;
      video.onloadeddata = () => setLoading(false);
      video.play().catch(() => {});
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [channel]);

  return (
    <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-brand-500/40 shadow-2xl group cursor-pointer" onClick={onPlayFullscreen}>
      <video ref={videoRef} muted autoPlay playsInline className="w-full h-full object-contain" />

      {loading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-[11px] text-slate-300 font-medium">Carregando pré-visualização...</span>
        </div>
      )}

      {/* Overlay de Hover para Tela Cheia */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600/90 text-white font-bold text-xs shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
          <Maximize2 className="w-4 h-4" />
          <span>Tela Cheia</span>
        </div>
      </div>
    </div>
  );
};

export const LiveTVPage: React.FC<LiveTVPageProps> = ({
  channels,
  categories,
  epgPrograms,
  favoritesMap,
  onPlay,
  onToggleFavorite,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels[0] || null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Padrão Lista como solicitado
  const [visibleCount, setVisibleCount] = useState<number>(60);

  const liveCategories = useMemo(
    () => categories.filter((c) => c.type === 'live'),
    [categories]
  );

  // Filtragem de canais
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      if (selectedCatId === 'all') return true;
      if (selectedCatId === 'fav') return favoritesMap[c.id];
      return c.categoryId === selectedCatId;
    });
  }, [channels, selectedCatId, favoritesMap]);

  const displayedChannels = useMemo(
    () => filteredChannels.slice(0, visibleCount),
    [filteredChannels, visibleCount]
  );

  // EPG do canal selecionado
  const activeChannelEpg = useMemo(
    () => epgPrograms.filter((p) => selectedChannel && p.channelId === selectedChannel.id),
    [epgPrograms, selectedChannel]
  );

  const currentProgram = activeChannelEpg[0] || null;
  const nextProgram = activeChannelEpg[1] || null;

  let epgProgress = 50;
  if (currentProgram) {
    const startMs = new Date(currentProgram.start).getTime();
    const endMs = new Date(currentProgram.end).getTime();
    const nowMs = Date.now();
    if (endMs > startMs) {
      epgProgress = Math.min(100, Math.max(0, ((nowMs - startMs) / (endMs - startMs)) * 100));
    }
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden font-sans bg-dark-bg">
      {/* Esquerda: Lista de Categorias */}
      <div className="w-full md:w-64 bg-dark-sidebar/90 border-r border-dark-border/60 p-4 overflow-y-auto flex flex-col shrink-0 no-scrollbar">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
          Categorias de TV
        </h3>

        <div className="space-y-1">
          <button
            onClick={() => {
              setSelectedCatId('all');
              setVisibleCount(60);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedCatId === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-dark-cardHover'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tv className="w-4 h-4" />
              <span>Todos os Canais</span>
            </div>
            <span className="text-[10px] opacity-75">{channels.length}</span>
          </button>

          <button
            onClick={() => {
              setSelectedCatId('fav');
              setVisibleCount(60);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedCatId === 'fav'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-dark-cardHover'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>Favoritos</span>
            </div>
            <span className="text-[10px] opacity-75">
              {channels.filter((c) => favoritesMap[c.id]).length}
            </span>
          </button>

          {liveCategories.map((cat) => {
            const count = channels.filter((c) => c.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id);
                  setVisibleCount(60);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedCatId === cat.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-dark-cardHover'
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span className="text-[10px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Centro: Canais (Formato Lista ou Grid Quadrado) */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
        {/* Header da Seção de Canais com Alternância de Layout */}
        <div className="flex items-center justify-between border-b border-dark-border/40 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-500 animate-pulse" />
            <span>Canais ao Vivo ({filteredChannels.length})</span>
          </h2>

          {/* Toggle Layout (Lista vs Grid) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-dark-card border border-dark-border">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Grade Quadrada"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grade</span>
            </button>
          </div>
        </div>

        {/* Lista ou Grid de Canais */}
        {filteredChannels.length > 0 ? (
          <div className="space-y-6">
            {viewMode === 'list' ? (
              /* 1. MODO LISTA */
              <div className="space-y-2">
                {displayedChannels.map((channel) => {
                  const isSelected = selectedChannel?.id === channel.id;
                  const isFav = !!favoritesMap[channel.id];

                  return (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-900/30 border-brand-500/80 shadow-lg'
                          : 'bg-dark-card/60 border-dark-border/50 hover:bg-dark-cardHover hover:border-slate-600'
                      }`}
                    >
                      {/* Esquerda: Logo Quadrado e Nome */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Logo Quadrado Perfeito com object-contain sem cortar */}
                        <div className="w-12 h-12 rounded-xl bg-dark-bg border border-dark-border/80 shrink-0 p-1.5 flex items-center justify-center overflow-hidden">
                          {channel.logo ? (
                            <img
                              src={channel.logo}
                              alt={channel.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Tv className="w-6 h-6 text-slate-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-400">
                            {channel.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            {channel.categoryName || 'Geral'}
                          </span>
                        </div>
                      </div>

                      {/* Direita: Favorito & Botão Assistir */}
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(channel.id, 'live');
                          }}
                          className={`p-2 rounded-xl border transition-colors ${
                            isFav
                              ? 'bg-brand-600/30 border-brand-500 text-brand-400'
                              : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-brand-500' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlay(channel);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Assistir</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 2. MODO GRADE QUADRADA (CARDS QUADRADOS SEM CORTAR LOGO) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayedChannels.map((channel) => {
                  const isSelected = selectedChannel?.id === channel.id;
                  const isFav = !!favoritesMap[channel.id];

                  return (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`group relative bg-dark-card border rounded-2xl overflow-hidden p-3 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-500/50 shadow-xl'
                          : 'border-dark-border/60 hover:border-brand-500/50 hover:bg-dark-cardHover'
                      }`}
                    >
                      {/* Logo Quadrado Perfeito sem Corte */}
                      <div className="relative aspect-square w-full rounded-xl bg-dark-bg border border-dark-border/60 p-3 flex items-center justify-center overflow-hidden mb-2.5">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Tv className="w-8 h-8 text-slate-500" />
                        )}

                        {/* Top Favorito */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(channel.id, 'live');
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                            isFav
                              ? 'bg-brand-600 text-white'
                              : 'bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Footer Info */}
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-brand-400">
                          {channel.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          {channel.categoryName || 'Geral'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {visibleCount < filteredChannels.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 60)}
                  className="px-6 py-2.5 rounded-xl bg-dark-cardHover border border-dark-border text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  Carregar mais canais ({filteredChannels.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-dark-card/40 border border-dark-border/40 rounded-2xl">
            <Tv className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold">Nenhum canal encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Direita: Painel com PRÉ-VISUALIZAÇÃO DE VÍDEO AO VIVO + EPG */}
      {selectedChannel && (
        <div className="w-full md:w-80 bg-dark-card/90 border-l border-dark-border/60 p-6 flex flex-col justify-between shrink-0 no-scrollbar">
          <div>
            {/* MINI PLAYER DE PRÉ-VISUALIZAÇÃO AO VIVO */}
            <div className="pb-6 border-b border-dark-border/60 space-y-3">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block">
                Pré-visualização ao Vivo
              </span>

              <LivePreviewPlayer
                channel={selectedChannel}
                onPlayFullscreen={() => onPlay(selectedChannel)}
              />

              <div className="flex items-center justify-between pt-1">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    {selectedChannel.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {selectedChannel.categoryName}
                  </span>
                </div>

                <button
                  onClick={() => onPlay(selectedChannel)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shrink-0 transition-transform transform active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Assistir</span>
                </button>
              </div>
            </div>

            {/* Guia de Programação EPG */}
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                <span>Guia de Programação</span>
              </h4>

              {currentProgram ? (
                <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/60 space-y-2">
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wide">
                    Programa Atual
                  </span>
                  <h5 className="text-xs font-bold text-white leading-snug">
                    {currentProgram.title}
                  </h5>
                  {currentProgram.desc && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {currentProgram.desc}
                    </p>
                  )}
                  <div className="pt-2">
                    <div className="w-full bg-dark-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all"
                        style={{ width: `${epgProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>{new Date(currentProgram.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{new Date(currentProgram.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Sem programação EPG disponível para este canal no momento.
                </p>
              )}

              {nextProgram && (
                <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/40 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    A Seguir
                  </span>
                  <h5 className="text-xs font-semibold text-slate-200 truncate">
                    {nextProgram.title}
                  </h5>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(nextProgram.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

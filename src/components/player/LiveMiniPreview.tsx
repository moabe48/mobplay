import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { Play, Maximize2, Volume2, VolumeX, Heart, Tv, Radio, Clock, Calendar } from 'lucide-react';
import { Channel, EPGProgram } from '../../types/iptv';

interface LiveMiniPreviewProps {
  channel: Channel | null;
  epgPrograms?: EPGProgram[];
  onFullscreen: (channel: Channel) => void;
  onToggleFavorite?: (id: string, type: 'live') => void;
  isFavorite?: boolean;
}

export const LiveMiniPreview: React.FC<LiveMiniPreviewProps> = ({
  channel,
  epgPrograms = [],
  onFullscreen,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Muted por padrão no preview
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // EPG do Canal Selecionado com Busca Flexível e Gerador Dinâmico Fallback
  const channelEpg = useMemo(() => {
    if (!channel) return { current: null, upcoming: [] };
    const nowMs = Date.now();

    // 1. Filtrar programas reais que correspondem ao canal
    const programs = epgPrograms.filter((p) => {
      if (!p) return false;
      const chId = String(channel.id).toLowerCase();
      const pChId = String(p.channelId).toLowerCase();
      const streamId = String(channel.streamId || '').toLowerCase();
      const epgId = String(channel.epgId || '').toLowerCase();
      const chName = String(channel.name).toLowerCase();

      return (
        pChId === chId ||
        pChId === streamId ||
        (epgId && pChId === epgId) ||
        pChId === chName
      );
    });

    const current = programs.find((p) => {
      const s = new Date(p.start).getTime();
      const e = new Date(p.end).getTime();
      return nowMs >= s && nowMs <= e;
    });

    const upcoming = programs
      .filter((p) => new Date(p.start).getTime() > nowMs)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);

    if (current) {
      return { current, upcoming };
    }

    // 2. Se não houver EPG do servidor, gerar EPG Dinâmico Inteligente
    return generateFallbackEPG(channel);
  }, [channel, epgPrograms]);

  useEffect(() => {
    if (!channel || !channel.url || !videoRef.current) return;

    setLoading(true);
    setError(false);
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported() && (channel.url.includes('.m3u8') || channel.url.includes('http'))) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
        startLevel: -1,
      });

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.muted = isMuted;
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, () => {
        setError(true);
        setLoading(false);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.muted = isMuted;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
    } else {
      video.src = channel.url;
      video.muted = isMuted;
      video.play().catch(() => setIsPlaying(false));
      setLoading(false);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [channel]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  if (!channel) {
    return (
      <div className="w-full h-full bg-slate-950 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-slate-500 text-center">
        <Tv className="w-16 h-16 mb-3 text-slate-700 animate-pulse" />
        <p className="text-sm font-semibold">Selecione um canal na lista para iniciar a pré-visualização</p>
      </div>
    );
  }

  // Progresso do programa no ar
  let currentPct = 50;
  if (channelEpg.current) {
    const s = new Date(channelEpg.current.start).getTime();
    const e = new Date(channelEpg.current.end).getTime();
    const now = Date.now();
    currentPct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 font-sans select-none overflow-y-auto no-scrollbar space-y-3">
      <div className="space-y-3">
        {/* Title */}
        <h2 className="text-base font-bold text-white tracking-wide">Preview</h2>

        {/* Video Player Frame */}
        <div
          onClick={() => onFullscreen(channel)}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl cursor-pointer group focus:ring-4 focus:ring-cyan-400"
          tabIndex={0}
        >
          <video
            ref={videoRef}
            playsInline
            className="w-full h-full object-contain bg-black"
          />

          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-cyan-400 font-bold">Carregando...</span>
            </div>
          )}

          <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        {/* Channel Name & Channel Number */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="text-lg font-bold text-white truncate">{channel.name}</h3>
          <span className="text-sm font-bold text-slate-400 font-mono">
            {String(channel.number || channel.id || '001').padStart(3, '0').slice(-3)}
          </span>
        </div>

        {/* Agora Section */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-400">Agora</span>
            <span className="text-slate-400 text-[11px] font-mono">15 min restantes</span>
          </div>

          <p className="text-sm font-bold text-white leading-tight">
            {channelEpg.current?.title || 'Notícias do Mundo'}
          </p>

          <p className="text-xs text-slate-400 font-mono">
            {channelEpg.current
              ? `${new Date(channelEpg.current.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(channelEpg.current.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : '20:00 - 21:00'}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${currentPct}%` }}
            />
          </div>
        </div>

        {/* Próximo Section */}
        <div className="space-y-1 pt-2">
          <span className="text-xs font-bold text-slate-400 block">Próximo</span>
          <p className="text-xs font-bold text-slate-200">
            {channelEpg.upcoming[0]?.title || 'Jornal da Meia Noite'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {channelEpg.upcoming[0]
              ? `${new Date(channelEpg.upcoming[0].start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(channelEpg.upcoming[0].end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : '21:00 - 22:00'}
          </p>
        </div>
      </div>

      {/* D-Pad Navigation Help Footer matching screenshot bottom bar */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-around text-xs text-slate-300 font-bold">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-white">OK</span>
          <span>Assistir</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-white">↑ ↓</span>
          <span>Trocar</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-white">◄</span>
          <span>Voltar</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Gerador de EPG Dinâmico Inteligente quando o provedor não disponibilizar guia XMLTV
 */
function generateFallbackEPG(channel: Channel): { current: EPGProgram; upcoming: EPGProgram[] } {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const catName = channel.categoryName || 'Geral';
  let title = `${channel.name}: Transmissão ao Vivo`;
  let desc = `Programação contínua de ${channel.name} no segmento ${catName} em alta definição.`;

  const catLower = catName.toLowerCase();
  if (catLower.includes('esporte') || catLower.includes('sport')) {
    title = `${channel.name}: Cobertura Esportiva ao Vivo`;
    desc = `Transmissão ao vivo de partidas, notícias do mundo dos esportes e melhores momentos.`;
  } else if (catLower.includes('notíc') || catLower.includes('news')) {
    title = `${channel.name}: Jornalismo e Notícias 24h`;
    desc = `As principais manchetes, economia e atualizações do Brasil e do mundo em tempo real.`;
  } else if (catLower.includes('filme') || catLower.includes('cinema') || catLower.includes('hbo') || catLower.includes('telecine')) {
    title = `Sessão de Cinema: ${channel.name}`;
    desc = `Exibição especial de grandes sucessos do cinema mundial em qualidade HD.`;
  } else if (catLower.includes('infantil') || catLower.includes('kids') || catLower.includes('desenho')) {
    title = `Desenhos e Animações: ${channel.name}`;
    desc = `Programação infantil com os melhores desenhos e séries animadas.`;
  }

  const current: EPGProgram = {
    id: `fallback_${channel.id}_curr`,
    channelId: channel.id,
    title,
    desc,
    start: start.toISOString(),
    end: end.toISOString(),
    category: catName,
  };

  const up1Start = new Date(end);
  const up1End = new Date(up1Start.getTime() + 60 * 60 * 1000);
  const up2Start = new Date(up1End);
  const up2End = new Date(up2Start.getTime() + 60 * 60 * 1000);

  const upcoming: EPGProgram[] = [
    {
      id: `fallback_${channel.id}_up1`,
      channelId: channel.id,
      title: `${channel.name}: Edição Especial`,
      start: up1Start.toISOString(),
      end: up1End.toISOString(),
      category: catName,
    },
    {
      id: `fallback_${channel.id}_up2`,
      channelId: channel.id,
      title: `Programação Noturna - ${channel.name}`,
      start: up2Start.toISOString(),
      end: up2End.toISOString(),
      category: catName,
    },
  ];

  return { current, upcoming };
}

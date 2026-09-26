import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Maximize2, Volume2, VolumeX, Heart, Tv, Radio } from 'lucide-react';
import { Channel } from '../../types/iptv';

interface LiveMiniPreviewProps {
  channel: Channel | null;
  onFullscreen: (channel: Channel) => void;
  onToggleFavorite?: (id: string, type: 'live') => void;
  isFavorite?: boolean;
}

export const LiveMiniPreview: React.FC<LiveMiniPreviewProps> = ({
  channel,
  onFullscreen,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Muted por padrão no preview para não atrapalhar
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

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

  return (
    <div className="w-full h-full bg-slate-950 border-l border-slate-800 flex flex-col justify-between p-4 overflow-y-auto no-scrollbar font-sans select-none">
      <div className="space-y-4">
        {/* Banner do Player de Pré-Visualização */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl group">
          <video
            ref={videoRef}
            playsInline
            className="w-full h-full object-contain bg-black"
          />

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-cyan-400 font-bold">Carregando Sinal ao Vivo...</span>
            </div>
          )}

          {/* Live Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-lg">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>AO VIVO</span>
          </div>

          {/* Mute Control */}
          <button
            tabIndex={0}
            onClick={toggleMute}
            className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Informações do Canal Selecionado */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-white/95 p-1.5 shadow-md shrink-0 border border-cyan-500/30 flex items-center justify-center">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Tv className="w-7 h-7 text-slate-800" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-white truncate tracking-wide">{channel.name}</h3>
            <p className="text-xs text-cyan-400 font-semibold mt-0.5">{channel.categoryName || 'Transmissão ao Vivo'}</p>
          </div>

          {onToggleFavorite && (
            <button
              tabIndex={0}
              onClick={() => onToggleFavorite(channel.id, 'live')}
              className={`p-2.5 rounded-xl border transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                isFavorite
                  ? 'bg-red-600/20 border-red-500 text-red-500'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Botão de Tela Cheia D-Pad */}
      <div className="pt-4">
        <button
          tabIndex={0}
          onClick={() => onFullscreen(channel)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm md:text-base shadow-xl flex items-center justify-center gap-3 transition-transform focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none"
        >
          <Maximize2 className="w-5 h-5 stroke-[2.5]" />
          <span>ASSISTIR EM TELA CHEIA</span>
        </button>
      </div>
    </div>
  );
};

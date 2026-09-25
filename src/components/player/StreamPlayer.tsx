import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Tv,
  Heart,
  Info,
  X,
  ChevronRight,
  ListVideo,
  Settings,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Channel, Movie, Episode, EPGProgram } from '../../types/iptv';

interface StreamPlayerProps {
  item: Channel | Movie | Episode | null;
  itemType: 'live' | 'movie' | 'series';
  allChannels?: Channel[];
  onSelectChannel?: (channel: Channel) => void;
  onClose: () => void;
  onToggleFavorite?: (id: string, type: 'live' | 'movie' | 'series') => void;
  isFavorite?: boolean;
  epgProgram?: EPGProgram | null;
  onProgressUpdate?: (currentSec: number, totalSec: number) => void;
}

export const StreamPlayer: React.FC<StreamPlayerProps> = ({
  item,
  itemType,
  allChannels = [],
  onSelectChannel,
  onClose,
  onToggleFavorite,
  isFavorite = false,
  epgProgram,
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showChannelDrawer, setShowChannelDrawer] = useState<boolean>(false);
  const [showInfoOverlay, setShowInfoOverlay] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar Hls.js ou HTML5 Video
  useEffect(() => {
    if (!item || !item.url || !videoRef.current) return;

    setLoading(true);
    setErrorMsg(null);
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported() && (item.url.includes('.m3u8') || itemType === 'live')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        maxBufferSize: 30 * 1024 * 1024,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 10000,
        startLevel: -1,
      });

      hls.loadSource(item.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg('Falha de rede ao carregar a transmissão. Tentando reconectar...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setErrorMsg('Não foi possível carregar este conteúdo. Verifique a fonte IPTV.');
              setLoading(false);
              break;
          }
        }
      });
    } else {
      // Fallback HTML5 direto para MP4 / MKV
      video.src = item.url;
      video.onloadeddata = () => {
        setLoading(false);
        video.play().catch(() => setIsPlaying(false));
      };
      video.onerror = () => {
        setErrorMsg('Falha ao reproduzir o stream de mídia.');
        setLoading(false);
      };
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [item]);

  // Atualização de progresso
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(dur);
    if (onProgressUpdate && dur > 0) {
      onProgressUpdate(current, dur);
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.error('Erro PiP:', e);
    }
  };

  // Auto Hide Controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  // Suporte a Controle Remoto de Android TV (D-Pad Key Listener)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 4000);

      switch (e.key) {
        case 'ArrowLeft':
          if (itemType !== 'live') {
            if (videoRef.current) videoRef.current.currentTime -= 10;
          } else {
            setShowChannelDrawer((prev) => !prev);
          }
          break;
        case 'ArrowRight':
          if (itemType !== 'live') {
            if (videoRef.current) videoRef.current.currentTime += 10;
          } else {
            setShowChannelDrawer(true);
          }
          break;
        case 'ArrowUp':
          if (itemType === 'live' && allChannels.length > 0 && item) {
            const idx = allChannels.findIndex((c) => c.id === item.id);
            if (idx > 0 && onSelectChannel) onSelectChannel(allChannels[idx - 1]);
          } else {
            setVolume((v) => Math.min(1, v + 0.1));
          }
          break;
        case 'ArrowDown':
          if (itemType === 'live' && allChannels.length > 0 && item) {
            const idx = allChannels.findIndex((c) => c.id === item.id);
            if (idx >= 0 && idx < allChannels.length - 1 && onSelectChannel) onSelectChannel(allChannels[idx + 1]);
          } else {
            setVolume((v) => Math.max(0, v - 0.1));
          }
          break;
        case ' ':
        case 'Enter':
          togglePlay();
          break;
        case 'Escape':
        case 'Back':
        case 'GoBack':
          if (showChannelDrawer) {
            setShowChannelDrawer(false);
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, item, itemType, allChannels, onSelectChannel, showChannelDrawer, onClose]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!item) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden select-none"
    >
      {/* Elemento de Vídeo */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Spinner de Carregamento */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-white text-sm font-medium">Carregando transmissão...</p>
        </div>
      )}

      {/* Mensagem de Erro */}
      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
          <div className="p-4 rounded-full bg-red-500/20 text-red-500 mb-4">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Erro de Reprodução</h3>
          <p className="text-slate-300 text-sm max-w-md mb-6">{errorMsg}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-500 transition-colors"
          >
            Fechar Player
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black/90 via-transparent to-black/70 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/40 hover:bg-white/20 text-white transition-colors"
              title="Fechar Player"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {'name' in item ? item.name : 'title' in item ? item.title : 'Conteúdo'}
              </h2>
              <span className="text-xs text-slate-300">
                {itemType === 'live'
                  ? 'TV ao Vivo'
                  : itemType === 'movie'
                  ? 'Filme'
                  : 'Série'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Drawer de Canais (somente TV ao Vivo) */}
            {itemType === 'live' && (
              <button
                onClick={() => setShowChannelDrawer(!showChannelDrawer)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  showChannelDrawer
                    ? 'bg-brand-600 text-white'
                    : 'bg-black/50 border border-white/10 text-slate-200 hover:bg-white/10'
                }`}
                title="Lista de Canais Lateral"
              >
                <ListVideo className="w-4 h-4" />
                <span>Lista de Canais</span>
              </button>
            )}

            {/* Favorito */}
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(item.id, itemType)}
                className={`p-2.5 rounded-full transition-colors ${
                  isFavorite
                    ? 'bg-brand-600 text-white'
                    : 'bg-black/40 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
                title="Favoritar"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Info */}
            <button
              onClick={() => setShowInfoOverlay(!showInfoOverlay)}
              className="p-2.5 rounded-full bg-black/40 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Informações do Programa"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Bar Controls */}
        <div className="flex flex-col gap-3">
          {/* Progress Seekbar (VOD / Filmes / Séries) */}
          {itemType !== 'live' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-300">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const targetTime = parseFloat(e.target.value);
                  setCurrentTime(targetTime);
                  if (videoRef.current) videoRef.current.currentTime = targetTime;
                }}
                className="flex-1 h-1.5 bg-white/20 hover:h-2 rounded-lg appearance-none cursor-pointer accent-brand-500 transition-all"
              />
              <span className="text-xs font-mono text-slate-300">{formatTime(duration)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Play/Pause & Volume */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg transition-transform transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-300 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            </div>

            {/* EPG Info no centro */}
            {itemType === 'live' && epgProgram && (
              <div className="hidden md:flex flex-col items-center max-w-sm text-center">
                <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
                  No ar agora
                </span>
                <p className="text-sm font-bold text-white truncate max-w-full">
                  {epgProgram.title}
                </p>
              </div>
            )}

            {/* PiP & Fullscreen */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePiP}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Tela Cheia"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Lateral de Canais (TV ao Vivo) */}
      {showChannelDrawer && itemType === 'live' && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-dark-card/95 backdrop-blur-xl border-l border-dark-border/80 z-50 flex flex-col animate-slideLeft">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-brand-500" />
              <span>Lista de Canais</span>
            </h3>
            <button
              onClick={() => setShowChannelDrawer(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {allChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  if (onSelectChannel) onSelectChannel(ch);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                  ch.id === item.id
                    ? 'bg-brand-600/90 text-white font-semibold'
                    : 'hover:bg-dark-cardHover text-slate-300'
                }`}
              >
                {ch.logo ? (
                  <img src={ch.logo} alt={ch.name} className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 rounded bg-dark-border flex items-center justify-center text-xs font-bold">
                    TV
                  </div>
                )}
                <span className="text-xs truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Overlay Modal */}
      {showInfoOverlay && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-dark-card border border-dark-border p-6 rounded-2xl max-w-lg w-full relative">
            <button
              onClick={() => setShowInfoOverlay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2">
              {'name' in item ? item.name : 'title' in item ? item.title : 'Detalhes'}
            </h3>
            {epgProgram ? (
              <div className="space-y-2 text-sm text-slate-300">
                <p className="font-semibold text-brand-400">Programa Atual: {epgProgram.title}</p>
                {epgProgram.desc && <p className="text-slate-400 text-xs">{epgProgram.desc}</p>}
                <p className="text-xs text-slate-500">
                  Horário: {new Date(epgProgram.start).toLocaleTimeString()} - {new Date(epgProgram.end).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {'synopsis' in item ? (item as any).synopsis : 'Nenhuma informação de guia disponível para esta transmissão.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

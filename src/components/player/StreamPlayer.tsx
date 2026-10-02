import React, { useEffect, useRef, useState } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { Channel, Movie, Episode, EPGProgram } from '../../types/iptv';
import { PlaybackManager } from '../../services/player/PlaybackManager';

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
  const [statusText, setStatusText] = useState<string>('Conectando...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [seekFeedback, setSeekFeedback] = useState<string | null>(null);

  // OSD temporário ao trocar de canal
  const [showChannelOsd, setShowChannelOsd] = useState<boolean>(false);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerChannelOsd = () => {
    setShowChannelOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowChannelOsd(false);
    }, 3800);
  };

  // Carregar Stream via PlaybackManager Central com Fallback em Cascata
  useEffect(() => {
    if (!item || !item.url || !videoRef.current) return;

    setLoading(true);
    setErrorMsg(null);
    setStatusText('Conectando ao stream...');
    triggerChannelOsd();

    const pm = PlaybackManager.getInstance();
    const unsubscribe = pm.subscribe((event) => {
      if (event.state === 'playing') {
        setLoading(false);
        setErrorMsg(null);
        setIsPlaying(true);
      } else if (
        event.state === 'loading' ||
        event.state === 'buffering' ||
        event.state === 'reconnecting'
      ) {
        setLoading(true);
        setStatusText(event.message || 'Carregando...');
      } else if (event.state === 'error') {
        setLoading(false);
        setErrorMsg(event.message || 'Canal ou vídeo temporariamente indisponível.');
      } else if (event.state === 'paused') {
        setIsPlaying(false);
      }
    });

    pm.loadStream(videoRef.current, item.url, {
      type: itemType,
      muted: false,
      bufferProfile: 'normal',
    });

    return () => {
      unsubscribe();
      pm.stopAndClean();
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (seekFeedbackTimerRef.current) clearTimeout(seekFeedbackTimerRef.current);
    };
  }, [item?.url, itemType]);

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
    const pm = PlaybackManager.getInstance();
    if (isPlaying) {
      pm.pause();
      setIsPlaying(false);
    } else {
      pm.play();
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
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
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
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
  };

  // Suporte Avançado a Controle Remoto de Smart TV / Android TV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation(); // Evita interferência de hooks externos na tela cheia

      handleUserActivity();

      const key = e.key;
      const code = e.keyCode;

      // 1. Troca de Canal Rápida (CIMA / BAIXO em TV ao Vivo)
      if (key === 'ArrowUp' || key === 'Up' || code === 38 || code === 19) {
        e.preventDefault();
        if (itemType === 'live' && allChannels.length > 0 && item) {
          const idx = allChannels.findIndex((c) => c.id === item.id);
          if (idx > 0 && onSelectChannel) {
            onSelectChannel(allChannels[idx - 1]);
            triggerChannelOsd();
          } else if (idx === 0 && onSelectChannel) {
            // Loop para o último canal
            onSelectChannel(allChannels[allChannels.length - 1]);
            triggerChannelOsd();
          }
        } else {
          // Volume + em VOD
          setVolume((v) => {
            const nv = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = nv;
            return nv;
          });
        }
        return;
      }

      if (key === 'ArrowDown' || key === 'Down' || code === 40 || code === 20) {
        e.preventDefault();
        if (itemType === 'live' && allChannels.length > 0 && item) {
          const idx = allChannels.findIndex((c) => c.id === item.id);
          if (idx >= 0 && idx < allChannels.length - 1 && onSelectChannel) {
            onSelectChannel(allChannels[idx + 1]);
            triggerChannelOsd();
          } else if (idx === allChannels.length - 1 && onSelectChannel) {
            // Loop para o primeiro canal
            onSelectChannel(allChannels[0]);
            triggerChannelOsd();
          }
        } else {
          // Volume - em VOD
          setVolume((v) => {
            const nv = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = nv;
            return nv;
          });
        }
        return;
      }

      // 2. Navegação Horizontal: Esquerda / Direita
      if (key === 'ArrowLeft' || key === 'Left' || code === 37 || code === 21) {
        e.preventDefault();
        if (itemType === 'live') {
          setShowChannelDrawer((prev) => !prev);
        } else {
          // Retroceder 10 segundos
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
            showSeekBadge('⏪ -10s');
          }
        }
        return;
      }

      if (key === 'ArrowRight' || key === 'Right' || code === 39 || code === 22) {
        e.preventDefault();
        if (itemType === 'live') {
          setShowChannelDrawer(true);
        } else {
          // Avançar 10 segundos
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.duration || 10000,
              videoRef.current.currentTime + 10
            );
            showSeekBadge('⏩ +10s');
          }
        }
        return;
      }

      // 3. Tecla OK / Enter / Select / Space
      if (
        key === 'Enter' ||
        key === 'Select' ||
        key === ' ' ||
        code === 13 ||
        code === 23 ||
        code === 66 ||
        code === 32 ||
        code === 85 // MEDIA_PLAY_PAUSE
      ) {
        e.preventDefault();
        if (itemType === 'live') {
          // Em TV ao Vivo: alterna exibição do banner OSD com informações do canal
          triggerChannelOsd();
        } else {
          // Em VOD: alterna Play/Pause
          togglePlay();
        }
        return;
      }

      // 4. Tecla VOLTAR (Back / GoBack / Escape)
      if (
        key === 'Escape' ||
        key === 'Back' ||
        key === 'GoBack' ||
        code === 27 ||
        code === 4
      ) {
        e.preventDefault();
        if (showChannelDrawer) {
          setShowChannelDrawer(false);
        } else if (showInfoOverlay) {
          setShowInfoOverlay(false);
        } else {
          onClose();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPlaying, item, itemType, allChannels, onSelectChannel, showChannelDrawer, showInfoOverlay, onClose]);

  const showSeekBadge = (text: string) => {
    setSeekFeedback(text);
    if (seekFeedbackTimerRef.current) clearTimeout(seekFeedbackTimerRef.current);
    seekFeedbackTimerRef.current = setTimeout(() => {
      setSeekFeedback(null);
    }, 1200);
  };

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

  const itemName = 'name' in item ? item.name : 'title' in item ? item.title : 'Canal';
  const itemLogo = 'logo' in item ? (item as any).logo : 'poster' in item ? (item as any).poster : undefined;
  const channelNum = 'number' in item ? (item as any).number : undefined;

  return (
    <div
      ref={containerRef}
      data-player-fullscreen="true"
      onMouseMove={handleUserActivity}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden select-none font-sans"
    >
      {/* Elemento de Vídeo HTML5 conectado ao PlaybackManager */}
      <video
        ref={videoRef}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Indicador de Busca / Seek (+10s, -10s) */}
      {seekFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-2xl bg-black/80 border border-cyan-500/50 text-cyan-300 text-lg font-black tracking-wider animate-scaleUp z-40">
          {seekFeedback}
        </div>
      )}

      {/* Spinner de Carregamento e Fallback Inteligente */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-30">
          <div className="w-14 h-14 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
          <p className="text-white text-base font-bold tracking-wide">{statusText}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">{itemName}</p>
        </div>
      )}

      {/* Mensagem de Erro com Ação de Retry */}
      {errorMsg && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30 p-6 text-center">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
            <Tv className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Transmissão Indisponível</h3>
          <p className="text-sm text-slate-300 max-w-md mb-6">{errorMsg}</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (videoRef.current && item.url) {
                  PlaybackManager.getInstance().loadStream(videoRef.current, item.url, {
                    type: itemType,
                    muted: false,
                  });
                }
              }}
              autoFocus
              className="px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:bg-cyan-400 focus:ring-4 focus:ring-cyan-400 focus:outline-none flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 focus:ring-4 focus:ring-slate-400 focus:outline-none cursor-pointer"
            >
              Voltar para Lista
            </button>
          </div>
        </div>
      )}

      {/* OSD RÁPIDO AO TROCAR DE CANAL (BANNER DE CANAL SMART TV) */}
      {itemType === 'live' && showChannelOsd && (
        <div className="absolute bottom-8 left-8 right-8 z-40 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-4">
            {channelNum && (
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {String(channelNum).padStart(3, '0')}
              </span>
            )}
            <div className="w-14 h-14 rounded-2xl bg-slate-900 p-2 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {itemLogo ? (
                <img src={itemLogo} alt={itemName} className="max-w-full max-h-full object-contain" />
              ) : (
                <Tv className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{itemName}</h2>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                  AO VIVO HD
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-300 mt-0.5">
                {epgProgram ? epgProgram.title : 'Transmissão ao Vivo'}
              </p>
              {epgProgram && (
                <p className="text-xs text-slate-400 font-mono">
                  {new Date(epgProgram.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(epgProgram.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline">Pressione <strong>▲ / ▼</strong> para trocar de canal</span>
          </div>
        </div>
      )}

      {/* BARRA DE CONTROLES FLUTUANTE (MOSTRADA AO MOVER O MOUSE OU ATIVAR) */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 flex flex-col justify-between p-6 transition-opacity duration-300 z-20 pointer-events-none ${
          showControls && !loading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-3 rounded-2xl bg-black/60 hover:bg-white/20 text-slate-200 transition-colors focus:ring-4 focus:ring-cyan-400 focus:outline-none cursor-pointer"
              title="Voltar"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{itemName}</span>
                {itemType === 'live' && (
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    AO VIVO
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {itemType === 'live' && (
              <button
                onClick={() => setShowChannelDrawer(!showChannelDrawer)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none cursor-pointer ${
                  showChannelDrawer
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-black/60 border border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <ListVideo className="w-4 h-4" />
                <span>Lista de Canais</span>
              </button>
            )}

            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(item.id, itemType)}
                className={`p-3 rounded-2xl transition-colors focus:ring-4 focus:ring-cyan-400 focus:outline-none cursor-pointer ${
                  isFavorite
                    ? 'bg-red-600 text-white'
                    : 'bg-black/60 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
                title="Favoritar"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setShowInfoOverlay(!showInfoOverlay)}
              className="p-3 rounded-2xl bg-black/60 hover:bg-white/20 text-slate-300 hover:text-white transition-colors focus:ring-4 focus:ring-cyan-400 focus:outline-none cursor-pointer"
              title="Informações"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Bar Controls */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Progress Seekbar (Filmes / Séries) */}
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
                className="flex-1 h-1.5 bg-white/20 hover:h-2 rounded-lg appearance-none cursor-pointer accent-cyan-400 transition-all focus:outline-none"
              />
              <span className="text-xs font-mono text-slate-300">{formatTime(duration)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Play/Pause & Volume */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xl shadow-cyan-500/20 transition-transform active:scale-95 focus:ring-4 focus:ring-cyan-400 focus:outline-none cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-300 hover:text-white transition-colors focus:outline-none"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* PiP & Fullscreen */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePiP}
                className="p-2.5 rounded-xl bg-black/50 text-slate-300 hover:text-white transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-black/50 text-slate-300 hover:text-white transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
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
        <div className="absolute top-0 right-0 bottom-0 w-88 bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 z-50 flex flex-col animate-slideLeft shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Lista de Canais</span>
            </h3>
            <button
              onClick={() => setShowChannelDrawer(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
            {allChannels.map((ch, idx) => (
              <button
                key={ch.id}
                tabIndex={0}
                autoFocus={ch.id === item.id}
                onClick={() => {
                  if (onSelectChannel) onSelectChannel(ch);
                  triggerChannelOsd();
                  setShowChannelDrawer(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none cursor-pointer ${
                  ch.id === item.id
                    ? 'bg-cyan-500/20 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'hover:bg-slate-900 border border-transparent text-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 p-1 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {ch.logo ? (
                    <img src={ch.logo} alt={ch.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Tv className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-white">{ch.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{String(idx + 1).padStart(3, '0')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Overlay Modal */}
      {showInfoOverlay && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-slate-950 border border-cyan-500/40 p-6 rounded-3xl max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setShowInfoOverlay(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              <span>{itemName}</span>
            </h3>
            {epgProgram ? (
              <div className="space-y-3 text-sm text-slate-300">
                <p className="font-bold text-cyan-300">No Ar: {epgProgram.title}</p>
                {epgProgram.desc && <p className="text-slate-400 text-xs leading-relaxed">{epgProgram.desc}</p>}
                <p className="text-xs text-slate-400 font-mono">
                  Horário: {new Date(epgProgram.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(epgProgram.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">
                {'synopsis' in item ? (item as any).synopsis : 'Transmissão IPTV de alta definição com comutação rápida.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

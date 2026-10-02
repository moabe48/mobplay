import Hls, { HlsConfig } from 'hls.js';
import { BufferProfile } from '../../types/iptv';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'reconnecting';

export interface PlaybackOptions {
  type?: 'live' | 'movie' | 'series';
  bufferProfile?: BufferProfile;
  autoPlay?: boolean;
  muted?: boolean;
  initialTime?: number;
}

export interface PlayerStatusEvent {
  state: PlayerState;
  message?: string;
  activeUrl?: string;
  error?: any;
}

type StatusCallback = (event: PlayerStatusEvent) => void;

/**
 * PlaybackManager - Gerenciador Central de Reprodução IPTV com Sistema de Fallback em Cascata
 * Otimizado com Ultra Baixa Latência e Aceleração por Hardware para Smart TV e Android TV.
 */
export class PlaybackManager {
  private static instance: PlaybackManager;
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentState: PlayerState = 'idle';
  private currentUrl: string | null = null;
  private candidateUrls: string[] = [];
  private candidateIndex: number = 0;
  private currentOptions: PlaybackOptions = {};
  private retryCount = 0;
  private maxRetries = 2;
  private timeoutTimer: any = null;
  private statusListeners: Set<StatusCallback> = new Set();
  private bufferProfile: BufferProfile = 'normal';
  private attemptedNativeForCurrentCandidate: boolean = false;
  private mediaErrorCount = 0;
  private videoEventListenerCleanups: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): PlaybackManager {
    if (!PlaybackManager.instance) {
      PlaybackManager.instance = new PlaybackManager();
    }
    return PlaybackManager.instance;
  }

  public subscribe(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback({ state: this.currentState, activeUrl: this.candidateUrls[this.candidateIndex] || this.currentUrl || undefined });
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notify(state: PlayerState, message?: string, error?: any) {
    this.currentState = state;
    const activeUrl = this.candidateUrls[this.candidateIndex] || this.currentUrl || undefined;
    this.statusListeners.forEach((cb) => cb({ state, message, activeUrl, error }));
  }

  public getState(): PlayerState {
    return this.currentState;
  }

  public getCurrentUrl(): string | null {
    return this.candidateUrls[this.candidateIndex] || this.currentUrl;
  }

  public setBufferProfile(profile: BufferProfile) {
    this.bufferProfile = profile;
  }

  /**
   * Gera variantes de URL para tentar reproduzir caso a URL original falhe.
   * Dá prioridade para o formato mais rápido e compatível.
   */
  private generateCandidates(url: string, type: 'live' | 'movie' | 'series'): string[] {
    const list: string[] = [];

    try {
      if (type === 'live') {
        if (url.includes('.m3u8')) {
          list.push(url);
          list.push(url.replace(/\.m3u8(\?.*)?$/i, '.ts$1'));
          list.push(url.replace(/\.m3u8(\?.*)?$/i, '$1'));
        } else if (url.includes('.ts')) {
          // Em servidores Xtream Codes, .m3u8 é o manifesto HLS que o Hls.js reproduz instantaneamente
          const m3u8Url = url.replace(/\.ts(\?.*)?$/i, '.m3u8$1');
          list.push(m3u8Url);
          list.push(url);
          list.push(url.replace(/\.ts(\?.*)?$/i, '$1'));
        } else {
          list.push(`${url}.m3u8`);
          list.push(`${url}.ts`);
          list.push(url);
        }
      } else {
        // Filmes e Séries (VOD)
        list.push(url);
        if (url.includes('.mkv')) {
          list.push(url.replace(/\.mkv(\?.*)?$/i, '.mp4$1'));
        } else if (url.includes('.avi')) {
          list.push(url.replace(/\.avi(\?.*)?$/i, '.mp4$1'));
        } else if (url.includes('.mp4')) {
          list.push(url.replace(/\.mp4(\?.*)?$/i, '.mkv$1'));
        }
      }
    } catch (e) {
      console.warn('Erro ao gerar candidatos:', e);
      list.push(url);
    }

    return Array.from(new Set(list.filter(Boolean)));
  }

  /**
   * Inicia o carregamento de uma transmissão ou vídeo
   */
  public loadStream(video: HTMLVideoElement, url: string, options: PlaybackOptions = {}) {
    if (!url) return;

    // Se já estiver tocando exatamente a mesma URL no mesmo elemento de vídeo, não reinicializar
    if (this.currentUrl === url && this.currentState === 'playing' && this.videoElement === video) {
      return;
    }

    this.stopAndClean();

    this.videoElement = video;
    this.currentOptions = options;
    const streamType = options.type || (url.includes('/live/') || url.includes('.m3u8') ? 'live' : 'movie');

    this.currentUrl = url;
    this.candidateUrls = this.generateCandidates(url, streamType);
    this.candidateIndex = 0;
    this.retryCount = 0;
    this.mediaErrorCount = 0;
    this.attemptedNativeForCurrentCandidate = false;

    this.startLoadingCurrentCandidate();
  }

  /**
   * Monitora eventos nativos do elemento de vídeo para resposta instantânea ao primeiro frame renderizado
   */
  private detachVideoEvents() {
    if (this.videoEventListenerCleanups.length > 0) {
      this.videoEventListenerCleanups.forEach((cleanup) => cleanup());
      this.videoEventListenerCleanups = [];
    }
  }

  private attachVideoEvents(video: HTMLVideoElement) {
    this.detachVideoEvents();

    const onPlaying = () => {
      this.clearTimeoutTimer();
      this.notify('playing');
    };

    const onTimeUpdate = () => {
      if (video.currentTime > 0 && this.currentState !== 'playing') {
        this.clearTimeoutTimer();
        this.notify('playing');
      }
    };

    const onWaiting = () => {
      if (this.currentState === 'playing') {
        this.notify('buffering', 'Carregando...');
      }
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('waiting', onWaiting);

    this.videoEventListenerCleanups.push(() => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('waiting', onWaiting);
    });
  }

  /**
   * Executa a tentativa de reprodução na URL candidata atual
   */
  private startLoadingCurrentCandidate() {
    if (!this.videoElement) return;
    const video = this.videoElement;
    const url = this.candidateUrls[this.candidateIndex];
    if (!url) {
      this.notify('error', 'Sinal ou arquivo de mídia indisponível no servidor IPTV.');
      return;
    }

    const isFirstAttempt = this.candidateIndex === 0;
    const msg = isFirstAttempt ? 'Conectando ao stream...' : `Tentando formato alternativo (${this.candidateIndex + 1}/${this.candidateUrls.length})...`;
    this.notify('loading', msg);

    this.startTimeoutDetector();

    const isM3U8 = url.includes('.m3u8');
    const isDirectMedia = url.includes('.ts') || url.includes('.mp4') || url.includes('.mkv') || url.includes('.avi');
    const isLive = this.currentOptions.type === 'live' || url.includes('/live/');
    const profile = this.currentOptions.bufferProfile || this.bufferProfile;

    // Se for formato de mídia direta (.ts, .mp4, .mkv, .avi), carrega direto via decodificador nativo
    if (isDirectMedia) {
      this.loadNative(url);
      return;
    }

    // Se for M3U8 ou Live e houver suporte a Hls.js
    if (Hls.isSupported() && (isM3U8 || isLive) && !this.attemptedNativeForCurrentCandidate) {
      this.cleanupHls();
      this.attachVideoEvents(video);

      const hlsConfig: Partial<HlsConfig> = {
        enableWorker: false, // Desabilitar worker para maior estabilidade em Android TV WebView
        enableSoftwareAES: true,
        lowLatencyMode: true,
        
        // Ultra Baixa Latência: inicia no primeiro fragmento ao invés de esperar 3 (início em < 2s)
        liveSyncDurationCount: isLive ? 1 : 2,
        liveMaxLatencyDurationCount: isLive ? 3 : 5,
        liveDurationInfinity: true,
        startFragPrefetch: true, // Pré-carrega o próximo pedaço em paralelo imediatamente
        progressive: true, // Decodifica e renderiza chunks enquanto ainda transfere

        // Otimização de Memória para Android TV
        backBufferLength: isLive ? 0 : 10,
        maxBufferLength: isLive ? 3 : (profile === 'low' ? 3 : 10),
        maxMaxBufferLength: isLive ? 6 : (profile === 'low' ? 6 : 20),
        maxBufferSize: 25 * 1024 * 1024,
        maxBufferHole: 0.5,

        // Timeouts rápidos para alternância imediata em caso de falha de rota
        manifestLoadingTimeOut: 5000,
        manifestLoadingMaxRetry: 2,
        fragLoadingTimeOut: 6000,
        fragLoadingMaxRetry: 2,
        levelLoadingTimeOut: 5000,
        levelLoadingMaxRetry: 2,

        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        startLevel: -1,
      };

      const hls = new Hls(hlsConfig);
      this.hls = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = !!this.currentOptions.muted;
        if (this.currentOptions.initialTime && this.currentOptions.initialTime > 0) {
          try {
            video.currentTime = this.currentOptions.initialTime;
          } catch (e) {}
        }
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        // Primeiro fragmento pronto na SourceBuffer: dispara o play de imediato
        if (video.paused) {
          video.play().catch(() => {});
        }
        if (video.currentTime > 0) {
          this.clearTimeoutTimer();
          this.notify('playing');
        }
      });

      hls.on(Hls.Events.BUFFER_STALLED, () => {
        if (this.currentState === 'playing') {
          this.notify('buffering', 'Carregando buffer...');
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[PlaybackManager] HLS Network Error, tentando nativo:', url);
              this.cleanupHls();
              this.loadNative(url);
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              this.mediaErrorCount++;
              if (this.mediaErrorCount === 1) {
                hls.recoverMediaError();
              } else if (this.mediaErrorCount === 2) {
                hls.swapAudioCodec();
                hls.recoverMediaError();
              } else {
                this.tryNextCandidate();
              }
              break;

            default:
              this.cleanupHls();
              this.loadNative(url);
              break;
          }
        }
      });
    } else {
      // Reprodução nativa direta no elemento <video>
      this.loadNative(url);
    }
  }

  /**
   * Reprodução direta via HTML5 Video element nativo (ignora restrições de CORS e usa decodificadores de hardware da TV)
   */
  private loadNative(url: string) {
    if (!this.videoElement) return;
    const video = this.videoElement;
    this.attemptedNativeForCurrentCandidate = true;

    this.attachVideoEvents(video);

    video.src = url;
    video.muted = !!this.currentOptions.muted;

    const onCanPlay = () => {
      this.clearTimeoutTimer();
      cleanupListeners();
      if (this.currentOptions.initialTime && this.currentOptions.initialTime > 0) {
        try {
          video.currentTime = this.currentOptions.initialTime;
        } catch (e) {}
      }
      video
        .play()
        .then(() => this.notify('playing'))
        .catch(() => this.notify('paused'));
    };

    const onError = () => {
      this.clearTimeoutTimer();
      cleanupListeners();
      console.warn('[PlaybackManager] Erro no player nativo com URL:', url);
      this.tryNextCandidate();
    };

    const cleanupListeners = () => {
      video.removeEventListener('loadeddata', onCanPlay);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };

    video.addEventListener('loadeddata', onCanPlay, { once: true });
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('error', onError, { once: true });

    video.load();
  }

  /**
   * Avança para a próxima URL candidata ou inicia retry rápido
   */
  private tryNextCandidate() {
    this.cleanupHls();
    this.attemptedNativeForCurrentCandidate = false;
    this.mediaErrorCount = 0;

    if (this.candidateIndex < this.candidateUrls.length - 1) {
      this.candidateIndex++;
      this.startLoadingCurrentCandidate();
    } else {
      // Todos os candidatos foram testados, tentar novamente com retry rápido
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.candidateIndex = 0;
        this.notify('reconnecting', `Reconectando canal (${this.retryCount}/${this.maxRetries})...`);
        setTimeout(() => {
          this.startLoadingCurrentCandidate();
        }, 1200 * this.retryCount);
      } else {
        this.stopAndClean();
        this.notify('error', 'Canal ou vídeo temporariamente indisponível no servidor.');
      }
    }
  }

  private startTimeoutDetector() {
    this.clearTimeoutTimer();
    const timeoutDuration = (this.currentOptions.type === 'live' || this.currentUrl?.includes('/live/')) ? 6000 : 10000;
    this.timeoutTimer = setTimeout(() => {
      if (this.currentState === 'loading' || this.currentState === 'buffering') {
        console.warn('[PlaybackManager] Timeout no stream atual, tentando alternativa...');
        this.tryNextCandidate();
      }
    }, timeoutDuration);
  }

  private clearTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  public play() {
    if (this.videoElement) {
      this.videoElement.play().then(() => this.notify('playing')).catch(() => {});
    }
  }

  public pause() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.notify('paused');
    }
  }

  private cleanupHls() {
    if (this.hls) {
      try {
        this.hls.stopLoad();
        this.hls.destroy();
      } catch (e) {}
      this.hls = null;
    }
  }

  public stopAndClean() {
    this.clearTimeoutTimer();
    this.cleanupHls();
    this.detachVideoEvents();

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.removeAttribute('src');
        this.videoElement.load();
      } catch (e) {}
    }

    this.currentUrl = null;
    this.candidateUrls = [];
    this.candidateIndex = 0;
    this.attemptedNativeForCurrentCandidate = false;
    this.mediaErrorCount = 0;
    this.notify('idle');
  }
}

import Hls from 'hls.js';
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
 * Especialmente otimizado para Android TV, Smart TV e TV Box.
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
  private maxRetries = 3;
  private timeoutTimer: any = null;
  private statusListeners: Set<StatusCallback> = new Set();
  private bufferProfile: BufferProfile = 'normal';
  private attemptedNativeForCurrentCandidate: boolean = false;
  private mediaErrorCount = 0;

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
   * Gera variantes de URL para tentar reproduzir caso a URL original falhe
   */
  private generateCandidates(url: string, type: 'live' | 'movie' | 'series'): string[] {
    const list: string[] = [url];

    try {
      if (type === 'live') {
        if (url.includes('.m3u8')) {
          list.push(url.replace(/\.m3u8(\?.*)?$/i, '.ts$1'));
          list.push(url.replace(/\.m3u8(\?.*)?$/i, '$1'));
        } else if (url.includes('.ts')) {
          list.push(url.replace(/\.ts(\?.*)?$/i, '.m3u8$1'));
          list.push(url.replace(/\.ts(\?.*)?$/i, '$1'));
        } else if (!url.includes('.m3u8') && !url.includes('.ts')) {
          list.push(`${url}.m3u8`);
          list.push(`${url}.ts`);
        }
      } else {
        // Filmes e Séries (VOD)
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
    }

    // Filtrar itens únicos
    return Array.from(new Set(list.filter(Boolean)));
  }

  /**
   * Inicia o carregamento de uma transmissão ou vídeo
   */
  public loadStream(video: HTMLVideoElement, url: string, options: PlaybackOptions = {}) {
    if (!url) return;

    this.videoElement = video;
    this.currentOptions = options;
    const streamType = options.type || (url.includes('/live/') || url.includes('.m3u8') ? 'live' : 'movie');

    // Se já estiver tocando exatamente a mesma URL, não reinicializar
    if (this.currentUrl === url && this.currentState === 'playing') {
      return;
    }

    this.stopAndClean();

    this.currentUrl = url;
    this.candidateUrls = this.generateCandidates(url, streamType);
    this.candidateIndex = 0;
    this.retryCount = 0;
    this.mediaErrorCount = 0;
    this.attemptedNativeForCurrentCandidate = false;

    this.startLoadingCurrentCandidate();
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

    const profile = this.currentOptions.bufferProfile || this.bufferProfile;
    let maxBufferLength = 6;
    let maxMaxBufferLength = 12;

    if (profile === 'low') {
      maxBufferLength = 3;
      maxMaxBufferLength = 6;
    } else if (profile === 'high') {
      maxBufferLength = 15;
      maxMaxBufferLength = 30;
    }

    const isM3U8 = url.includes('.m3u8');
    const isLive = this.currentOptions.type === 'live' || url.includes('/live/');

    // Priorizar HLS.js quando houver suporte e for HLS ou Live
    if (Hls.isSupported() && (isM3U8 || isLive) && !this.attemptedNativeForCurrentCandidate) {
      this.cleanupHls();

      const hls = new Hls({
        enableWorker: false, // Desabilitar worker para maior estabilidade em Android TV WebView
        enableSoftwareAES: true,
        lowLatencyMode: profile === 'low',
        maxBufferLength,
        maxMaxBufferLength,
        maxBufferSize: 30 * 1024 * 1024,
        maxBufferHole: 0.5,
        manifestLoadingTimeOut: 12000,
        manifestLoadingMaxRetry: 4,
        fragLoadingTimeOut: 12000,
        fragLoadingMaxRetry: 4,
        levelLoadingTimeOut: 12000,
        startLevel: -1,
      });

      this.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.clearTimeoutTimer();
        video.muted = !!this.currentOptions.muted;
        if (this.currentOptions.initialTime && this.currentOptions.initialTime > 0) {
          video.currentTime = this.currentOptions.initialTime;
        }
        video
          .play()
          .then(() => {
            this.notify('playing');
          })
          .catch(() => {
            this.notify('paused');
          });
      });

      hls.on(Hls.Events.BUFFER_STALLED, () => {
        this.notify('buffering', 'Carregando buffer...');
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Se falhar a rede no Hls.js (possível CORS ou TS direto), tentar reprodução nativa antes de descartar
              console.warn('[PlaybackManager] HLS Network Error, testando nativo:', url);
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
   * Avança para a próxima URL candidata ou inicia retry
   */
  private tryNextCandidate() {
    this.cleanupHls();
    this.attemptedNativeForCurrentCandidate = false;
    this.mediaErrorCount = 0;

    if (this.candidateIndex < this.candidateUrls.length - 1) {
      this.candidateIndex++;
      this.startLoadingCurrentCandidate();
    } else {
      // Todos os candidatos foram testados, tentar novamente o principal com retry
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.candidateIndex = 0;
        this.notify('reconnecting', `Reconectando canal (${this.retryCount}/${this.maxRetries})...`);
        setTimeout(() => {
          this.startLoadingCurrentCandidate();
        }, 1500 * this.retryCount);
      } else {
        this.stopAndClean();
        this.notify('error', 'Canal ou vídeo temporariamente indisponível no servidor.');
      }
    }
  }

  private startTimeoutDetector() {
    this.clearTimeoutTimer();
    this.timeoutTimer = setTimeout(() => {
      if (this.currentState === 'loading' || this.currentState === 'buffering') {
        console.warn('[PlaybackManager] Timeout no stream atual, tentando alternativa...');
        this.tryNextCandidate();
      }
    }, 12000);
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

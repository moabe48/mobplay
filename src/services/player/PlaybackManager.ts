import Hls from 'hls.js';
import { BufferProfile } from '../../types/iptv';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'reconnecting';

export interface PlaybackOptions {
  bufferProfile?: BufferProfile;
  autoPlay?: boolean;
  muted?: boolean;
}

export interface PlayerStatusEvent {
  state: PlayerState;
  message?: string;
}

type StatusCallback = (event: PlayerStatusEvent) => void;

/**
 * Gerenciador Central de Player HLS de Alta Performance para Smart TV & Android TV.
 * Evita vazamento de memória e reutiliza a instância do Hls.js com buffer inteligente.
 */
export class PlaybackManager {
  private static instance: PlaybackManager;
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentState: PlayerState = 'idle';
  private currentUrl: string | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private timeoutTimer: any = null;
  private statusListeners: Set<StatusCallback> = new Set();
  private bufferProfile: BufferProfile = 'normal';

  private constructor() {}

  public static getInstance(): PlaybackManager {
    if (!PlaybackManager.instance) {
      PlaybackManager.instance = new PlaybackManager();
    }
    return PlaybackManager.instance;
  }

  public subscribe(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback({ state: this.currentState });
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notify(state: PlayerState, message?: string) {
    this.currentState = state;
    this.statusListeners.forEach((cb) => cb({ state, message }));
  }

  public getState(): PlayerState {
    return this.currentState;
  }

  public getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  public setBufferProfile(profile: BufferProfile) {
    this.bufferProfile = profile;
  }

  /**
   * Associa o elemento HTMLVideoElement e carrega uma nova URL de stream IPTV
   */
  public loadStream(video: HTMLVideoElement, url: string, options: PlaybackOptions = {}) {
    if (!url) return;

    const profile = options.bufferProfile || this.bufferProfile;
    this.videoElement = video;

    // Se já estiver tocando exatamente a mesma URL, não reinicializar
    if (this.currentUrl === url && this.hls && this.currentState === 'playing') {
      return;
    }

    this.stopAndClean();

    this.currentUrl = url;
    this.retryCount = 0;
    this.notify('loading', 'Conectando ao canal...');

    // Iniciar Timeout para detectar streams offline
    this.startTimeoutDetector();

    // Configurar parâmetros de buffer com base no perfil selecionado
    let maxBufferLength = 6;
    let maxMaxBufferLength = 12;

    if (profile === 'low') {
      maxBufferLength = 3;
      maxMaxBufferLength = 6;
    } else if (profile === 'high') {
      maxBufferLength = 15;
      maxMaxBufferLength = 30;
    }

    if (Hls.isSupported() && (url.includes('.m3u8') || url.includes('http'))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: profile === 'low',
        maxBufferLength,
        maxMaxBufferLength,
        maxBufferSize: 30 * 1024 * 1024, // 30MB max de RAM
        maxBufferHole: 0.5,
        startLevel: -1,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 10000,
      });

      this.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.clearTimeoutTimer();
        video.muted = !!options.muted;
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
              this.handleRetry('Falha de rede. Reconectando...');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              this.stopAndClean();
              this.notify('error', 'Canal temporariamente indisponível.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.muted = !!options.muted;
      video.addEventListener('loadedmetadata', () => {
        this.clearTimeoutTimer();
        video
          .play()
          .then(() => this.notify('playing'))
          .catch(() => this.notify('paused'));
      });
    } else {
      video.src = url;
      video.muted = !!options.muted;
      video
        .play()
        .then(() => {
          this.clearTimeoutTimer();
          this.notify('playing');
        })
        .catch(() => {
          this.notify('error', 'Formato de vídeo não suportado.');
        });
    }
  }

  private handleRetry(message: string) {
    if (this.retryCount < this.maxRetries && this.currentUrl && this.videoElement) {
      this.retryCount++;
      this.notify('reconnecting', `Tentando novamente (${this.retryCount}/${this.maxRetries})...`);

      setTimeout(() => {
        if (this.currentUrl && this.videoElement) {
          this.loadStream(this.videoElement, this.currentUrl);
        }
      }, 1500 * this.retryCount);
    } else {
      this.stopAndClean();
      this.notify('error', 'Sinal offline ou indisponível no momento.');
    }
  }

  private startTimeoutDetector() {
    this.clearTimeoutTimer();
    this.timeoutTimer = setTimeout(() => {
      if (this.currentState === 'loading' || this.currentState === 'buffering') {
        this.handleRetry('Tempo limite excedido. Reconectando...');
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

  public stopAndClean() {
    this.clearTimeoutTimer();
    if (this.hls) {
      try {
        this.hls.stopLoad();
        this.hls.destroy();
      } catch (e) {}
      this.hls = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.removeAttribute('src');
        this.videoElement.load();
      } catch (e) {}
    }

    this.currentUrl = null;
    this.notify('idle');
  }
}

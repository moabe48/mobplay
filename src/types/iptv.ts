export type SourceType = 'xtream' | 'm3u_url' | 'm3u_file' | 'demo';

export interface IPTVAccount {
  id?: string;
  name: string;
  type: SourceType;
  serverUrl?: string;
  username?: string;
  password?: string;
  m3uUrl?: string;
  m3uFilePath?: string;
  epgUrl?: string;
  status: 'connected' | 'error' | 'syncing' | 'disconnected';
  expirationDate?: string;
  lastUpdated?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'live' | 'movie' | 'series';
}

export interface Channel {
  id: string;
  streamId: string | number;
  name: string;
  logo?: string;
  categoryId: string;
  categoryName: string;
  url: string;
  epgId?: string;
  isFavorite?: boolean;
}

export interface Movie {
  id: string;
  streamId: string | number;
  name: string;
  poster?: string;
  backdrop?: string;
  categoryId: string;
  categoryName: string;
  rating?: string;
  year?: string;
  genre?: string;
  duration?: string;
  synopsis?: string;
  cast?: string;
  containerExtension?: string;
  url: string;
  isFavorite?: boolean;
}

export interface Series {
  id: string;
  seriesId: string | number;
  name: string;
  poster?: string;
  backdrop?: string;
  categoryId: string;
  categoryName: string;
  rating?: string;
  year?: string;
  genre?: string;
  synopsis?: string;
  isFavorite?: boolean;
}

export interface Episode {
  id: string;
  episodeId: string | number;
  seriesId: string | number;
  seasonNum: number;
  episodeNum: number;
  title: string;
  containerExtension?: string;
  duration?: string;
  overview?: string;
  cover?: string;
  url: string;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  desc?: string;
  start: string; // ISO string
  end: string;   // ISO string
  category?: string;
}

export interface WatchHistoryItem {
  id: string;
  contentId: string;
  contentType: 'live' | 'movie' | 'series';
  title: string;
  poster?: string;
  categoryName?: string;
  progressPercentage: number;
  durationSec: number;
  currentPosSec: number;
  seasonNum?: number;
  episodeNum?: number;
  episodeTitle?: string;
  updatedAt: string;
}

export interface AppSettings {
  accentColor: string;
  cardSize: 'small' | 'medium' | 'large';
  enableAnimations: boolean;
  autoPlayNext: boolean;
  rememberPosition: boolean;
  bufferLength: number; // segundos
  epgAutoRefresh: boolean;
  epgRefreshInterval: number; // horas
  startWithWindows: boolean;
  minimizeToTray: boolean;
}

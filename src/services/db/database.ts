import Dexie, { Table } from 'dexie';
import {
  IPTVAccount,
  Category,
  Channel,
  Movie,
  Series,
  Episode,
  EPGProgram,
  WatchHistoryItem,
  AppSettings,
} from '../../types/iptv';

export class MobPlayDatabase extends Dexie {
  accounts!: Table<IPTVAccount, string>;
  categories!: Table<Category, string>;
  channels!: Table<Channel, string>;
  movies!: Table<Movie, string>;
  series!: Table<Series, string>;
  episodes!: Table<Episode, string>;
  epg!: Table<EPGProgram, string>;
  favorites!: Table<{ id: string; contentId: string; type: 'live' | 'movie' | 'series'; addedAt: string }, string>;
  history!: Table<WatchHistoryItem, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('MobPlayDB');
    this.version(1).stores({
      accounts: '++id, name, type',
      categories: 'id, type, name',
      channels: 'id, streamId, categoryId, name, isFavorite',
      movies: 'id, streamId, categoryId, name, year, isFavorite',
      series: 'id, seriesId, categoryId, name, isFavorite',
      episodes: 'id, seriesId, seasonNum, episodeNum',
      epg: 'id, channelId, start, end',
      favorites: 'id, contentId, type',
      history: 'id, contentId, contentType, updatedAt',
      settings: 'key',
    });
  }
}

export const db = new MobPlayDatabase();

export async function clearAllCache() {
  await db.categories.clear();
  await db.channels.clear();
  await db.movies.clear();
  await db.series.clear();
  await db.episodes.clear();
  await db.epg.clear();
}

export async function chunkedBulkPut<T>(table: Table<T, any>, items: T[], chunkSize = 500) {
  if (!items || items.length === 0) return;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    try {
      await table.bulkPut(chunk);
    } catch (err) {
      console.warn(`Aviso: falha ao inserir lote de ${chunk.length} itens na tabela:`, err);
    }
  }
}

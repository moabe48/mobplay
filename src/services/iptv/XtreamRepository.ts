import {
  Channel,
  Movie,
  Series,
  Episode,
  Category,
  EPGProgram,
  IPTVAccount,
} from '../../types/iptv';
import { db, chunkedBulkPut } from '../db/database';

export class XtreamRepository {
  private baseUrl: string;
  private user: string;
  private pass: string;
  private accountId: string;

  constructor(account: IPTVAccount) {
    let cleanUrl = (account.serverUrl || '').trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');
    this.baseUrl = cleanUrl;
    this.user = account.username || '';
    this.pass = account.password || '';
    this.accountId = account.id || 'default';
  }

  private getApiUrl(action?: string, extraParams: string = ''): string {
    let url = `${this.baseUrl}/player_api.php?username=${encodeURIComponent(this.user)}&password=${encodeURIComponent(this.pass)}`;
    if (action) url += `&action=${action}`;
    if (extraParams) url += `&${extraParams}`;
    return url;
  }

  /**
   * 1. Autenticação Rápida (Validar Usuário e Servidor sem travar o app)
   */
  public async authenticate(): Promise<{ status: string; expDate?: string }> {
    const res = await fetch(this.getApiUrl());
    if (!res.ok) throw new Error(`Falha de conexão com o servidor Xtream (HTTP ${res.status})`);

    const data = await res.json();
    if (!data.user_info || data.user_info.auth === 0) {
      throw new Error('Usuário ou senha incorretos no Xtream Codes.');
    }
    if (data.user_info.status === 'Expired') {
      throw new Error('Sua conta IPTV expirou no servidor fornecedor.');
    }
    if (data.user_info.status && data.user_info.status.toLowerCase() !== 'active') {
      throw new Error(`Sua conta IPTV está com o status: ${data.user_info.status}`);
    }

    return {
      status: data.user_info.status,
      expDate: data.user_info.exp_date,
    };
  }

  /**
   * 2. Carregar Categorias Essenciais
   */
  public async getCategories(): Promise<Category[]> {
    try {
      const [liveRes, vodRes, seriesRes] = await Promise.all([
        fetch(this.getApiUrl('get_live_categories')).then((r) => r.json()).catch(() => []),
        fetch(this.getApiUrl('get_vod_categories')).then((r) => r.json()).catch(() => []),
        fetch(this.getApiUrl('get_series_categories')).then((r) => r.json()).catch(() => []),
      ]);

      const categories: Category[] = [];

      if (Array.isArray(liveRes)) {
        liveRes.forEach((c: any) =>
          categories.push({ id: `live_cat_${c.category_id}`, name: c.category_name, type: 'live', accountId: this.accountId })
        );
      }
      if (Array.isArray(vodRes)) {
        vodRes.forEach((c: any) =>
          categories.push({ id: `vod_cat_${c.category_id}`, name: c.category_name, type: 'movie', accountId: this.accountId })
        );
      }
      if (Array.isArray(seriesRes)) {
        seriesRes.forEach((c: any) =>
          categories.push({ id: `series_cat_${c.category_id}`, name: c.category_name, type: 'series', accountId: this.accountId })
        );
      }

      return categories;
    } catch (e) {
      return [];
    }
  }

  /**
   * 3. Carregar Canais ao Vivo
   */
  public async getLiveStreams(): Promise<Channel[]> {
    const res = await fetch(this.getApiUrl('get_live_streams'));
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any, index: number) => ({
      id: `live_${item.stream_id}`,
      streamId: item.stream_id,
      number: item.num || index + 1,
      name: item.name,
      logo: item.stream_icon,
      categoryId: `live_cat_${item.category_id}`,
      categoryName: item.category_name || 'Geral',
      url: `${this.baseUrl}/live/${this.user}/${this.pass}/${item.stream_id}.m3u8`,
      epgId: item.epg_channel_id,
      sourceType: 'xtream',
      accountId: this.accountId,
    }));
  }

  /**
   * 4. Carregar Filmes (VOD)
   */
  public async getVodStreams(): Promise<Movie[]> {
    const res = await fetch(this.getApiUrl('get_vod_streams'));
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const ext = item.container_extension || 'mp4';
      return {
        id: `vod_${item.stream_id}`,
        streamId: item.stream_id,
        name: item.name,
        poster: item.stream_icon,
        categoryId: `vod_cat_${item.category_id}`,
        categoryName: item.category_name || 'Filmes',
        rating: item.rating ? `${item.rating}/10` : '7.5/10',
        year: item.year || '2024',
        containerExtension: ext,
        url: `${this.baseUrl}/movie/${this.user}/${this.pass}/${item.stream_id}.${ext}`,
        sourceType: 'xtream',
        accountId: this.accountId,
      };
    });
  }

  /**
   * 5. Carregar Séries (VOD)
   */
  public async getSeriesStreams(): Promise<Series[]> {
    const res = await fetch(this.getApiUrl('get_series'));
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: `series_${item.series_id}`,
      seriesId: item.series_id,
      name: item.name,
      poster: item.cover,
      categoryId: `series_cat_${item.category_id}`,
      categoryName: item.category_name || 'Séries',
      rating: item.rating ? `${item.rating}/10` : '8.0/10',
      year: item.releaseDate ? item.releaseDate.substring(0, 4) : '2024',
      synopsis: item.plot || 'Nenhuma sinopse disponível.',
      sourceType: 'xtream',
      accountId: this.accountId,
    }));
  }

  /**
   * 6. Carregar Episódios de uma Série
   */
  public async getSeriesInfo(seriesId: string | number): Promise<Episode[]> {
    const res = await fetch(this.getApiUrl('get_series_info', `series_id=${seriesId}`));
    const data = await res.json();
    const episodes: Episode[] = [];

    if (data.episodes) {
      Object.keys(data.episodes).forEach((seasonNum) => {
        const seasonEpList = data.episodes[seasonNum];
        seasonEpList.forEach((ep: any) => {
          const ext = ep.container_extension || 'mp4';
          episodes.push({
            id: `ep_${ep.id}`,
            episodeId: ep.id,
            seriesId: seriesId,
            seasonNum: parseInt(seasonNum, 10),
            episodeNum: parseInt(ep.episode_num || '1', 10),
            title: ep.title || `Episódio ${ep.episode_num}`,
            containerExtension: ext,
            duration: ep.info?.duration || '45m',
            overview: ep.info?.plot || 'Nenhuma descrição para este episódio.',
            cover: ep.info?.movie_image || ep.info?.cover,
            url: `${this.baseUrl}/series/${this.user}/${this.pass}/${ep.id}.${ext}`,
          });
        });
      });
    }

    return episodes;
  }

  /**
   * 7. Carregar EPG do Servidor (Curto)
   */
  public async getShortEpg(streamId: string | number): Promise<EPGProgram[]> {
    try {
      const res = await fetch(this.getApiUrl('get_short_epg', `stream_id=${streamId}`));
      const data = await res.json();
      if (!data.epg_listings || !Array.isArray(data.epg_listings)) return [];

      return data.epg_listings.map((item: any, idx: number) => ({
        id: `epg_short_${streamId}_${idx}`,
        channelId: `live_${streamId}`,
        title: atob(item.title || '') || item.title || 'Programa ao Vivo',
        desc: atob(item.description || '') || item.description || '',
        start: new Date(item.start).toISOString(),
        end: new Date(item.end).toISOString(),
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Sincronização Progressiva em Background (Salva no Cache Local por Lotes)
   */
  public async syncAllBackground(
    onProgress?: (msg: string, percent: number) => void
  ): Promise<void> {
    if (onProgress) onProgress('Importando categorias...', 15);
    const categories = await this.getCategories();
    await chunkedBulkPut(db.categories, categories, 500);

    if (onProgress) onProgress('Baixando canais ao vivo...', 40);
    const channels = await this.getLiveStreams();
    await chunkedBulkPut(db.channels, channels, 500);

    if (onProgress) onProgress('Baixando filmes (VOD)...', 70);
    const movies = await this.getVodStreams();
    await chunkedBulkPut(db.movies, movies, 500);

    if (onProgress) onProgress('Baixando catálogo de séries...', 90);
    const series = await this.getSeriesStreams();
    await chunkedBulkPut(db.series, series, 500);

    if (onProgress) onProgress('Sincronização concluída com sucesso!', 100);
  }
}

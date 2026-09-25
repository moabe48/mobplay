import { Channel, Movie, Series, Episode, Category, EPGProgram } from '../../types/iptv';

export interface XtreamUserInfo {
  username: string;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  max_connections: string;
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
}

export interface XtreamAuthResponse {
  user_info: XtreamUserInfo;
  server_info: XtreamServerInfo;
}

export class XtreamClient {
  private baseUrl: string;
  private user: string;
  private pass: string;

  constructor(serverUrl: string, username: string, password: string) {
    let cleanUrl = serverUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '');
    this.baseUrl = cleanUrl;
    this.user = username;
    this.pass = password;
  }

  private getApiUrl(action?: string, extraParams: string = ''): string {
    let url = `${this.baseUrl}/player_api.php?username=${encodeURIComponent(this.user)}&password=${encodeURIComponent(this.pass)}`;
    if (action) {
      url += `&action=${action}`;
    }
    if (extraParams) {
      url += `&${extraParams}`;
    }
    return url;
  }

  async authenticate(): Promise<XtreamAuthResponse> {
    const res = await fetch(this.getApiUrl());
    if (!res.ok) {
      throw new Error(`Falha de conexão com o servidor Xtream (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (!data.user_info || data.user_info.auth === 0) {
      throw new Error('Usuário ou senha incorretos no Xtream Codes.');
    }
    if (data.user_info.status === 'Expired') {
      throw new Error('Sua conta ou teste IPTV expirou no servidor fornecedor. Por favor, insira novos dados de acesso.');
    }
    if (data.user_info.status && data.user_info.status.toLowerCase() !== 'active') {
      throw new Error(`Sua conta IPTV está com o status: ${data.user_info.status}. Verifique com seu fornecedor.`);
    }
    return data;
  }

  async getLiveCategories(): Promise<Category[]> {
    try {
      const res = await fetch(this.getApiUrl('get_live_categories'));
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: `live_cat_${item.category_id}`,
        name: item.category_name,
        type: 'live',
      }));
    } catch (e) {
      console.warn('Erro ao carregar categorias ao vivo:', e);
      return [];
    }
  }

  async getVodCategories(): Promise<Category[]> {
    try {
      const res = await fetch(this.getApiUrl('get_vod_categories'));
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: `vod_cat_${item.category_id}`,
        name: item.category_name,
        type: 'movie',
      }));
    } catch (e) {
      console.warn('Erro ao carregar categorias VOD:', e);
      return [];
    }
  }

  async getSeriesCategories(): Promise<Category[]> {
    try {
      const res = await fetch(this.getApiUrl('get_series_categories'));
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: `series_cat_${item.category_id}`,
        name: item.category_name,
        type: 'series',
      }));
    } catch (e) {
      console.warn('Erro ao carregar categorias de séries:', e);
      return [];
    }
  }

  async getLiveStreams(): Promise<Channel[]> {
    try {
      const res = await fetch(this.getApiUrl('get_live_streams'));
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: `live_${item.stream_id}`,
        streamId: item.stream_id,
        name: item.name,
        logo: item.stream_icon,
        categoryId: `live_cat_${item.category_id}`,
        categoryName: item.category_name || 'Geral',
        url: `${this.baseUrl}/live/${this.user}/${this.pass}/${item.stream_id}.m3u8`,
        epgId: item.epg_channel_id,
      }));
    } catch (e) {
      console.warn('Erro ao carregar canais ao vivo:', e);
      return [];
    }
  }

  async getVodStreams(): Promise<Movie[]> {
    try {
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
          year: item.year || '2023',
          containerExtension: ext,
          url: `${this.baseUrl}/movie/${this.user}/${this.pass}/${item.stream_id}.${ext}`,
        };
      });
    } catch (e) {
      console.warn('Erro ao carregar filmes VOD:', e);
      return [];
    }
  }

  async getSeriesStreams(): Promise<Series[]> {
    try {
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
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : '2023',
        synopsis: item.plot || 'Nenhuma sinopse disponível.',
      }));
    } catch (e) {
      console.warn('Erro ao carregar séries:', e);
      return [];
    }
  }

  async getSeriesInfo(seriesId: string | number): Promise<Episode[]> {
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
}

// Dados MOCK de Alta Qualidade para modo Demonstração
export function getDemoData() {
  const categories: Category[] = [
    { id: 'cat_esportes', name: 'Esportes HD', type: 'live' },
    { id: 'cat_noticias', name: 'Notícias 24h', type: 'live' },
    { id: 'cat_entretenimento', name: 'Entretenimento & Variedades', type: 'live' },
    { id: 'cat_filmes_tv', name: 'Canais de Filmes', type: 'live' },
    { id: 'cat_acao', name: 'Ação e Aventura', type: 'movie' },
    { id: 'cat_scifi', name: 'Ficção Científica', type: 'movie' },
    { id: 'cat_series_drama', name: 'Séries de Drama', type: 'series' },
  ];

  const demoStreams = [
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e88-88ed-0539f50e602e.m3u8',
  ];

  const channels: Channel[] = [
    {
      id: 'demo_live_1',
      streamId: '101',
      name: 'Sports HD 1 - Premier League',
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop',
      categoryId: 'cat_esportes',
      categoryName: 'Esportes HD',
      url: demoStreams[0],
      epgId: 'ch_sports1',
    },
    {
      id: 'demo_live_2',
      streamId: '102',
      name: 'Global News 24/7',
      logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&auto=format&fit=crop',
      categoryId: 'cat_noticias',
      categoryName: 'Notícias 24h',
      url: demoStreams[1],
      epgId: 'ch_news',
    },
    {
      id: 'demo_live_3',
      streamId: '103',
      name: 'Cinema World Ultra 4K',
      logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&auto=format&fit=crop',
      categoryId: 'cat_filmes_tv',
      categoryName: 'Canais de Filmes',
      url: demoStreams[2],
      epgId: 'ch_cinema',
    },
    {
      id: 'demo_live_4',
      streamId: '104',
      name: 'Discovery World & Nature',
      logo: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=150&auto=format&fit=crop',
      categoryId: 'cat_entretenimento',
      categoryName: 'Entretenimento & Variedades',
      url: demoStreams[3],
      epgId: 'ch_discovery',
    },
  ];

  const movies: Movie[] = [
    {
      id: 'demo_mov_1',
      streamId: '201',
      name: 'Tears of Steel: A Rebelião',
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop',
      categoryId: 'cat_scifi',
      categoryName: 'Ficção Científica',
      rating: '8.8/10',
      year: '2024',
      genre: 'Ficção Científica / Ação',
      duration: '1h 54m',
      synopsis: 'Num futuro distópico no centro de Amsterdã, um grupo de guerreiros e cientistas luta contra robôs autônomos para salvar o destino da humanidade.',
      cast: 'David Michael, Thom Abs, Sergio Hass',
      url: demoStreams[1],
    },
    {
      id: 'demo_mov_2',
      streamId: '202',
      name: 'Big Buck Bunny: A Jornada',
      poster: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&auto=format&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop',
      categoryId: 'cat_acao',
      categoryName: 'Ação e Aventura',
      rating: '9.2/10',
      year: '2024',
      genre: 'Animação / Aventura',
      duration: '1h 38m',
      synopsis: 'Um coelho gigante e carismático decide proteger seus amigos da floresta contra três valentões travessos.',
      cast: 'Bunny, Frank, Rinky, Gamera',
      url: demoStreams[0],
    },
    {
      id: 'demo_mov_3',
      streamId: '203',
      name: 'Sintel: O Reencontro da Dragão',
      poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop',
      categoryId: 'cat_scifi',
      categoryName: 'Ficção Científica',
      rating: '9.0/10',
      year: '2023',
      genre: 'Fantasia / Épico',
      duration: '2h 10m',
      synopsis: 'A jovem guerreira Sintel viaja pelas terras geladas do norte em busca de seu pequeno dragão roubado.',
      cast: 'Halina Reijn, Thom Hoffman',
      url: demoStreams[2],
    },
  ];

  const series: Series[] = [
    {
      id: 'demo_ser_1',
      seriesId: '301',
      name: 'Cyberpunk Chronicles',
      poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop',
      backdrop: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop',
      categoryId: 'cat_series_drama',
      categoryName: 'Séries de Drama',
      rating: '9.4/10',
      year: '2024',
      genre: 'Cyberpunk / Thriller',
      synopsis: 'Um detetive cibernético investiga conspirações corporativas no ano de 2088.',
    },
  ];

  const episodes: Episode[] = [
    {
      id: 'demo_ep_101',
      episodeId: '1001',
      seriesId: '301',
      seasonNum: 1,
      episodeNum: 1,
      title: 'Piloto: A Conexão Perdida',
      duration: '48m',
      overview: 'Uma pista criptografada conduz o agente Alex ao submundo da inteligência artificial.',
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop',
      url: demoStreams[0],
    },
    {
      id: 'demo_ep_102',
      episodeId: '1002',
      seriesId: '301',
      seasonNum: 1,
      episodeNum: 2,
      title: 'Sinais de Néon',
      duration: '52m',
      overview: 'Perseguido pelas ruas chuvosas da metrópole, Alex busca refúgio no mercado negro.',
      cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop',
      url: demoStreams[1],
    },
  ];

  const now = new Date();
  const getISO = (minsOffset: number) => new Date(now.getTime() + minsOffset * 60000).toISOString();

  const epgPrograms: EPGProgram[] = [
    {
      id: 'epg_1',
      channelId: 'demo_live_1',
      title: 'Premier League: Arsenal vs Manchester City',
      desc: 'Transmissão ao vivo e em alta definição do grande clássico do futebol mundial.',
      start: getISO(-45),
      end: getISO(75),
      category: 'Esportes',
    },
    {
      id: 'epg_2',
      channelId: 'demo_live_1',
      title: 'Debate Esportivo Pós-Jogo',
      desc: 'Análise completa com os melhores momentos e estatísticas da partida.',
      start: getISO(75),
      end: getISO(135),
      category: 'Esportes',
    },
    {
      id: 'epg_3',
      channelId: 'demo_live_2',
      title: 'Jornal do Mundo - Edição da Noite',
      desc: 'As notícias mais importantes da política, economia e tecnologia.',
      start: getISO(-30),
      end: getISO(30),
      category: 'Notícias',
    },
    {
      id: 'epg_4',
      channelId: 'demo_live_2',
      title: 'Documentário: Fronteiras do Espaço',
      desc: 'Conheça os mais recentes avanços nas missões para Marte e a exploração lunar.',
      start: getISO(30),
      end: getISO(90),
      category: 'Documentários',
    },
    {
      id: 'epg_5',
      channelId: 'demo_live_3',
      title: 'Sessão de Gala: Interestelar (4K)',
      desc: 'Um grupo de exploradores viaja através de um buraco de minhoca no espaço.',
      start: getISO(-60),
      end: getISO(90),
      category: 'Filmes',
    },
    {
      id: 'epg_6',
      channelId: 'demo_live_4',
      title: 'Planeta Terra III: Os Oceanos Profundos',
      desc: 'Imagens impressionantes das profundezas dos oceanos e criaturas raras.',
      start: getISO(-15),
      end: getISO(45),
      category: 'Natureza',
    },
  ];

  return {
    categories,
    channels,
    movies,
    series,
    episodes,
    epgPrograms,
  };
}

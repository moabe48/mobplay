import { Channel, Movie, Series, Category } from '../../types/iptv';

export interface M3UParseResult {
  categories: Category[];
  channels: Channel[];
  movies: Movie[];
  series: Series[];
}

export function parseM3UContent(content: string): M3UParseResult {
  const lines = content.split(/\r?\n/);
  const categoriesMap = new Map<string, Category>();
  const channels: Channel[] = [];
  const movies: Movie[] = [];
  const series: Series[] = [];

  let currentExtInf: {
    name: string;
    logo?: string;
    epgId?: string;
    groupTitle?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/i);

      // Extrai nome após a última vírgula
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Sem Nome';

      currentExtInf = {
        name,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        epgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
        groupTitle: groupTitleMatch ? groupTitleMatch[1] : 'Geral',
      };
    } else if (line.length > 0 && !line.startsWith('#') && currentExtInf) {
      const url = line;
      const groupName = currentExtInf.groupTitle || 'Geral';
      const categoryId = `cat_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          id: categoryId,
          name: groupName,
          type: groupName.toLowerCase().includes('filme') || groupName.toLowerCase().includes('vod')
            ? 'movie'
            : groupName.toLowerCase().includes('serie')
            ? 'series'
            : 'live',
        });
      }

      const itemType = categoriesMap.get(categoryId)?.type || 'live';
      const itemId = `m3u_${channels.length + movies.length + series.length + 1}`;

      if (itemType === 'movie') {
        movies.push({
          id: itemId,
          streamId: itemId,
          name: currentExtInf.name,
          poster: currentExtInf.logo,
          categoryId,
          categoryName: groupName,
          url,
        });
      } else if (itemType === 'series') {
        series.push({
          id: itemId,
          seriesId: itemId,
          name: currentExtInf.name,
          poster: currentExtInf.logo,
          categoryId,
          categoryName: groupName,
        });
      } else {
        channels.push({
          id: itemId,
          streamId: itemId,
          name: currentExtInf.name,
          logo: currentExtInf.logo,
          categoryId,
          categoryName: groupName,
          epgId: currentExtInf.epgId,
          url,
        });
      }

      currentExtInf = null;
    }
  }

  return {
    categories: Array.from(categoriesMap.values()),
    channels,
    movies,
    series,
  };
}

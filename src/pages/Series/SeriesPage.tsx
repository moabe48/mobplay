import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Clapperboard, Search } from 'lucide-react';
import { Series, Category } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';

interface SeriesPageProps {
  seriesList: Series[];
  categories: Category[];
  favoritesMap: Record<string, boolean>;
  onPlaySeries: (series: Series) => void;
  onSelectSeries: (series: Series) => void;
  onToggleFavorite: (id: string, type: 'series') => void;
}

export const SeriesPage: React.FC<SeriesPageProps> = ({
  seriesList = [],
  categories = [],
  favoritesMap = {},
  onPlaySeries,
  onSelectSeries,
  onToggleFavorite,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(60);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const seriesCategories = useMemo(
    () => (categories || []).filter((c) => c.type === 'series' || !c.type),
    [categories]
  );

  const filteredSeries = useMemo(() => {
    let result = seriesList;
    if (selectedCategoryId === 'favorites') {
      result = result.filter((s) => favoritesMap[s.id]);
    } else if (selectedCategoryId !== 'all') {
      result = result.filter((s) => s.categoryId === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    return result;
  }, [seriesList, selectedCategoryId, favoritesMap, searchQuery]);

  // Resetar limite de itens visíveis ao trocar de categoria ou filtro
  useEffect(() => {
    setVisibleLimit(60);
  }, [selectedCategoryId, searchQuery]);

  // Carregar mais itens ao rolar a tela
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 400) {
      if (visibleLimit < filteredSeries.length) {
        setVisibleLimit((prev) => Math.min(prev + 60, filteredSeries.length));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 text-slate-100 font-sans pb-20 md:pb-0">
      {/* Categories Sidebar */}
      <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-purple-400" />
            <span>Séries VOD</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar série..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          <button
            tabIndex={0}
            onClick={() => setSelectedCategoryId('all')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              selectedCategoryId === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span>Todas as Séries</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300">
              {seriesList.length}
            </span>
          </button>

          {seriesCategories.map((cat) => (
            <button
              key={cat.id}
              tabIndex={0}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold truncate transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                selectedCategoryId === cat.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Series Grid */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <p className="text-xs text-slate-400 font-medium">
            Exibindo <span className="text-purple-400 font-bold">{Math.min(visibleLimit, filteredSeries.length)}</span> de{' '}
            <span className="text-white font-bold">{filteredSeries.length}</span> séries
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSeries.slice(0, visibleLimit).map((ser) => (
            <MediaCard
              key={ser.id}
              item={ser}
              type="series"
              onPlay={() => onPlaySeries(ser)}
              onSelect={() => onSelectSeries(ser)}
              onToggleFavorite={onToggleFavorite}
              isFavorite={!!favoritesMap[ser.id]}
            />
          ))}
        </div>

        {visibleLimit < filteredSeries.length && (
          <div className="flex justify-center pt-4">
            <button
              tabIndex={0}
              onClick={() => setVisibleLimit((prev) => Math.min(prev + 60, filteredSeries.length))}
              className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 hover:bg-slate-800 focus:ring-4 focus:ring-cyan-400 focus:outline-none"
            >
              Carregar Mais Séries...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { Clapperboard, Play, Plus, Check, Star, ChevronRight } from 'lucide-react';
import { Series, Category } from '../../types/iptv';
import { MediaCard } from '../../components/cards/MediaCard';

interface SeriesPageProps {
  seriesList: Series[];
  categories: Category[];
  favoritesMap: Record<string, boolean>;
  onOpenDetails: (series: Series) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
}

export const SeriesPage: React.FC<SeriesPageProps> = ({
  seriesList,
  categories,
  favoritesMap,
  onOpenDetails,
  onToggleFavorite,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(60);

  const seriesCategories = useMemo(
    () => categories.filter((c) => c.type === 'series'),
    [categories]
  );

  const featuredSeries = useMemo(() => {
    return seriesList[0] || null;
  }, [seriesList]);

  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      if (selectedCatId === 'all') return true;
      if (selectedCatId === 'fav') return favoritesMap[s.id];
      return s.categoryId === selectedCatId;
    });
  }, [seriesList, selectedCatId, favoritesMap]);

  const displayedSeries = useMemo(
    () => filteredSeries.slice(0, visibleCount),
    [filteredSeries, visibleCount]
  );

  // Agrupamento por categorias para visualização em trilhos no modo 'all'
  const categorizedSections = useMemo(() => {
    if (selectedCatId !== 'all') return [];
    return seriesCategories
      .map((cat) => ({
        category: cat,
        items: seriesList.filter((s) => s.categoryId === cat.id).slice(0, 10),
      }))
      .filter((sec) => sec.items.length > 0)
      .slice(0, 8);
  }, [selectedCatId, seriesCategories, seriesList]);

  const isFeaturedFav = featuredSeries ? !!favoritesMap[featuredSeries.id] : false;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 font-sans no-scrollbar bg-dark-bg">
      {/* 1. HERO BANNER CINEMATOGRÁFICO DE SÉRIES */}
      {featuredSeries && selectedCatId === 'all' && (
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900/80 via-dark-card to-dark-bg border border-dark-border/80 shadow-2xl p-8 md:p-12 flex flex-col justify-end min-h-[360px] md:min-h-[420px]">
          {/* Imagem de Fundo / Backdrop */}
          {featuredSeries.backdrop || featuredSeries.poster ? (
            <img
              src={featuredSeries.backdrop || featuredSeries.poster}
              alt={featuredSeries.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105"
            />
          ) : null}

          {/* Gradiente Escuro Netflix Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/40 to-transparent z-0" />

          {/* Conteúdo do Destaque */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-xs border border-amber-500/40">
                <Star className="w-3.5 h-3.5 fill-current" />
                Série em Destaque
              </span>
              {featuredSeries.year && (
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-semibold text-xs border border-white/10">
                  {featuredSeries.year}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-md bg-brand-600/90 text-white font-bold text-[11px] uppercase tracking-wider">
                Temporadas Completas
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg uppercase font-sans">
              {featuredSeries.name}
            </h1>

            <p className="text-xs md:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
              {featuredSeries.synopsis ||
                'Explore episódios e temporadas completas das séries mais aclamadas do momento.'}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => onOpenDetails(featuredSeries)}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>VER TEMPORADAS</span>
              </button>

              <button
                onClick={() => onToggleFavorite(featuredSeries.id, 'series')}
                className={`flex items-center justify-center w-12 h-12 rounded-2xl border backdrop-blur-md transition-all ${
                  isFeaturedFav
                    ? 'bg-brand-600/30 border-brand-500 text-brand-400'
                    : 'bg-black/40 border-white/20 text-white hover:bg-white/20'
                }`}
                title="Minha Lista / Favoritos"
              >
                {isFeaturedFav ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BARRA DE NAVEGAÇÃO POR CATEGORIAS */}
      <div className="flex items-center justify-between gap-4 border-b border-dark-border/40 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-brand-500" />
            <span>Catálogo de Séries ({seriesList.length})</span>
          </h2>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setSelectedCatId('all');
              setVisibleCount(60);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCatId === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-dark-card border border-dark-border/60 text-slate-400 hover:text-white'
            }`}
          >
            Todas as Séries
          </button>
          {seriesCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCatId(cat.id);
                setVisibleCount(60);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCatId === cat.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-dark-card border border-dark-border/60 text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TRILHOS HORIZONTAIS DE CATEGORIAS (MODO 'ALL') */}
      {selectedCatId === 'all' && categorizedSections.length > 0 ? (
        <div className="space-y-8">
          {categorizedSections.map(({ category, items }) => (
            <section key={category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2 group cursor-pointer"
                  onClick={() => setSelectedCatId(category.id)}
                >
                  <span>{category.name}</span>
                  <ChevronRight className="w-4 h-4 text-brand-500 opacity-80 group-hover:translate-x-1 transition-transform" />
                </h3>
              </div>

              {/* Trilho Horizontal de Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((series) => (
                  <div key={series.id} onClick={() => onOpenDetails(series)}>
                    <MediaCard
                      item={series}
                      type="series"
                      onPlay={() => onOpenDetails(series)}
                      onToggleFavorite={onToggleFavorite}
                      isFavorite={favoritesMap[series.id]}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* 4. GRID TRADICIONAL PARA CATEGORIA SELECIONADA OU SEARCH */
        filteredSeries.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {displayedSeries.map((series) => (
                <div key={series.id} onClick={() => onOpenDetails(series)}>
                  <MediaCard
                    item={series}
                    type="series"
                    onPlay={() => onOpenDetails(series)}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favoritesMap[series.id]}
                  />
                </div>
              ))}
            </div>

            {visibleCount < filteredSeries.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 60)}
                  className="px-6 py-2.5 rounded-xl bg-dark-cardHover border border-dark-border text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  Carregar mais séries ({filteredSeries.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400 bg-dark-card/40 border border-dark-border/40 rounded-3xl">
            <Clapperboard className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold">Nenhuma série disponível nesta categoria.</p>
          </div>
        )
      )}
    </div>
  );
};

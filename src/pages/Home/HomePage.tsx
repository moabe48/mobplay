import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Clock, Tv, Film, Heart, Clapperboard, Calendar, Settings, ArrowUpRight, Compass } from 'lucide-react';
import { Channel, Movie, Series, WatchHistoryItem } from '../../types/iptv';
import { ContinueWatchingCard } from '../../components/cards/ContinueWatchingCard';
import { MediaCard } from '../../components/cards/MediaCard';

interface HomePageProps {
  history: WatchHistoryItem[];
  channels: Channel[];
  movies: Movie[];
  series: Series[];
  favoritesMap: Record<string, boolean>;
  onPlay: (item: Channel | Movie | Series | WatchHistoryItem) => void;
  onOpenDetails: (item: Movie | Series) => void;
  onToggleFavorite: (id: string, type: 'live' | 'movie' | 'series') => void;
  onNavigateToTab: (tab: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  history,
  channels,
  movies,
  series,
  favoritesMap,
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onNavigateToTab,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateString(
        now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const featuredItem = movies[0] || channels[0];
  const popularChannels = channels.slice(0, 6);
  const recentlyAdded = [...movies, ...series].slice(0, 6);
  const favCount = Object.values(favoritesMap).filter(Boolean).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 font-sans no-scrollbar bg-dark-bg">
      {/* 1. RELÓGIO & PAINEL SUPERIOR ESTILO SMART TV */}
      <div className="flex items-center justify-between border-b border-dark-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-600/20 border border-brand-500/40 text-brand-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide uppercase font-sans">
              Painel Principal
            </h1>
            <p className="text-xs text-slate-400">Explore seus canais, filmes e séries em um toque</p>
          </div>
        </div>

        {/* Relógio em Tempo Real */}
        <div className="flex items-center gap-4 bg-dark-card/60 border border-dark-border/60 px-4 py-2 rounded-2xl">
          <div className="flex flex-col text-right">
            <span className="text-sm font-extrabold text-white font-mono">{timeString}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{dateString}</span>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD TILES INTERATIVOS (ESTILO SMART TV / APPLE TV) */}
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-300 uppercase tracking-wider">
          Central de Navegação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* TILE 1: TV AO VIVO */}
          <div
            onClick={() => onNavigateToTab('livetv')}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-brand-700 via-red-900 to-dark-card border border-brand-500/50 hover:border-brand-400 shadow-xl hover:shadow-2xl hover:shadow-brand-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Tv className="w-28 h-28 text-white" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Tv className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase">
                {channels.length} Canais
              </span>
            </div>
            <div className="z-10 mt-4">
              <h3 className="text-xl font-black text-white group-hover:text-brand-300 transition-colors uppercase tracking-wide">
                TV ao Vivo
              </h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                Esportes, Notícias e Variedades 24h
              </p>
            </div>
          </div>

          {/* TILE 2: FILMES */}
          <div
            onClick={() => onNavigateToTab('movies')}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-purple-800 via-indigo-950 to-dark-card border border-purple-500/50 hover:border-purple-400 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Film className="w-28 h-28 text-white" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Film className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase">
                {movies.length} Filmes
              </span>
            </div>
            <div className="z-10 mt-4">
              <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors uppercase tracking-wide">
                Filmes (VOD)
              </h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                Lançamentos e Clássicos em Ultra HD 4K
              </p>
            </div>
          </div>

          {/* TILE 3: SÉRIES */}
          <div
            onClick={() => onNavigateToTab('series')}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-blue-700 via-slate-900 to-dark-card border border-blue-500/50 hover:border-blue-400 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clapperboard className="w-28 h-28 text-white" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Clapperboard className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase">
                {series.length} Séries
              </span>
            </div>
            <div className="z-10 mt-4">
              <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors uppercase tracking-wide">
                Séries de TV
              </h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                Temporadas e episódios completos
              </p>
            </div>
          </div>

          {/* TILE 4: GUIA EPG */}
          <div
            onClick={() => onNavigateToTab('epg')}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-amber-700 via-slate-900 to-dark-card border border-amber-500/50 hover:border-amber-400 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[160px] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-28 h-28 text-white" />
            </div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase">
                Guia EPG
              </span>
            </div>
            <div className="z-10 mt-4">
              <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors uppercase tracking-wide">
                Programação EPG
              </h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                Grade de horários ao vivo em tempo real
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED HERO BANNER */}
      {featuredItem && (
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900/70 to-dark-card border border-dark-border/80 shadow-2xl p-8 md:p-12 flex flex-col justify-end min-h-[320px]">
          {'backdrop' in featuredItem && featuredItem.backdrop ? (
            <img
              src={featuredItem.backdrop}
              alt={featuredItem.name}
              className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/60 to-transparent" />

          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/90 text-white font-bold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Destaque Principal</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
              {featuredItem.name}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 line-clamp-2 leading-relaxed">
              {'synopsis' in featuredItem
                ? (featuredItem as any).synopsis
                : 'Assista aos melhores canais, filmes e séries diretamente da sua fonte IPTV com reprodução em altíssima qualidade.'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => onPlay(featuredItem)}
                className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/40 transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Assistir Agora</span>
              </button>
              {'synopsis' in featuredItem && (
                <button
                  onClick={() => onOpenDetails(featuredItem as any)}
                  className="px-5 py-3 rounded-2xl bg-dark-card/80 border border-dark-border hover:bg-dark-cardHover text-slate-200 font-semibold text-sm transition-all"
                >
                  Mais Informações
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CARROSSEL: CONTINUAR ASSISTINDO */}
      {history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              <span>Continuar Assistindo</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {history.map((item) => (
              <ContinueWatchingCard key={item.id} item={item} onPlay={onPlay} />
            ))}
          </div>
        </section>
      )}

      {/* 5. SEÇÃO: CANAIS POPULARES */}
      {popularChannels.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-brand-500" />
              <span>Canais Populares</span>
            </h2>
            <button
              onClick={() => onNavigateToTab('livetv')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              <span>Ver Grade Completa</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularChannels.map((channel) => (
              <MediaCard
                key={channel.id}
                item={channel}
                type="live"
                onPlay={onPlay}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favoritesMap[channel.id]}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

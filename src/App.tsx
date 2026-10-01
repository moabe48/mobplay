import React, { useEffect, useState } from 'react';
import {
  IPTVAccount,
  Channel,
  Movie,
  Series,
  Episode,
  Category,
  EPGProgram,
  WatchHistoryItem,
  AppSettings,
} from './types/iptv';
import { db, clearAllCache, chunkedBulkPut } from './services/db/database';
import { saveSecureData, getSecureData } from './services/storage/secureStorage';
import { XtreamClient, getDemoData } from './services/iptv/xtreamCodes';
import { parseM3UContent } from './services/iptv/m3uParser';
import { parseXMLTVContent } from './services/epg/xmltvParser';

// Layout & Modals
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { StreamPlayer } from './components/player/StreamPlayer';
import { MovieDetailsModal } from './components/modals/MovieDetailsModal';
import { SeriesDetailsModal } from './components/modals/SeriesDetailsModal';

// Pages
import { WelcomePage } from './pages/Welcome/WelcomePage';
import { SyncPage } from './pages/Sync/SyncPage';
import { HomePage } from './pages/Home/HomePage';
import { LiveTVPage } from './pages/LiveTV/LiveTVPage';
import { MoviesPage } from './pages/Movies/MoviesPage';
import { SeriesPage } from './pages/Series/SeriesPage';
import { EPGPage } from './pages/EPG/EPGPage';
import { FavoritesPage } from './pages/Favorites/FavoritesPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { SearchPage } from './pages/Search/SearchPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { useDPadNavigation } from './hooks/useDPadNavigation';
import { checkAppUpdate, UpdateInfo } from './services/update/updateService';
import { UpdateModal } from './components/modals/UpdateModal';

export const App: React.FC = () => {
  // Ativar suporte universal a controle remoto D-Pad para Android TV
  useDPadNavigation();

  // Estado da Atualização Automática
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Account & Sync States
  const [account, setAccount] = useState<IPTVAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState<number>(0);

  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [episodesMap, setEpisodesMap] = useState<Record<string, Episode[]>>({});
  const [epgPrograms, setEpgPrograms] = useState<EPGProgram[]>([]);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  // Player & Modals
  const [activePlayerItem, setActivePlayerItem] = useState<{
    item: Channel | Movie | Episode;
    type: 'live' | 'movie' | 'series';
  } | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    accentColor: '#E50914',
    cardSize: 'medium',
    enableAnimations: true,
    autoPlayNext: true,
    rememberPosition: true,
    bufferLength: 10,
    epgAutoRefresh: true,
    epgRefreshInterval: 24,
    startWithWindows: false,
    minimizeToTray: false,
  });

  // Carregar dados armazenados na inicialização
  useEffect(() => {
    loadInitialData();
  }, []);

  // Interceptador Global do Botão VOLTAR (Hardware BACK Button da Android TV)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'GoBack' ||
        e.key === 'Back' ||
        e.key === 'Escape' ||
        e.keyCode === 4 ||
        e.keyCode === 27
      ) {
        e.preventDefault();
        e.stopPropagation();

        if (activePlayerItem) {
          setActivePlayerItem(null);
        } else if (selectedMovie) {
          setSelectedMovie(null);
        } else if (selectedSeries) {
          setSelectedSeries(null);
        } else if (updateAvailable) {
          setUpdateAvailable(null);
        } else if (activeTab !== 'home') {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [activePlayerItem, selectedMovie, selectedSeries, updateAvailable, activeTab]);

  const loadInitialData = async () => {
    try {
      // Checar se há atualizações OTA no servidor
      checkAppUpdate().then((info) => {
        if (info && info.hasUpdate) {
          setUpdateAvailable(info);
        }
      });

      const savedAccount = await getSecureData<IPTVAccount>('active_account');
      if (savedAccount) {
        setAccount(savedAccount);
        await loadFromLocalDb();
      }
    } catch (e) {
      console.error('Erro ao carregar dados iniciais:', e);
    }
  };

  const loadFromLocalDb = async () => {
    const dbCategories = await db.categories.toArray();
    const dbChannels = await db.channels.toArray();
    const dbMovies = await db.movies.toArray();
    const dbSeries = await db.series.toArray();
    const dbEpg = await db.epg.toArray();
    const dbFavs = await db.favorites.toArray();
    const dbHistory = await db.history.orderBy('updatedAt').reverse().toArray();

    setCategories(dbCategories);
    setChannels(dbChannels);
    setMovies(dbMovies);
    setSeriesList(dbSeries);
    setEpgPrograms(dbEpg);
    setHistory(dbHistory);

    const favMap: Record<string, boolean> = {};
    dbFavs.forEach((f) => (favMap[f.contentId] = true));
    setFavoritesMap(favMap);
  };

  // Processo de Sincronização / Importação de Fonte IPTV
  const handleConnectAccount = async (newAccount: IPTVAccount) => {
    setAccount(newAccount);
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncMessage('Conectando ao servidor IPTV...');

    try {
      if (newAccount.type === 'demo') {
        setSyncMessage('Carregando biblioteca de demonstração...');
        setSyncProgress(50);
        const demo = getDemoData();

        await clearAllCache();
        await chunkedBulkPut(db.categories, demo.categories);
        await chunkedBulkPut(db.channels, demo.channels);
        await chunkedBulkPut(db.movies, demo.movies);
        await chunkedBulkPut(db.series, demo.series);
        await chunkedBulkPut(db.episodes, demo.episodes);
        await chunkedBulkPut(db.epg, demo.epgPrograms);

        setEpisodesMap({ [demo.series[0].id]: demo.episodes });
        setSyncProgress(100);
      } else if (newAccount.type === 'xtream') {
        const client = new XtreamClient(
          newAccount.serverUrl || '',
          newAccount.username || '',
          newAccount.password || ''
        );

        setSyncMessage('Autenticando no servidor IPTV...');
        await client.authenticate();
        setSyncProgress(15);

        await clearAllCache();

        // 1. Importar Categorias (Sequencial)
        setSyncMessage('Importando categorias...');
        try {
          const liveCats = await client.getLiveCategories();
          const vodCats = await client.getVodCategories();
          const seriesCats = await client.getSeriesCategories();
          const allCats = [...liveCats, ...vodCats, ...seriesCats];
          await chunkedBulkPut(db.categories, allCats, 500);
        } catch (e) {
          console.warn('Aviso ao importar categorias:', e);
        }
        setSyncProgress(30);

        // 2. Importar Canais ao Vivo (Sequencial)
        setSyncMessage('Baixando canais ao vivo...');
        try {
          const liveStreams = await client.getLiveStreams();
          setSyncMessage(`Salvando ${liveStreams.length} canais ao vivo...`);
          await chunkedBulkPut(db.channels, liveStreams, 500);
        } catch (e) {
          console.warn('Aviso ao carregar canais ao vivo:', e);
        }
        setSyncProgress(50);

        // 3. Importar Filmes VOD (Sequencial)
        setSyncMessage('Baixando catálogo de filmes (VOD)...');
        try {
          const vodStreams = await client.getVodStreams();
          setSyncMessage(`Salvando ${vodStreams.length} filmes (VOD)...`);
          await chunkedBulkPut(db.movies, vodStreams, 500);
        } catch (e) {
          console.warn('Aviso ao carregar filmes VOD:', e);
        }
        setSyncProgress(85);

        // 4. Importar Séries (Sequencial)
        setSyncMessage('Baixando catálogo de séries...');
        try {
          const seriesStreams = await client.getSeriesStreams();
          setSyncMessage(`Salvando ${seriesStreams.length} séries...`);
          await chunkedBulkPut(db.series, seriesStreams, 500);
        } catch (e) {
          console.warn('Aviso ao carregar séries:', e);
        }
        setSyncProgress(100);
      } else if (newAccount.type === 'm3u_url' || newAccount.type === 'm3u_file') {
        let content = '';
        if (newAccount.type === 'm3u_url') {
          setSyncMessage('Baixando lista M3U da URL...');
          const res = await fetch(newAccount.m3uUrl || '');
          content = await res.text();
        } else {
          setSyncMessage('Lendo arquivo M3U local...');
          if (window.electronAPI?.selectFile) {
            // Caso já tenha o conteúdo ou selecione novamente
          }
        }
        setSyncProgress(60);
        setSyncMessage('Processando canais, filmes e guia...');
        const parsed = parseM3UContent(content);

        await clearAllCache();
        await chunkedBulkPut(db.categories, parsed.categories);
        await chunkedBulkPut(db.channels, parsed.channels);
        await chunkedBulkPut(db.movies, parsed.movies);
        await chunkedBulkPut(db.series, parsed.series);
        setSyncProgress(100);
      }

      await saveSecureData('active_account', newAccount);
      await loadFromLocalDb();
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      alert(err.message || 'Não foi possível sincronizar totalmente a lista. Verifique os dados de acesso ou tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Alternar Favorito
  const handleToggleFavorite = async (id: string, type: 'live' | 'movie' | 'series') => {
    const isFav = !!favoritesMap[id];
    const newFavMap = { ...favoritesMap, [id]: !isFav };
    setFavoritesMap(newFavMap);

    if (isFav) {
      await db.favorites.where('contentId').equals(id).delete();
    } else {
      await db.favorites.put({
        id: `fav_${id}`,
        contentId: id,
        type,
        addedAt: new Date().toISOString(),
      });
    }
  };

  // Atualização do Histórico ao assistir vídeo
  const handleProgressUpdate = async (currentSec: number, totalSec: number) => {
    if (!activePlayerItem || totalSec <= 0) return;
    const item = activePlayerItem.item;
    const pct = (currentSec / totalSec) * 100;

    const histItem: WatchHistoryItem = {
      id: `hist_${item.id}`,
      contentId: item.id,
      contentType: activePlayerItem.type,
      title: 'name' in item ? item.name : 'title' in item ? item.title : 'Vídeo',
      poster: 'poster' in item ? (item as any).poster : 'cover' in item ? (item as any).cover : undefined,
      categoryName: 'categoryName' in item ? (item as any).categoryName : undefined,
      progressPercentage: pct,
      durationSec: totalSec,
      currentPosSec: currentSec,
      updatedAt: new Date().toISOString(),
    };

    await db.history.put(histItem);
    const updatedHistory = await db.history.orderBy('updatedAt').reverse().toArray();
    setHistory(updatedHistory);
  };

  // Carregar episódios de uma série no Xtream ou Demo
  const handleOpenSeriesDetails = async (series: Series) => {
    setSelectedSeries(series);
    if (!episodesMap[series.id]) {
      if (account?.type === 'xtream') {
        const client = new XtreamClient(account.serverUrl || '', account.username || '', account.password || '');
        const eps = await client.getSeriesInfo(series.seriesId);
        setEpisodesMap((prev) => ({ ...prev, [series.id]: eps }));
      } else if (account?.type === 'demo') {
        const demo = getDemoData();
        setEpisodesMap((prev) => ({ ...prev, [series.id]: demo.episodes }));
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg text-slate-100 font-sans select-none">
      {/* 1. Tela de Boas-vindas se não houver conta */}
      {!account && <WelcomePage onConnectAccount={handleConnectAccount} />}

      {/* 2. Tela de Sincronização em Andamento */}
      {isSyncing && <SyncPage progressMessage={syncMessage} progressPercent={syncProgress} />}

      {/* 3. Aplicação Principal StreamBox */}
      {account && !isSyncing && (
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          {/* Header Superior (Top Nav Bar) */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onRefreshData={() => handleConnectAccount(account)}
            isSyncing={isSyncing}
          />

            {/* Roteamento de Páginas */}
            <main className="flex-1 overflow-hidden flex flex-col relative bg-dark-bg">
              {activeTab === 'home' && (
                <HomePage
                  history={history}
                  channels={channels}
                  movies={movies}
                  series={seriesList}
                  seriesList={seriesList}
                  favoritesMap={favoritesMap}
                  setActiveTab={setActiveTab}
                  onNavigateToTab={setActiveTab}
                  onPlay={(item) => {
                    if ('progressPercentage' in item) {
                      // Resume de histórico
                      const foundChannel = channels.find((c) => c.id === item.contentId);
                      const foundMovie = movies.find((m) => m.id === item.contentId);
                      if (foundChannel) setActivePlayerItem({ item: foundChannel, type: 'live' });
                      else if (foundMovie) setActivePlayerItem({ item: foundMovie, type: 'movie' });
                    } else if ('url' in item && !('poster' in item)) {
                      setActivePlayerItem({ item: item as Channel, type: 'live' });
                    } else if ('url' in item) {
                      setActivePlayerItem({ item: item as Movie, type: 'movie' });
                    }
                  }}
                  onPlayItem={(item, type) => {
                    if (type === 'live') setActivePlayerItem({ item: item as Channel, type: 'live' });
                    else if (type === 'movie') setActivePlayerItem({ item: item as Movie, type: 'movie' });
                    else if (type === 'series') handleOpenSeriesDetails(item as Series);
                  }}
                  onOpenDetails={(item) => {
                    if ('seasonsCount' in item || 'seriesId' in item) handleOpenSeriesDetails(item as Series);
                    else setSelectedMovie(item as Movie);
                  }}
                  onSelectMovie={setSelectedMovie}
                  onSelectSeries={handleOpenSeriesDetails}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'livetv' && (
                <LiveTVPage
                  channels={channels}
                  categories={categories}
                  epgPrograms={epgPrograms}
                  favoritesMap={favoritesMap}
                  onPlayChannel={(ch) => setActivePlayerItem({ item: ch, type: 'live' })}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'movies' && (
                <MoviesPage
                  movies={movies}
                  categories={categories}
                  favoritesMap={favoritesMap}
                  onPlayMovie={(mov) => setActivePlayerItem({ item: mov, type: 'movie' })}
                  onSelectMovie={setSelectedMovie}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'series' && (
                <SeriesPage
                  seriesList={seriesList}
                  categories={categories}
                  favoritesMap={favoritesMap}
                  onPlaySeries={(ser) => handleOpenSeriesDetails(ser)}
                  onSelectSeries={handleOpenSeriesDetails}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'epg' && (
                <EPGPage
                  channels={channels}
                  epgPrograms={epgPrograms}
                  onPlayChannel={(ch) => setActivePlayerItem({ item: ch, type: 'live' })}
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesPage
                  channels={channels}
                  movies={movies}
                  series={seriesList}
                  favoritesMap={favoritesMap}
                  onPlay={(item) => {
                    if ('url' in item && !('poster' in item)) setActivePlayerItem({ item: item as Channel, type: 'live' });
                    else if ('url' in item) setActivePlayerItem({ item: item as Movie, type: 'movie' });
                  }}
                  onOpenDetails={(item) => {
                    if ('seriesId' in item) handleOpenSeriesDetails(item as Series);
                    else setSelectedMovie(item as Movie);
                  }}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'history' && (
                <HistoryPage
                  history={history}
                  onPlay={(item) => {
                    const foundChannel = channels.find((c) => c.id === item.contentId);
                    const foundMovie = movies.find((m) => m.id === item.contentId);
                    if (foundChannel) setActivePlayerItem({ item: foundChannel, type: 'live' });
                    else if (foundMovie) setActivePlayerItem({ item: foundMovie, type: 'movie' });
                  }}
                  onClearHistory={async () => {
                    await db.history.clear();
                    setHistory([]);
                  }}
                />
              )}

              {activeTab === 'search' && (
                <SearchPage
                  query={searchQuery}
                  setQuery={setSearchQuery}
                  channels={channels}
                  movies={movies}
                  series={seriesList}
                  favoritesMap={favoritesMap}
                  onPlay={(item) => {
                    if ('url' in item && !('poster' in item)) setActivePlayerItem({ item: item as Channel, type: 'live' });
                    else if ('url' in item) setActivePlayerItem({ item: item as Movie, type: 'movie' });
                  }}
                  onOpenDetails={(item) => {
                    if ('seriesId' in item) handleOpenSeriesDetails(item as Series);
                    else setSelectedMovie(item as Movie);
                  }}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  account={account}
                  settings={settings}
                  onUpdateSettings={(newSt) => setSettings((prev) => ({ ...prev, ...newSt }))}
                  onRefreshPlaylist={() => handleConnectAccount(account)}
                  onClearCache={async () => {
                    await clearAllCache();
                    await loadFromLocalDb();
                  }}
                  onDisconnectAccount={async () => {
                    await saveSecureData('active_account', null);
                    setAccount(null);
                    await clearAllCache();
                  }}
                  onTriggerUpdateModal={(info) => setUpdateAvailable(info)}
                />
              )}
            </main>

          {/* Barra de Navegação Inferior para Celular */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Modais de Detalhes de Filmes & Séries */}
          <MovieDetailsModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            onPlay={(mov) => setActivePlayerItem({ item: mov, type: 'movie' })}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={selectedMovie ? !!favoritesMap[selectedMovie.id] : false}
          />

          <SeriesDetailsModal
            series={selectedSeries}
            episodes={selectedSeries ? episodesMap[selectedSeries.id] || [] : []}
            onClose={() => setSelectedSeries(null)}
            onPlayEpisode={(ep) => setActivePlayerItem({ item: ep, type: 'series' })}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={selectedSeries ? !!favoritesMap[selectedSeries.id] : false}
          />

          {/* Player HLS de Vídeo em Tela Cheia */}
          {activePlayerItem && (
            <StreamPlayer
              item={activePlayerItem.item}
              itemType={activePlayerItem.type}
              allChannels={channels}
              onSelectChannel={(ch) => setActivePlayerItem({ item: ch, type: 'live' })}
              onClose={() => setActivePlayerItem(null)}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={!!favoritesMap[activePlayerItem.item.id]}
              onProgressUpdate={handleProgressUpdate}
            />
          )}
          {/* Modal de Atualização Automática OTA */}
          {updateAvailable && (
            <UpdateModal
              updateInfo={updateAvailable}
              onClose={() => setUpdateAvailable(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

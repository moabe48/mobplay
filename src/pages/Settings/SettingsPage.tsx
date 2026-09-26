import React, { useState } from 'react';
import {
  Settings,
  User,
  List,
  Calendar,
  PlaySquare,
  Palette,
  Sliders,
  Trash2,
  RefreshCw,
  LogOut,
  Check,
  Download,
  Sparkles,
} from 'lucide-react';
import { IPTVAccount, AppSettings } from '../../types/iptv';
import { checkAppUpdate, UpdateInfo } from '../../services/update/updateService';
import { APP_CONFIG } from '../../config/updateConfig';

interface SettingsPageProps {
  account: IPTVAccount | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshPlaylist: () => void;
  onClearCache: () => void;
  onDisconnectAccount: () => void;
  onTriggerUpdateModal?: (info: UpdateInfo) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  account,
  settings,
  onUpdateSettings,
  onRefreshPlaylist,
  onClearCache,
  onDisconnectAccount,
  onTriggerUpdateModal,
}) => {
  const [activeSection, setActiveSection] = useState<
    'account' | 'update' | 'playlist' | 'epg' | 'playback' | 'interface' | 'general'
  >('update');

  const [checkingUpdate, setCheckingUpdate] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus('Buscando atualizações no servidor GitHub...');

    try {
      const info = await checkAppUpdate();
      if (info && info.hasUpdate) {
        setUpdateStatus(`Nova versão v${info.latestVersion} encontrada!`);
        if (onTriggerUpdateModal) {
          onTriggerUpdateModal(info);
        }
      } else {
        setUpdateStatus(`Você já está utilizando a versão mais recente (${APP_CONFIG.version}).`);
        showToast(`Seu MobPlay v${APP_CONFIG.version} já está atualizado!`);
      }
    } catch (e) {
      setUpdateStatus('Não foi possível conectar ao servidor de atualizações.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 font-sans no-scrollbar">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Configurações do MobPlay</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gerencie sua conta IPTV, atualizações do sistema, reprodução, cache e preferências da interface.
        </p>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1 bg-slate-950 border border-slate-800 rounded-3xl p-3 h-fit">
          <button
            tabIndex={0}
            onClick={() => setActiveSection('update')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'update'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Atualizações do App</span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'account'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Conta & Servidor</span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setActiveSection('playlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'playlist'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Playlist</span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setActiveSection('epg')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'epg'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Guia EPG</span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setActiveSection('playback')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'playback'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            <span>Reprodução</span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setActiveSection('interface')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'interface'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Interface</span>
          </button>

          <button
            tabIndex={0}
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
              activeSection === 'general'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Geral & Cache</span>
          </button>
        </div>

        {/* Section Detail Panel */}
        <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
          {/* PAINEL DE ATUALIZAÇÕES DO APP */}
          {activeSection === 'update' && (
            <div className="space-y-5">
              <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                <span>Atualização do MobPlay (OTA)</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs text-slate-400 block">Versão Atual Instalada</span>
                    <span className="text-lg font-black text-cyan-400">MobPlay v{APP_CONFIG.version}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Canal Oficial GitHub</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  O MobPlay possui atualização automática via GitHub. Verifique manualmente se há novas versões com melhorias de velocidade, novos recursos e ajustes para Smart TV.
                </p>
              </div>

              {updateStatus && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                  {updateStatus}
                </div>
              )}

              <button
                tabIndex={0}
                disabled={checkingUpdate}
                onClick={handleManualCheckUpdate}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm md:text-base shadow-xl transition-transform focus:ring-4 focus:ring-cyan-400 focus:scale-105 focus:outline-none disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                <span>{checkingUpdate ? 'VERIFICANDO...' : 'VERIFICAR ATUALIZAÇÕES AGORA'}</span>
              </button>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Informações da Conta
              </h3>
              {account ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-xs text-slate-400 block">Nome da Conexão</span>
                      <strong className="text-sm text-white font-bold">{account.name}</strong>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-xs text-slate-400 block">Tipo de Fonte</span>
                      <strong className="text-sm text-cyan-400 font-bold uppercase">{account.type}</strong>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 flex-wrap">
                    <button
                      tabIndex={0}
                      onClick={onRefreshPlaylist}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md focus:ring-4 focus:ring-cyan-400 focus:outline-none"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Atualizar Dados</span>
                    </button>
                    <button
                      tabIndex={0}
                      onClick={onDisconnectAccount}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold border border-red-500/40 focus:ring-4 focus:ring-cyan-400 focus:outline-none"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Desconectar Conta</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhuma conta conectada no momento.</p>
              )}
            </div>
          )}

          {activeSection === 'playlist' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Gerenciamento da Playlist
              </h3>
              <p className="text-xs text-slate-400">
                Sincronize novamente sua lista para obter novas categorias, canais e conteúdos adicionados pela fonte.
              </p>
              <button
                tabIndex={0}
                onClick={() => {
                  onRefreshPlaylist();
                  showToast('Sincronização de playlist iniciada!');
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md focus:ring-4 focus:ring-cyan-400 focus:outline-none"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar Lista Agora</span>
              </button>
            </div>
          )}

          {activeSection === 'playback' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Configurações de Reprodução
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-200">Reprodução Automática de Próximo Episódio</span>
                  <input
                    type="checkbox"
                    checked={settings.autoPlayNext}
                    onChange={(e) => {
                      onUpdateSettings({ autoPlayNext: e.target.checked });
                      showToast('Preferência salva!');
                    }}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-200">Lembrar Posição do Vídeo</span>
                  <input
                    type="checkbox"
                    checked={settings.rememberPosition}
                    onChange={(e) => {
                      onUpdateSettings({ rememberPosition: e.target.checked });
                      showToast('Preferência salva!');
                    }}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeSection === 'interface' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Interface e Animações
              </h3>
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
                <span className="text-xs font-semibold text-slate-200">Ativar Animações Suaves e Efeitos Hover</span>
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={(e) => {
                    onUpdateSettings({ enableAnimations: e.target.checked });
                    showToast('Configuração de animações salva!');
                  }}
                  className="w-4 h-4 accent-cyan-500"
                />
              </label>
            </div>
          )}

          {activeSection === 'general' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Geral & Sistema de Cache
              </h3>
              <p className="text-xs text-slate-400">
                Limpe o cache local de capas, canais e programação para liberar memória e forçar nova sincronização.
              </p>
              <button
                tabIndex={0}
                onClick={() => {
                  onClearCache();
                  showToast('Cache local limpo com sucesso!');
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold border border-red-500/40 focus:ring-4 focus:ring-cyan-400 focus:outline-none"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Todo o Cache Local</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

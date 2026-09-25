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
} from 'lucide-react';
import { IPTVAccount, AppSettings } from '../../types/iptv';

interface SettingsPageProps {
  account: IPTVAccount | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRefreshPlaylist: () => void;
  onClearCache: () => void;
  onDisconnectAccount: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  account,
  settings,
  onUpdateSettings,
  onRefreshPlaylist,
  onClearCache,
  onDisconnectAccount,
}) => {
  const [activeSection, setActiveSection] = useState<
    'account' | 'playlist' | 'epg' | 'playback' | 'interface' | 'general'
  >('account');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 font-sans no-scrollbar">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Configurações do MobPlay</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gerencie sua conta IPTV, reprodução, cache e preferências da interface.
        </p>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1 bg-dark-card border border-dark-border/60 rounded-3xl p-3 h-fit">
          <button
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
              activeSection === 'account'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Conta & Servidor</span>
          </button>

          <button
            onClick={() => setActiveSection('playlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
              activeSection === 'playlist'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Playlist</span>
          </button>

          <button
            onClick={() => setActiveSection('epg')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
              activeSection === 'epg'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Guia EPG</span>
          </button>

          <button
            onClick={() => setActiveSection('playback')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
              activeSection === 'playback'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            <span>Reprodução</span>
          </button>

          <button
            onClick={() => setActiveSection('interface')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
              activeSection === 'interface'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Interface</span>
          </button>

          <button
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
              activeSection === 'general'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Geral & Cache</span>
          </button>
        </div>

        {/* Section Detail Panel */}
        <div className="md:col-span-3 bg-dark-card border border-dark-border/60 rounded-3xl p-6 space-y-6">
          {activeSection === 'account' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-dark-border pb-3">
                Informações da Conta
              </h3>
              {account ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/60">
                      <span className="text-xs text-slate-400 block">Nome da Conexão</span>
                      <strong className="text-sm text-white font-bold">{account.name}</strong>
                    </div>
                    <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border/60">
                      <span className="text-xs text-slate-400 block">Tipo de Fonte</span>
                      <strong className="text-sm text-brand-400 font-bold uppercase">{account.type}</strong>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={onRefreshPlaylist}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Atualizar Dados</span>
                    </button>
                    <button
                      onClick={onDisconnectAccount}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30"
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
              <h3 className="text-base font-bold text-white border-b border-dark-border pb-3">
                Gerenciamento da Playlist
              </h3>
              <p className="text-xs text-slate-400">
                Sincronize novamente sua lista para obter novas categorias, canais e conteúdos adicionados pela fonte.
              </p>
              <button
                onClick={() => {
                  onRefreshPlaylist();
                  showToast('Sincronização de playlist iniciada!');
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar Lista Agora</span>
              </button>
            </div>
          )}

          {activeSection === 'playback' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-dark-border pb-3">
                Configurações de Reprodução
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-dark-bg border border-dark-border/60 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-200">Reprodução Automática de Próximo Episódio</span>
                  <input
                    type="checkbox"
                    checked={settings.autoPlayNext}
                    onChange={(e) => {
                      onUpdateSettings({ autoPlayNext: e.target.checked });
                      showToast('Preferência salva!');
                    }}
                    className="w-4 h-4 accent-brand-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-dark-bg border border-dark-border/60 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-200">Lembrar Posição do Vídeo</span>
                  <input
                    type="checkbox"
                    checked={settings.rememberPosition}
                    onChange={(e) => {
                      onUpdateSettings({ rememberPosition: e.target.checked });
                      showToast('Preferência salva!');
                    }}
                    className="w-4 h-4 accent-brand-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeSection === 'interface' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-dark-border pb-3">
                Interface e Animações
              </h3>
              <label className="flex items-center justify-between p-3 rounded-2xl bg-dark-bg border border-dark-border/60 cursor-pointer">
                <span className="text-xs font-semibold text-slate-200">Ativar Animações Suaves e Efeitos Hover</span>
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={(e) => {
                    onUpdateSettings({ enableAnimations: e.target.checked });
                    showToast('Configuração de animações salva!');
                  }}
                  className="w-4 h-4 accent-brand-500"
                />
              </label>
            </div>
          )}

          {activeSection === 'general' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white border-b border-dark-border pb-3">
                Geral & Sistema de Cache
              </h3>
              <p className="text-xs text-slate-400">
                Limpe o cache local de capas, canais e programação para liberar memória e forçar nova sincronização.
              </p>
              <button
                onClick={() => {
                  onClearCache();
                  showToast('Cache local limpo com sucesso!');
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30"
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

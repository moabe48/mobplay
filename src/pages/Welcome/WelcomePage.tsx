import React, { useState } from 'react';
import { Tv2, Server, Link, FileText, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { IPTVAccount, SourceType } from '../../types/iptv';

interface WelcomePageProps {
  onConnectAccount: (account: IPTVAccount) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onConnectAccount }) => {
  const [activeType, setActiveType] = useState<SourceType>('xtream');

  // Form fields
  const [connName, setConnName] = useState('Minha Lista IPTV');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uFilePath, setM3uFilePath] = useState('');
  const [epgUrl, setEpgUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Picker
  const handleSelectFile = async () => {
    if (window.electronAPI && window.electronAPI.selectFile) {
      const result = await window.electronAPI.selectFile();
      if (result) {
        setM3uFilePath(result.filePath);
      }
    } else {
      setErrorMsg('Seleção de arquivos disponível ao executar no app desktop Windows.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeType === 'xtream') {
      if (!serverUrl || !username || !password) {
        setErrorMsg('Por favor, preencha a URL do servidor, usuário e senha.');
        return;
      }
      onConnectAccount({
        name: connName || 'Xtream IPTV',
        type: 'xtream',
        serverUrl,
        username,
        password,
        epgUrl,
        status: 'syncing',
      });
    } else if (activeType === 'm3u_url') {
      if (!m3uUrl) {
        setErrorMsg('Por favor, informe a URL da lista M3U.');
        return;
      }
      onConnectAccount({
        name: connName || 'Lista M3U',
        type: 'm3u_url',
        m3uUrl,
        epgUrl,
        status: 'syncing',
      });
    } else if (activeType === 'm3u_file') {
      if (!m3uFilePath) {
        setErrorMsg('Por favor, selecione um arquivo .m3u ou .m3u8.');
        return;
      }
      onConnectAccount({
        name: connName || 'Arquivo M3U Local',
        type: 'm3u_file',
        m3uFilePath,
        epgUrl,
        status: 'syncing',
      });
    }
  };

  const handleStartDemo = () => {
    onConnectAccount({
      name: 'MobPlay Demonstração HD',
      type: 'demo',
      status: 'connected',
    });
  };

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex items-center justify-center p-6 overflow-y-auto font-sans">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-dark-card/90 backdrop-blur-xl border border-dark-border/80 rounded-3xl p-8 shadow-2xl z-10 my-8">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/95 p-2 shadow-xl shadow-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30">
            <img src="/logo.png" alt="MobPlay Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
            Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">MobPlay</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conecte sua fonte IPTV para assistir no Celular, Android TV ou Computador.
          </p>
        </div>

        {/* Source Option Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-dark-bg/80 rounded-2xl border border-dark-border/60 mb-6">
          <button
            type="button"
            onClick={() => setActiveType('xtream')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all ${
              activeType === 'xtream'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Xtream Codes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('m3u_url')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all ${
              activeType === 'm3u_url'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Lista M3U URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('m3u_file')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all ${
              activeType === 'm3u_file'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-dark-cardHover'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Arquivo M3U</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Connection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome da Conexão
            </label>
            <input
              type="text"
              value={connName}
              onChange={(e) => setConnName(e.target.value)}
              placeholder="Ex: Minha Lista Principal"
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {activeType === 'xtream' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL do Servidor
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://servidor-iptv.com:8080"
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'm3u_url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL M3U / M3U8
              </label>
              <input
                type="url"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                placeholder="http://exemplo.com/lista.m3u"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-xs"
              />
            </div>
          )}

          {activeType === 'm3u_file' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Arquivo M3U Local (.m3u / .m3u8)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={m3uFilePath}
                  placeholder="Nenhum arquivo selecionado"
                  className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-xs text-slate-300 truncate"
                />
                <button
                  type="button"
                  onClick={handleSelectFile}
                  className="px-4 py-3 bg-dark-cardHover hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Procurar...
                </button>
              </div>
            </div>
          )}

          {/* Opcional: URL EPG XMLTV */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL do EPG / XMLTV (Opcional)
            </label>
            <input
              type="text"
              value={epgUrl}
              onChange={(e) => setEpgUrl(e.target.value)}
              placeholder="http://exemplo.com/epg.xml.gz"
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-xs"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 mt-6"
          >
            <span>Conectar e Importar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Mode Action */}
        <div className="mt-8 border-t border-dark-border/60 pt-6 text-center">
          <p className="text-xs text-slate-400 mb-3">
            Quer apenas testar a interface e o player agora?
          </p>
          <button
            onClick={handleStartDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-cardHover hover:bg-slate-700/80 text-amber-400 font-semibold text-xs border border-amber-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Testar com Conteúdo de Demonstração</span>
          </button>
        </div>
      </div>
    </div>
  );
};

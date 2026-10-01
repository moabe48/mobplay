import React, { useState } from 'react';
import { Download, Sparkles, X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { UpdateInfo } from '../../services/update/updateService';
import { APP_CONFIG } from '../../config/updateConfig';

const ApkInstaller = registerPlugin<{
  installApk(options: { url: string }): Promise<{ success: boolean }>;
}>('ApkInstaller');

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleStartUpdate = async () => {
    if (!updateInfo.apkUrl) return;
    setDownloading(true);
    setStatusMsg('Baixando APK e abrindo o Instalador do Android...');

    try {
      if (Capacitor.isNativePlatform()) {
        await ApkInstaller.installApk({ url: updateInfo.apkUrl });
      } else {
        window.location.href = updateInfo.apkUrl;
      }
    } catch (err: any) {
      console.error('Erro ao instalar APK:', err);
      setStatusMsg('Abrindo download no navegador...');
      window.location.href = updateInfo.apkUrl;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-lg bg-dark-card border border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-2xl animate-scaleUp text-slate-100">
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nova Atualização Disponível!</h2>
              <p className="text-xs text-cyan-400 font-medium">MobPlay v{updateInfo.latestVersion}</p>
            </div>
          </div>
          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-cardHover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current vs New Version Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-dark-bg/80 border border-dark-border/60 mb-5 text-xs">
          <div className="text-slate-400">
            Sua versão: <span className="text-slate-200 font-semibold">v{APP_CONFIG.version}</span>
          </div>
          <div className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Nova versão: v{updateInfo.latestVersion}
          </div>
        </div>

        {/* Release Notes */}
        <div className="mb-6 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">O que há de novo:</span>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-dark-border/40 text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
            {updateInfo.releaseNotes}
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Atualização oficial verificada pelo GitHub Releases.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleStartUpdate}
            autoFocus
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 focus:ring-4 focus:ring-cyan-400 focus:outline-none"
          >
            <Download className="w-5 h-5" />
            <span>{downloading ? 'Baixando Atualização...' : 'Atualizar Agora'}</span>
          </button>

          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              className="py-3.5 px-6 rounded-2xl bg-dark-bg border border-dark-border hover:bg-dark-cardHover text-slate-300 text-sm font-semibold transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              Lembrar Mais Tarde
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

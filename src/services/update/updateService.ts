import { APP_CONFIG } from '../../config/updateConfig';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  apkUrl: string;
  releaseNotes: string;
  mandatory: boolean;
}

/**
 * Compara duas strings de versão no formato "1.0.0" vs "1.1.0"
 */
export function isVersionGreater(latest: string, current: string): boolean {
  const latestParts = latest.split('.').map((p) => parseInt(p, 10) || 0);
  const currentParts = current.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

/**
 * Checa se existe uma nova versão do MobPlay no GitHub
 */
export async function checkAppUpdate(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(`${APP_CONFIG.updateUrl}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const latestVersion = data.version || '1.0.0';
    const hasUpdate = isVersionGreater(latestVersion, APP_CONFIG.version);

    return {
      hasUpdate,
      latestVersion,
      apkUrl: data.apkUrl || '',
      releaseNotes: data.releaseNotes || 'Melhorias gerais de desempenho e correções.',
      mandatory: data.mandatory || false,
    };
  } catch (error) {
    console.log('[MobPlay Auto-Update] Não foi possível verificar atualizações no momento.');
    return null;
  }
}

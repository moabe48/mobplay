// Bridge para o IPC safeStorage do Electron ou localStorage fallback no navegador

declare global {
  interface Window {
    electronAPI?: {
      selectFile: (filters?: any) => Promise<{ filePath: string; content: string } | null>;
      secureStore: (key: string, value: string) => Promise<boolean>;
      secureGet: (key: string) => Promise<string | null>;
      getAppVersion: () => Promise<string>;
    };
  }
}

export async function saveSecureData(key: string, value: any): Promise<boolean> {
  const jsonStr = JSON.stringify(value);
  if (window.electronAPI && window.electronAPI.secureStore) {
    return await window.electronAPI.secureStore(key, jsonStr);
  }
  localStorage.setItem(`mobplay_${key}`, jsonStr);
  return true;
}

export async function getSecureData<T>(key: string): Promise<T | null> {
  if (window.electronAPI && window.electronAPI.secureGet) {
    const raw = await window.electronAPI.secureGet(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
  }
  const localRaw = localStorage.getItem(`mobplay_${key}`) || localStorage.getItem(`streambox_${key}`);
  if (localRaw) {
    try {
      return JSON.parse(localRaw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

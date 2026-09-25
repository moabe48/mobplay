import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: (filters?: any) => ipcRenderer.invoke('select-file', filters),
  secureStore: (key: string, value: string) => ipcRenderer.invoke('secure-store', key, value),
  secureGet: (key: string) => ipcRenderer.invoke('secure-get', key),
  getAppVersion: () => ipcRenderer.invoke('app-version'),
});

import { app, BrowserWindow, ipcMain, safeStorage, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'StreamBox IPTV',
    backgroundColor: '#0B0E14',
    show: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Permitir carregar m3u8 e streams TS de servidores remotos sem bloqueio de CORS
    },
  });

  // Configurar User-Agent padrão para emular player IPTV tradicional se necessário
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = 'VLC/3.0.18 LibVLC/3.0.18 StreamBox/1.0';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-file', async (_event, filters) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters || [{ name: 'Arquivos M3U / EPG', extensions: ['m3u', 'm3u8', 'xml', 'gz'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return { filePath, content };
  }
  return null;
});

ipcMain.handle('secure-store', (_event, key: string, value: string) => {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value);
      fs.writeFileSync(path.join(app.getPath('userData'), `${key}.enc`), encrypted);
      return true;
    } else {
      fs.writeFileSync(path.join(app.getPath('userData'), `${key}.txt`), value, 'utf-8');
      return true;
    }
  } catch (err) {
    console.error('Erro ao armazenar dado seguro:', err);
    return false;
  }
});

ipcMain.handle('secure-get', (_event, key: string) => {
  try {
    const encPath = path.join(app.getPath('userData'), `${key}.enc`);
    const txtPath = path.join(app.getPath('userData'), `${key}.txt`);
    if (fs.existsSync(encPath) && safeStorage.isEncryptionAvailable()) {
      const buf = fs.readFileSync(encPath);
      return safeStorage.decryptString(buf);
    } else if (fs.existsSync(txtPath)) {
      return fs.readFileSync(txtPath, 'utf-8');
    }
    return null;
  } catch (err) {
    console.error('Erro ao ler dado seguro:', err);
    return null;
  }
});

ipcMain.handle('app-version', () => app.getVersion());

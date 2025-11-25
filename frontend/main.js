const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Disable GPU acceleration as requested
app.disableHardwareAcceleration();

let mainWindow = null;
let backendProcess = null;

function startBackendIfAvailable() {
  // Attempt to run start.py using the system Python if present
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const startScript = path.join(__dirname, '..', '..', 'start.py');

  try {
    backendProcess = spawn(pythonCmd, [startScript], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    backendProcess.stdout.on('data', (data) => {
      console.log('[backend]', data.toString());
    });
    backendProcess.stderr.on('data', (data) => {
      console.error('[backend]', data.toString());
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });
  } catch (e) {
    console.error('Failed to start backend:', e);
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  // In development, load Vite dev server. Otherwise load built files.
  const isDev = process.env.ELECTRON_DEV === 'true' || process.env.NODE_ENV === 'development';

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start backend (best-effort) so the packaged app can run locally if Python is available
  startBackendIfAvailable();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {
      // ignore
    }
    backendProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

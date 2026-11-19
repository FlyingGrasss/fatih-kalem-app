'use strict';

const {
  app,
  BrowserWindow,
  Menu,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  screen
} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const WINDOW_LEVEL = 'screen-saver';
const MODE_CHANNEL = 'overlay:mode';
const VISIBILITY_CHANNEL = 'overlay:visibility';
const MODE_SHORTCUT = 'Ctrl+Alt+K';
const VISIBILITY_SHORTCUT = 'Ctrl+Alt+H';
const QUIT_SHORTCUT = 'Ctrl+Alt+Q';
const PNG_DATA_PREFIX = 'data:image/png;base64,';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_PNG_DATA_URL_LENGTH = 120 * 1024 * 1024;

let mainWindow = null;
let drawingMode = true;

const delay = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function applyDrawingMode() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.setIgnoreMouseEvents(!drawingMode, { forward: true });
  sendToRenderer(MODE_CHANNEL, drawingMode);
}

function setDrawingMode(nextMode) {
  drawingMode = Boolean(nextMode);
  applyDrawingMode();

  if (drawingMode && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
    mainWindow.focus();
  }
}

function setOverlayVisible(visible) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (visible) {
    if (drawingMode) {
      mainWindow.show();
    } else {
      mainWindow.showInactive();
    }

    mainWindow.setAlwaysOnTop(true, WINDOW_LEVEL);
    applyDrawingMode();

    if (drawingMode) {
      mainWindow.focus();
    }
  } else {
    mainWindow.hide();
  }

  sendToRenderer(VISIBILITY_CHANNEL, visible);
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.bounds;

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    title: 'Fatih Kalem',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    focusable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAlwaysOnTop(true, WINDOW_LEVEL);
  mainWindow.setIgnoreMouseEvents(!drawingMode, { forward: true });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html')).catch((error) => {
    console.error('[Fatih Kalem] Arayüz yüklenemedi.', error);
  });
}

function registerGlobalShortcuts() {
  const registrations = [
    [MODE_SHORTCUT, () => setDrawingMode(!drawingMode)],
    [VISIBILITY_SHORTCUT, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        setOverlayVisible(!mainWindow.isVisible());
      }
    }],
    [QUIT_SHORTCUT, () => app.quit()]
  ];

  for (const [accelerator, handler] of registrations) {
    const registered = globalShortcut.register(accelerator, handler);
    if (!registered) {
      console.warn(`[Fatih Kalem] Global kısayol kaydedilemedi: ${accelerator}`);
    }
  }
}

function isTrustedSender(event) {
  return Boolean(
    mainWindow
    && !mainWindow.isDestroyed()
    && event.sender === mainWindow.webContents
  );
}

function assertTrustedSender(event) {
  if (!isTrustedSender(event)) {
    throw new Error('Yetkisiz istek.');
  }
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function safePngName(rawName) {
  const fallbackStem = `fatih-kalem-${timestamp()}`;

  if (typeof rawName !== 'string' || rawName.trim().length === 0) {
    return `${fallbackStem}.png`;
  }

  const base = path.basename(rawName.trim()).replace(/\.[^.]*$/, '');
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  return `${(cleaned || fallbackStem).slice(0, 96)}.png`;
}

async function capturePrimaryDisplay() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null;
  }

  const display = screen.getPrimaryDisplay();
  const wasVisible = mainWindow.isVisible();
  const hadFocus = mainWindow.isFocused();

  try {
    if (wasVisible) {
      mainWindow.hide();
      await delay(180);
    }

    const thumbnailSize = {
      width: Math.max(1, Math.round(display.size.width * display.scaleFactor)),
      height: Math.max(1, Math.round(display.size.height * display.scaleFactor))
    };

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize,
      fetchWindowIcons: false
    });

    const source = sources.find((item) => String(item.display_id) === String(display.id)) || sources[0];
    if (!source || source.thumbnail.isEmpty()) {
      return null;
    }

    const imageSize = source.thumbnail.getSize();

    return {
      dataUrl: source.thumbnail.toDataURL(),
      width: imageSize.width,
      height: imageSize.height
    };
  } catch (error) {
    console.error('[Fatih Kalem] Ekran görüntüsü alınamadı.', error);
    return null;
  } finally {
    if (mainWindow && !mainWindow.isDestroyed() && wasVisible) {
      mainWindow.showInactive();
      mainWindow.setAlwaysOnTop(true, WINDOW_LEVEL);
      mainWindow.setIgnoreMouseEvents(!drawingMode, { forward: true });

      if (hadFocus && drawingMode) {
        mainWindow.focus();
      }
    }
  }
}

async function savePng(event, payload) {
  assertTrustedSender(event);

  if (!payload || typeof payload.dataUrl !== 'string' || !payload.dataUrl.startsWith(PNG_DATA_PREFIX)) {
    return { saved: false, error: 'Geçersiz görüntü verisi.' };
  }

  if (payload.dataUrl.length > MAX_PNG_DATA_URL_LENGTH) {
    return { saved: false, error: 'Görüntü dosyası çok büyük.' };
  }

  let buffer;
  try {
    buffer = Buffer.from(payload.dataUrl.slice(PNG_DATA_PREFIX.length), 'base64');
  } catch (error) {
    console.error('[Fatih Kalem] PNG verisi çözülemedi.', error);
    return { saved: false, error: 'Görüntü verisi okunamadı.' };
  }

  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return { saved: false, error: 'Geçersiz PNG verisi.' };
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return { saved: false, error: 'Pencere kullanılamıyor.' };
  }

  const suggestedName = safePngName(payload.suggestedName);
  const defaultPath = path.join(app.getPath('pictures'), suggestedName);
  const targetWindow = mainWindow;

  targetWindow.setAlwaysOnTop(false);

  try {
    const result = await dialog.showSaveDialog(targetWindow, {
      title: 'PNG olarak kaydet',
      defaultPath,
      buttonLabel: 'Kaydet',
      filters: [
        { name: 'PNG görüntüsü', extensions: ['png'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { saved: false, canceled: true };
    }

    await fs.writeFile(result.filePath, buffer);
    return { saved: true, filePath: result.filePath };
  } catch (error) {
    console.error('[Fatih Kalem] PNG kaydedilemedi.', error);
    return { saved: false, error: 'PNG kaydedilemedi.' };
  } finally {
    if (!targetWindow.isDestroyed()) {
      targetWindow.setAlwaysOnTop(true, WINDOW_LEVEL);
      targetWindow.setIgnoreMouseEvents(!drawingMode, { forward: true });
    }
  }
}

function registerIpcHandlers() {
  ipcMain.handle('overlay:get-state', (event) => {
    assertTrustedSender(event);
    return {
      drawingMode,
      visible: Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible())
    };
  });

  ipcMain.handle('capture:primary', async (event) => {
    assertTrustedSender(event);
    return capturePrimaryDisplay();
  });

  ipcMain.handle('export:save-png', (event, payload) => savePng(event, payload));
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      setOverlayVisible(true);
    }
  });

  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.fatihkalem.overlay');
    }

    Menu.setApplicationMenu(null);
    registerIpcHandlers();
    createWindow();
    registerGlobalShortcuts();
  }).catch((error) => {
    console.error('[Fatih Kalem] Uygulama başlatılamadı.', error);
    app.quit();
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

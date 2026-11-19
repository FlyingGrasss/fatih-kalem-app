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
const WEBM_SIGNATURE = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const MAX_PNG_DATA_URL_LENGTH = 120 * 1024 * 1024;
const MAX_IMAGE_FILE_BYTES = 40 * 1024 * 1024;
const MAX_PROJECT_DATA_LENGTH = 200 * 1024 * 1024;
const MAX_RECORDING_BYTES = 1024 * 1024 * 1024;
const PROJECT_EXTENSION = 'fkproj';
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
const IMAGE_MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp'
};

let mainWindow = null;
let drawingMode = true;
let forceClose = false;
let closeRequestSequence = 0;
let pendingCloseRequest = null;
let closeModeState = null;

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

function restoreCloseMode() {
  if (!closeModeState) {
    return;
  }

  const { wasVisible, wasDrawingMode } = closeModeState;
  closeModeState = null;

  if (!wasDrawingMode) {
    setDrawingMode(false);
  }

  if (!wasVisible && mainWindow && !mainWindow.isDestroyed()) {
    setOverlayVisible(false);
  }
}

function requestCloseConfirmation() {
  if (!mainWindow || mainWindow.isDestroyed() || pendingCloseRequest) {
    return;
  }

  if (mainWindow.webContents.isLoadingMainFrame()) {
    forceClose = true;
    setImmediate(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
    });
    return;
  }

  const wasVisible = mainWindow.isVisible();
  const wasDrawingMode = drawingMode;

  closeModeState = { wasVisible, wasDrawingMode };

  if (!wasVisible) {
    setOverlayVisible(true);
  }

  // The native confirmation is a DOM dialog. Briefly allow pointer input so it
  // is usable even when the overlay was locked in click-through mode.
  if (!drawingMode) {
    setDrawingMode(true);
  }

  mainWindow.setAlwaysOnTop(true, WINDOW_LEVEL);
  mainWindow.focus();

  const requestId = ++closeRequestSequence;
  pendingCloseRequest = { requestId };
  sendToRenderer('app:confirm-close', { requestId });
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

  // The renderer keeps the authoritative dirty flag. Its beforeunload guard is
  // ignored only after the custom confirmation flow explicitly allowed closing.
  mainWindow.webContents.on('will-prevent-unload', (event) => {
    if (forceClose) {
      event.preventDefault();
    }
  });

  mainWindow.on('close', (event) => {
    if (forceClose) {
      return;
    }

    event.preventDefault();
    requestCloseConfirmation();
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
    pendingCloseRequest = null;
    closeModeState = null;
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Fatih Kalem] Renderer süreci kapandı.', details);
    forceClose = true;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    } else {
      app.quit();
    }
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

function safeFileName(rawName, extension, fallbackStem) {
  if (typeof rawName !== 'string' || rawName.trim().length === 0) {
    return `${fallbackStem}.${extension}`;
  }

  const base = path.basename(rawName.trim()).replace(/\.[^.]*$/, '');
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  return `${(cleaned || fallbackStem).slice(0, 96)}.${extension}`;
}

function safePngName(rawName) {
  return safeFileName(rawName, 'png', `fatih-kalem-${timestamp()}`);
}

async function withDialog(targetWindow, action) {
  const wasAlwaysOnTop = targetWindow.isAlwaysOnTop();
  targetWindow.setAlwaysOnTop(false);

  try {
    return await action();
  } finally {
    if (!targetWindow.isDestroyed()) {
      if (wasAlwaysOnTop) {
        targetWindow.setAlwaysOnTop(true, WINDOW_LEVEL);
      }
      targetWindow.setIgnoreMouseEvents(!drawingMode, { forward: true });
    }
  }
}

async function capturePrimaryDisplay() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null;
  }

  const display = screen.getDisplayMatching(mainWindow.getBounds());
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

  try {
    return await withDialog(targetWindow, async () => {
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
    });
  } catch (error) {
    console.error('[Fatih Kalem] PNG kaydedilemedi.', error);
    return { saved: false, error: 'PNG kaydedilemedi.' };
  }
}

async function openBackgroundImage(event) {
  assertTrustedSender(event);

  if (!mainWindow || mainWindow.isDestroyed()) {
    return { error: 'Pencere kullanılamıyor.' };
  }

  const targetWindow = mainWindow;

  try {
    return await withDialog(targetWindow, async () => {
      const result = await dialog.showOpenDialog(targetWindow, {
        title: 'Arka plan görseli seç',
        buttonLabel: 'Yükle',
        properties: ['openFile'],
        filters: [
          { name: 'Görseller', extensions: IMAGE_EXTENSIONS }
        ]
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { canceled: true };
      }

      const filePath = result.filePaths[0];
      const extension = path.extname(filePath).toLowerCase();
      const mimeType = IMAGE_MIME_BY_EXTENSION[extension];

      if (!mimeType) {
        return { error: 'Desteklenmeyen görsel türü.' };
      }

      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return { error: 'Seçilen yol bir dosya değil.' };
      }

      if (stats.size > MAX_IMAGE_FILE_BYTES) {
        return { error: 'Görsel dosyası çok büyük (en fazla 40 MB).' };
      }

      const buffer = await fs.readFile(filePath);

      return {
        dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
        name: path.basename(filePath),
        size: stats.size
      };
    });
  } catch (error) {
    console.error('[Fatih Kalem] Görsel açılamadı.', error);
    return { error: 'Görsel dosyası okunamadı.' };
  }
}

async function saveProject(event, payload) {
  assertTrustedSender(event);

  if (!payload || typeof payload.content !== 'string' || payload.content.length === 0) {
    return { saved: false, error: 'Geçersiz proje verisi.' };
  }

  if (payload.content.length > MAX_PROJECT_DATA_LENGTH) {
    return { saved: false, error: 'Proje dosyası çok büyük.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(payload.content);
  } catch {
    return { saved: false, error: 'Proje verisi JSON değil.' };
  }

  if (!parsed || parsed.app !== 'fatih-kalem' || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    return { saved: false, error: 'Geçersiz proje biçimi.' };
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return { saved: false, error: 'Pencere kullanılamıyor.' };
  }

  const suggestedName = safeFileName(
    payload.suggestedName,
    PROJECT_EXTENSION,
    `fatih-kalem-${timestamp()}`
  );
  const defaultPath = path.join(app.getPath('documents'), suggestedName);
  const targetWindow = mainWindow;

  try {
    return await withDialog(targetWindow, async () => {
      const result = await dialog.showSaveDialog(targetWindow, {
        title: 'Projeyi kaydet',
        defaultPath,
        buttonLabel: 'Kaydet',
        filters: [
          { name: 'Fatih Kalem projesi', extensions: [PROJECT_EXTENSION] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { saved: false, canceled: true };
      }

      await fs.writeFile(result.filePath, payload.content, 'utf8');
      return { saved: true, filePath: result.filePath };
    });
  } catch (error) {
    console.error('[Fatih Kalem] Proje kaydedilemedi.', error);
    return { saved: false, error: 'Proje kaydedilemedi.' };
  }
}

async function openProjectFile(event) {
  assertTrustedSender(event);

  if (!mainWindow || mainWindow.isDestroyed()) {
    return { error: 'Pencere kullanılamıyor.' };
  }

  const targetWindow = mainWindow;

  try {
    return await withDialog(targetWindow, async () => {
      const result = await dialog.showOpenDialog(targetWindow, {
        title: 'Proje aç',
        buttonLabel: 'Aç',
        properties: ['openFile'],
        filters: [
          { name: 'Fatih Kalem projesi', extensions: [PROJECT_EXTENSION] }
        ]
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { canceled: true };
      }

      const filePath = result.filePaths[0];
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return { error: 'Seçilen yol bir dosya değil.' };
      }

      if (stats.size > MAX_PROJECT_DATA_LENGTH) {
        return { error: 'Proje dosyası çok büyük.' };
      }

      const content = await fs.readFile(filePath, 'utf8');
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        return { error: 'Proje dosyası okunamadı.' };
      }

      if (!parsed || parsed.app !== 'fatih-kalem' || !Array.isArray(parsed.pages)) {
        return { error: 'Geçersiz proje dosyası.' };
      }

      return { opened: true, content, filePath };
    });
  } catch (error) {
    console.error('[Fatih Kalem] Proje açılamadı.', error);
    return { error: 'Proje dosyası okunamadı.' };
  }
}

function bufferFromBinary(data) {
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  return null;
}

async function saveRecording(event, payload) {
  assertTrustedSender(event);

  if (!payload) {
    return { saved: false, error: 'Geçersiz kayıt verisi.' };
  }

  const buffer = bufferFromBinary(payload.data);

  if (!buffer || buffer.length < WEBM_SIGNATURE.length) {
    return { saved: false, error: 'Kayıt verisi okunamadı.' };
  }

  if (buffer.length > MAX_RECORDING_BYTES) {
    return { saved: false, error: 'Kayıt dosyası çok büyük.' };
  }

  if (!buffer.subarray(0, WEBM_SIGNATURE.length).equals(WEBM_SIGNATURE)) {
    return { saved: false, error: 'Geçersiz WebM verisi.' };
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return { saved: false, error: 'Pencere kullanılamıyor.' };
  }

  const suggestedName = safeFileName(
    payload.suggestedName,
    'webm',
    `fatih-kalem-kayit-${timestamp()}`
  );
  const defaultPath = path.join(app.getPath('videos'), suggestedName);
  const targetWindow = mainWindow;

  try {
    return await withDialog(targetWindow, async () => {
      const result = await dialog.showSaveDialog(targetWindow, {
        title: 'Ekran kaydını kaydet',
        defaultPath,
        buttonLabel: 'Kaydet',
        filters: [
          { name: 'WebM video', extensions: ['webm'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { saved: false, canceled: true };
      }

      await fs.writeFile(result.filePath, buffer);
      return { saved: true, filePath: result.filePath };
    });
  } catch (error) {
    console.error('[Fatih Kalem] Kayıt dosyası yazılamadı.', error);
    return { saved: false, error: 'Kayıt dosyası yazılamadı.' };
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

  ipcMain.handle('overlay:set-mode', (event, enabled) => {
    assertTrustedSender(event);
    setDrawingMode(Boolean(enabled));
    return { drawingMode };
  });

  ipcMain.handle('capture:primary', async (event) => {
    assertTrustedSender(event);
    return capturePrimaryDisplay();
  });

  ipcMain.handle('export:save-png', (event, payload) => savePng(event, payload));
  ipcMain.handle('dialog:open-image', (event) => openBackgroundImage(event));
  ipcMain.handle('project:save', (event, payload) => saveProject(event, payload));
  ipcMain.handle('project:open', (event) => openProjectFile(event));
  ipcMain.handle('recording:save', (event, payload) => saveRecording(event, payload));

  ipcMain.on('app:close-response', (event, payload) => {
    if (!isTrustedSender(event) || !pendingCloseRequest) {
      return;
    }

    if (!payload || typeof payload !== 'object') {
      return;
    }

    const requestId = Number(payload.requestId);
    if (requestId !== pendingCloseRequest.requestId) {
      return;
    }

    const shouldClose = payload.close === true;
    pendingCloseRequest = null;

    if (shouldClose) {
      closeModeState = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        forceClose = true;
        mainWindow.close();
      }
    } else {
      restoreCloseMode();
    }
  });
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

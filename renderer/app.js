'use strict';

(() => {
  const bridge = window.fatihKalem || null;

  const byId = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Eksik DOM öğesi: #${id}`);
    }
    return element;
  };

  const toolStrip = byId('toolStrip');
  const toolbar = byId('toolbar');
  const toolbarGrip = byId('toolbarGrip');
  const modeStatus = byId('modeStatus');
  const modeText = byId('modeText');
  const shapeBtn = byId('shapeBtn');
  const shapeBtnLabel = byId('shapeBtnLabel');
  const shapePanel = byId('shapePanel');
  const shapeClose = byId('shapeClose');
  const shapeGrid = byId('shapeGrid');
  const pressureToggle = byId('pressureToggle');
  const pagePrev = byId('pagePrev');
  const pageNext = byId('pageNext');
  const pageMenuBtn = byId('pageMenuBtn');
  const pageLabel = byId('pageLabel');
  const dirtyDot = byId('dirtyDot');
  const pagePanel = byId('pagePanel');
  const pageClose = byId('pageClose');
  const pageAdd = byId('pageAdd');
  const pageImage = byId('pageImage');
  const pageCapture = byId('pageCapture');
  const pageBackgroundClear = byId('pageBackgroundClear');
  const pageDuplicate = byId('pageDuplicate');
  const pageDelete = byId('pageDelete');
  const pageStatus = byId('pageStatus');
  const projectSave = byId('projectSave');
  const projectOpen = byId('projectOpen');
  const styleBtn = byId('styleBtn');
  const colorDot = byId('colorDot');
  const styleSummary = byId('styleSummary');
  const stylePanel = byId('stylePanel');
  const styleClose = byId('styleClose');
  const paletteGrid = byId('paletteGrid');
  const penWidthGroup = byId('penWidthGroup');
  const eraserGroup = byId('eraserGroup');
  const undoBtn = byId('undoBtn');
  const redoBtn = byId('redoBtn');
  const clearBtn = byId('clearBtn');
  const curtainBtn = byId('curtainBtn');
  const exportBtn = byId('exportBtn');
  const recordBtn = byId('recordBtn');
  const recordLabel = byId('recordLabel');
  const recIndicator = byId('recIndicator');
  const settingsBtn = byId('settingsBtn');
  const settingsPanel = byId('settingsPanel');
  const settingsClose = byId('settingsClose');
  const smoothingToggle = byId('smoothingToggle');
  const flashToggle = byId('flashToggle');
  const lockToggle = byId('lockToggle');
  const lockHint = byId('lockHint');
  const dockLeft = byId('dockLeft');
  const dockRight = byId('dockRight');
  const collapseBtn = byId('collapseBtn');
  const stage = byId('stage');
  const bgCanvas = byId('bgCanvas');
  const drawCanvas = byId('drawCanvas');
  const previewCanvas = byId('previewCanvas');
  const laserCanvas = byId('laserCanvas');
  const brushCursor = byId('brushCursor');
  const curtain = byId('curtain');
  const curtainTop = byId('curtainTop');
  const curtainBottom = byId('curtainBottom');
  const curtainLeft = byId('curtainLeft');
  const curtainRight = byId('curtainRight');
  const curtainWindow = byId('curtainWindow');
  const curtainResize = byId('curtainResize');
  const toastRegion = byId('toastRegion');
  const flashOverlay = byId('flashOverlay');
  const clearDialog = byId('clearDialog');
  const clearCancel = byId('clearCancel');
  const clearConfirm = byId('clearConfirm');
  const unsavedDialog = byId('unsavedDialog');
  const unsavedDesc = byId('unsavedDesc');
  const unsavedCancel = byId('unsavedCancel');
  const unsavedDiscard = byId('unsavedDiscard');
  const unsavedSave = byId('unsavedSave');

  const ctx = drawCanvas.getContext('2d');
  const previewCtx = previewCanvas.getContext('2d');
  const bgCtx = bgCanvas.getContext('2d');
  const laserCtx = laserCanvas.getContext('2d');
  const highlightCanvas = document.createElement('canvas');
  const highlightCtx = highlightCanvas.getContext('2d');

  if (!ctx || !previewCtx || !bgCtx || !laserCtx || !highlightCtx) {
    console.error('[Fatih Kalem] Canvas 2D bağlamı oluşturulamadı.');
    return;
  }

  const COLORS = [
    { hex: '#18181b', name: 'Siyah' },
    { hex: '#ffffff', name: 'Beyaz' },
    { hex: '#71717a', name: 'Gri' },
    { hex: '#a1a1aa', name: 'Açık gri' },
    { hex: '#b91c1c', name: 'Koyu kırmızı' },
    { hex: '#ef4444', name: 'Kırmızı' },
    { hex: '#ea580c', name: 'Turuncu' },
    { hex: '#f59e0b', name: 'Hardal' },
    { hex: '#facc15', name: 'Sarı' },
    { hex: '#84cc16', name: 'Fıstık yeşili' },
    { hex: '#22c55e', name: 'Yeşil' },
    { hex: '#15803d', name: 'Koyu yeşil' },
    { hex: '#14b8a6', name: 'Turkuaz' },
    { hex: '#06b6d4', name: 'Camgöbeği' },
    { hex: '#0ea5e9', name: 'Gök mavisi' },
    { hex: '#2563eb', name: 'Mavi' },
    { hex: '#1e3a8a', name: 'Lacivert' },
    { hex: '#6366f1', name: 'İndigo' },
    { hex: '#7c3aed', name: 'Mor' },
    { hex: '#a855f7', name: 'Açık mor' },
    { hex: '#d946ef', name: 'Fuşya' },
    { hex: '#ec4899', name: 'Pembe' },
    { hex: '#f43f5e', name: 'Gül' },
    { hex: '#92400e', name: 'Kahverengi' }
  ];

  const PEN_WIDTHS = [2, 4, 8];
  const HIGHLIGHT_WIDTHS = [16, 26, 38];
  const HIGHLIGHTER_ALPHA = 0.3;
  const ERASER_SIZES = [24, 48];
  const MAX_HISTORY = 30;
  const MAX_PAGES = 60;
  const MAX_TOASTS = 3;
  const TOAST_MS = 3800;
  const TOAST_LEAVE_MS = 170;
  const LASER_LIFETIME_MS = 1200;
  const LASER_MAX_POINTS = 320;
  const RECORD_FPS = 10;
  const RECORD_LIMIT_MS = 10 * 60 * 1000;
  const RECORD_WARN_MS = 9 * 60 * 1000;
  const RECORD_MAX_WIDTH = 1920;
  const RECORD_MAX_HEIGHT = 1080;
  const MAX_PROJECT_CONTENT_LENGTH = 200 * 1024 * 1024;
  const MAX_BACKGROUND_DATA_URL_LENGTH = 90 * 1024 * 1024;
  const PROJECT_VERSION = 1;
  const SHAPE_TOOLS = new Set(['line', 'arrow', 'rect', 'ellipse', 'triangle', 'star', 'dashed-rect']);
  const SHAPE_LABELS = {
    line: 'Çizgi',
    arrow: 'Ok',
    rect: 'Dikdörtgen',
    ellipse: 'Elips',
    triangle: 'Üçgen',
    star: 'Yıldız',
    'dashed-rect': 'Kesikli'
  };
  const SHAPE_SHORTCUTS = {
    line: 'L',
    arrow: 'A',
    rect: 'R',
    ellipse: 'O',
    triangle: 'T',
    star: 'Y',
    'dashed-rect': 'K'
  };
  const TOOL_SHORTCUTS = {
    p: 'pen',
    h: 'highlighter',
    e: 'eraser',
    g: 'laser',
    l: 'line',
    a: 'arrow',
    r: 'rect',
    o: 'ellipse',
    t: 'triangle',
    y: 'star',
    k: 'dashed-rect'
  };
  const SECTION_LABELS = {
    draw: 'çizim araçları',
    shapes: 'şekiller',
    pages: 'sayfalar',
    history: 'geçmiş',
    actions: 'işlemler'
  };
  const VALID_TOOLS = new Set(['pen', 'highlighter', 'eraser', 'laser', ...SHAPE_TOOLS]);
  const VALID_FREE_TOOLS = new Set(['pen', 'highlighter', 'eraser']);

  const state = {
    tool: 'pen',
    color: '#18181b',
    colorName: 'Siyah',
    penWidth: 4,
    eraserSize: 24,
    drawingMode: true,
    curtain: false,
    smoothing: true,
    flash: true,
    pressure: false
  };

  const view = {
    width: 0,
    height: 0,
    dpr: 1
  };

  let pageSequence = 0;
  let pages = [makePage()];
  let pageIndex = 0;
  let dirty = false;

  let activePointer = null;
  let stroke = null;
  let pendingUndo = null;
  let exporting = false;
  let backgroundBusy = false;
  let projectBusy = false;
  let unsavedContext = null;
  let flashTimer = 0;
  let fitFrame = 0;
  let toolbarFitFrame = 0;
  let curtainLayout = null;
  let curtainDrag = null;
  let toolbarDrag = null;

  let laserPoints = [];
  let laserRaf = 0;

  let recording = null;

  const backgroundCache = new Map();
  const panelAnchors = new Map([
    [stylePanel, styleBtn],
    [shapePanel, shapeBtn],
    [pagePanel, pageMenuBtn],
    [settingsPanel, settingsBtn]
  ]);

  function clamp(value, min, max) {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function makePage() {
    pageSequence += 1;
    return {
      id: pageSequence,
      strokes: [],
      background: null,
      undo: [],
      redo: []
    };
  }

  function currentPage() {
    return pages[pageIndex] || null;
  }

  function penWidthIndex() {
    const index = PEN_WIDTHS.indexOf(state.penWidth);
    return index === -1 ? 1 : index;
  }

  function widthLabel() {
    return ['İnce', 'Orta', 'Kalın'][penWidthIndex()];
  }

  function activeStrokeWidth() {
    if (state.tool === 'eraser') {
      return state.eraserSize;
    }
    if (state.tool === 'highlighter') {
      return HIGHLIGHT_WIDTHS[penWidthIndex()];
    }
    return state.penWidth;
  }

  function isTypingTarget(target) {
    return target instanceof Element
      && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function pressureScale(pressure) {
    return 0.4 + clamp(Number.isFinite(pressure) ? pressure : 0.5, 0, 1) * 1.2;
  }

  function normalizePressure(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? clamp(numeric, 0, 1) : 0.5;
  }

  function requestToolbarFit() {
    if (toolbarFitFrame !== 0) {
      return;
    }

    toolbarFitFrame = window.requestAnimationFrame(() => {
      toolbarFitFrame = 0;
      keepToolbarInStrip();
    });
  }

  function showToast(message, tone = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tone}`;
    toast.textContent = message;
    toastRegion.append(toast);

    while (toastRegion.children.length > MAX_TOASTS) {
      toastRegion.firstElementChild?.remove();
    }

    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), TOAST_LEAVE_MS);
    }, TOAST_MS);
  }

  function fileStamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Görüntü yüklenemedi.'));
      image.src = source;
    });
  }

  function downloadDataUrl(dataUrl, fileName) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Palette and style ------------------------------------------------------

  function buildPalette() {
    const fragment = document.createDocumentFragment();

    for (const color of COLORS) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch';
      swatch.dataset.color = color.hex;
      swatch.style.setProperty('--swatch', color.hex);
      swatch.setAttribute('aria-label', color.name);
      swatch.setAttribute('aria-pressed', String(color.hex === state.color));
      swatch.title = color.name;
      fragment.append(swatch);
    }

    paletteGrid.replaceChildren(fragment);
  }

  function updateStyleUI() {
    penWidthGroup.querySelectorAll('[data-pen-width]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.penWidth) === state.penWidth));
    });

    eraserGroup.querySelectorAll('[data-eraser-size]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.eraserSize) === state.eraserSize));
    });

    colorDot.style.backgroundColor = state.color;
    styleSummary.textContent = `${state.colorName} · ${widthLabel()}`;
    styleBtn.setAttribute('aria-label', `Renk ve kalınlık: ${state.colorName}, ${widthLabel()}`);

    paletteGrid.querySelectorAll('.swatch').forEach((swatch) => {
      swatch.setAttribute('aria-pressed', String(swatch.dataset.color === state.color));
    });

    updateBrushCursor();
  }

  function setColor(hex) {
    const choice = COLORS.find((color) => color.hex === hex);
    if (!choice) {
      return;
    }

    state.color = choice.hex;
    state.colorName = choice.name;
    updateStyleUI();
  }

  function updateSettingsUI() {
    smoothingToggle.setAttribute('aria-checked', String(state.smoothing));
    flashToggle.setAttribute('aria-checked', String(state.flash));
    pressureToggle.setAttribute('aria-checked', String(state.pressure));

    lockToggle.textContent = state.drawingMode ? 'Kilitle' : 'Kilidi aç';
    lockToggle.classList.toggle('is-locked', !state.drawingMode);
    lockHint.textContent = state.drawingMode
      ? 'Tıklamaları anında alt uygulamaya geçirir; kaplama gizlenmez.'
      : 'Kilitli. Çizim moduna dönmek için Ctrl+Alt+K kullanın.';
  }

  // Page state -------------------------------------------------------------

  function markDirty() {
    if (!dirty) {
      dirty = true;
      document.title = 'Fatih Kalem •';
    }
    updatePageUI();
  }

  function markClean() {
    dirty = false;
    document.title = 'Fatih Kalem';
    updatePageUI();
  }

  function updatePageUI() {
    const page = currentPage();
    pageLabel.textContent = `${pageIndex + 1}/${pages.length}`;
    pageMenuBtn.setAttribute('aria-label', `Sayfalar, sayfa ${pageIndex + 1} / ${pages.length}`);
    pageMenuBtn.title = `Sayfalar · ${pageIndex + 1}/${pages.length}`;
    pagePrev.disabled = pageIndex === 0;
    pageNext.disabled = pageIndex === pages.length - 1;
    pageDelete.disabled = pages.length <= 1;
    pageBackgroundClear.disabled = !page || !page.background;
    dirtyDot.hidden = !dirty;

    const backgroundLabel = page && page.background
      ? (page.background.kind === 'screen' ? 'ekran görüntüsü arka planı' : 'görsel arka plan')
      : 'boş arka plan';
    pageStatus.textContent = `${pages.length} sayfa · ${pageIndex + 1}. sayfa, ${backgroundLabel} · ${dirty ? 'Kaydedilmemiş değişiklikler' : 'Değişiklik yok'}`;
    requestToolbarFit();
  }

  function ensureBackgroundLoaded(url) {
    let entry = backgroundCache.get(url);
    if (entry && entry.promise) {
      return entry.promise;
    }
    if (entry) {
      return Promise.resolve(entry.status === 'ready');
    }

    const image = new Image();
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    entry = {
      status: 'loading',
      image: null,
      promise
    };
    backgroundCache.set(url, entry);

    const finish = (loaded) => {
      entry.status = loaded ? 'ready' : 'error';
      entry.image = loaded ? image : null;
      resolvePromise(loaded);

      if (loaded) {
        const page = currentPage();
        if (page && page.background && page.background.dataUrl === url) {
          renderBackground(page);
        }
      }
    };

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = url;
    return promise;
  }

  function renderBackground(page) {
    clearSurface(bgCtx, bgCanvas);

    const background = page && page.background;
    if (!background || typeof background.dataUrl !== 'string') {
      return;
    }

    const entry = backgroundCache.get(background.dataUrl);
    if (!entry) {
      ensureBackgroundLoaded(background.dataUrl);
      return;
    }

    if (entry.status !== 'ready' || !entry.image) {
      return;
    }

    const image = entry.image;
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;

    if (!imageWidth || !imageHeight) {
      return;
    }

    const scale = Math.min(view.width / imageWidth, view.height / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    bgCtx.drawImage(
      image,
      (view.width - width) / 2,
      (view.height - height) / 2,
      width,
      height
    );
  }

  function pruneBackgroundCache() {
    const used = new Set();
    for (const page of pages) {
      if (page.background && page.background.dataUrl) {
        used.add(page.background.dataUrl);
      }
    }
    for (const url of backgroundCache.keys()) {
      if (!used.has(url)) {
        backgroundCache.delete(url);
      }
    }
  }

  function applyPageBackground(dataUrl, name, kind, image) {
    const page = currentPage();
    if (!page) {
      return;
    }

    page.background = {
      dataUrl,
      name: name || 'Arka plan',
      kind: kind === 'screen' ? 'screen' : 'image'
    };
    backgroundCache.set(dataUrl, {
      status: 'ready',
      image,
      promise: Promise.resolve(true)
    });

    markDirty();
    renderBackground(page);
    updatePageUI();
  }

  async function loadImageBackground() {
    if (backgroundBusy) {
      return;
    }

    if (!bridge || typeof bridge.openImage !== 'function') {
      showToast('Görsel seçimi bu ortamda kullanılamıyor.', 'error');
      return;
    }

    backgroundBusy = true;
    pageImage.disabled = true;

    try {
      const result = await bridge.openImage();
      if (!result || result.canceled) {
        return;
      }

      if (result.error || typeof result.dataUrl !== 'string') {
        throw new Error(result.error || 'Görsel okunamadı.');
      }

      if (result.dataUrl.length > MAX_BACKGROUND_DATA_URL_LENGTH) {
        throw new Error('Görsel dosyası çok büyük.');
      }

      const image = await loadImage(result.dataUrl);
      applyPageBackground(result.dataUrl, result.name, 'image', image);
      showToast('Görsel arka plan olarak eklendi.', 'success');
    } catch (error) {
      console.error('[Fatih Kalem] Arka plan görseli yüklenemedi.', error);
      showToast(error.message || 'Görsel yüklenemedi.', 'error');
    } finally {
      backgroundBusy = false;
      pageImage.disabled = false;
    }
  }

  async function capturePageBackground() {
    if (backgroundBusy) {
      return;
    }

    if (!bridge || typeof bridge.captureScreen !== 'function') {
      showToast('Ekran görüntüsü bu ortamda kullanılamıyor.', 'error');
      return;
    }

    backgroundBusy = true;
    pageCapture.disabled = true;
    showToast('Ekran görüntüsü alınıyor…', 'info');

    try {
      const capture = await bridge.captureScreen();
      if (!capture || typeof capture.dataUrl !== 'string') {
        throw new Error('Ekran görüntüsü alınamadı.');
      }

      if (capture.dataUrl.length > MAX_BACKGROUND_DATA_URL_LENGTH) {
        throw new Error('Ekran görüntüsü çok büyük.');
      }

      const image = await loadImage(capture.dataUrl);
      applyPageBackground(capture.dataUrl, 'Ekran görüntüsü', 'screen', image);
      flashScreen();
      showToast('Ekran görüntüsü arka plan olarak eklendi.', 'success');
    } catch (error) {
      console.error('[Fatih Kalem] Ekran arka planı alınamadı.', error);
      showToast(error.message || 'Ekran görüntüsü alınamadı.', 'error');
    } finally {
      backgroundBusy = false;
      pageCapture.disabled = false;
    }
  }  function clearPageBackground() {
    const page = currentPage();
    if (!page || !page.background) {
      return;
    }

    page.background = null;
    markDirty();
    pruneBackgroundCache();
    renderBackground(page);
    updatePageUI();
    showToast('Sayfa arka planı kaldırıldı.', 'info');
  }

  function switchPage(index) {
    const nextIndex = clamp(index, 0, pages.length - 1);
    if (nextIndex === pageIndex) {
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    clearLaserTrail();
    pageIndex = nextIndex;
    renderPage(currentPage());
    updatePageUI();
  }

  function previousPage() {
    switchPage(pageIndex - 1);
  }

  function nextPage() {
    switchPage(pageIndex + 1);
  }

  function insertPage(page) {
    if (pages.length >= MAX_PAGES) {
      showToast(`En fazla ${MAX_PAGES} sayfa eklenebilir.`, 'warning');
      return false;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    pages.splice(pageIndex + 1, 0, page);
    pageIndex += 1;
    clearLaserTrail();
    renderPage(currentPage());
    markDirty();
    updatePageUI();
    return true;
  }

  function addBlankPage() {
    if (insertPage(makePage())) {
      showToast('Yeni boş sayfa eklendi.', 'success');
    }
  }

  function cloneStroke(item) {
    if (item.kind === 'shape') {
      return {
        ...item,
        start: { ...item.start },
        end: { ...item.end }
      };
    }

    return {
      ...item,
      points: item.points.map((point) => ({ ...point }))
    };
  }

  function duplicateCurrentPage() {
    const page = currentPage();
    if (!page) {
      return;
    }

    const copy = makePage();
    copy.strokes = page.strokes.map(cloneStroke);
    copy.background = page.background
      ? { ...page.background }
      : null;

    if (insertPage(copy)) {
      showToast('Sayfa çoğaltıldı.', 'success');
    }
  }

  function deleteCurrentPage() {
    if (pages.length <= 1) {
      showToast('Son sayfa silinemez.', 'warning');
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    const removedIndex = pageIndex;
    pages.splice(pageIndex, 1);
    pageIndex = clamp(removedIndex, 0, pages.length - 1);
    pendingUndo = null;
    pruneBackgroundCache();
    clearLaserTrail();
    renderPage(currentPage());
    markDirty();
    updatePageUI();
    showToast('Sayfa silindi.', 'success');
  }

  // Canvas sizing and rendering -------------------------------------------

  function clearSurface(target, canvasElement) {
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.clearRect(0, 0, canvasElement.width, canvasElement.height);
    target.restore();
  }

  function clearPreview() {
    clearSurface(previewCtx, previewCanvas);
  }

  function clearLaserTrail() {
    laserPoints = [];
    if (laserRaf !== 0) {
      window.cancelAnimationFrame(laserRaf);
      laserRaf = 0;
    }
    clearSurface(laserCtx, laserCanvas);
  }

  function renderPage(page = currentPage()) {
    if (!page) {
      return;
    }

    renderBackground(page);
    clearSurface(ctx, drawCanvas);

    for (const item of page.strokes) {
      drawStrokeVector(ctx, item);
    }

    clearPreview();
    clearSurface(highlightCtx, highlightCanvas);
    updateHistoryButtons();
  }

  function fitCanvases() {
    const rect = stage.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const nextDpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

    if (nextWidth === view.width && nextHeight === view.height && nextDpr === view.dpr) {
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    view.width = nextWidth;
    view.height = nextHeight;
    view.dpr = nextDpr;

    const backingWidth = Math.max(1, Math.round(view.width * view.dpr));
    const backingHeight = Math.max(1, Math.round(view.height * view.dpr));

    for (const canvas of [bgCanvas, drawCanvas, previewCanvas, laserCanvas]) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }

    bgCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    previewCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    laserCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    highlightCanvas.width = backingWidth;
    highlightCanvas.height = backingHeight;
    highlightCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

    clearPreview();
    clearSurface(highlightCtx, highlightCanvas);
    clearLaserTrail();
    renderPage(currentPage());

    if (state.curtain) {
      clampCurtainToViewport();
      renderCurtain();
    }

    positionOpenPanels();
    updateBrushCursor();
  }

  function scheduleFit() {
    if (fitFrame !== 0) {
      return;
    }

    fitFrame = window.requestAnimationFrame(() => {
      fitFrame = 0;
      fitCanvases();
      keepToolbarInStrip();

      if (state.curtain) {
        clampCurtainToViewport();
        renderCurtain();
      }

      positionOpenPanels();
    });
  }

  // Vector drawing ---------------------------------------------------------

  function preparePaint(target, tool, width, color) {
    target.globalAlpha = 1;
    target.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    target.lineWidth = width;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.strokeStyle = tool === 'eraser' ? '#000000' : color;
    target.fillStyle = tool === 'eraser' ? '#000000' : color;
  }

  function resetPaint(target) {
    target.globalCompositeOperation = 'source-over';
    target.globalAlpha = 1;
  }

  function drawDot(target, point, width, color) {
    target.fillStyle = color;
    target.beginPath();
    target.arc(point.x, point.y, Math.max(width / 2, 0.5), 0, Math.PI * 2);
    target.fill();
  }

  function renderHighlightPreview() {
    clearPreview();
    previewCtx.save();
    previewCtx.globalAlpha = HIGHLIGHTER_ALPHA;
    previewCtx.drawImage(highlightCanvas, 0, 0, view.width, view.height);
    previewCtx.restore();
  }

  function drawStrokeVector(target, item) {
    if (!item || typeof item !== 'object') {
      return;
    }

    if (item.kind === 'shape') {
      drawShape(target, item.tool, item.start, item.end, item.width, item.color);
      return;
    }

    if (item.kind !== 'free' || !Array.isArray(item.points) || item.points.length === 0) {
      return;
    }

    const viewPoints = item.points.filter((point) => (
      point
      && Number.isFinite(point.x)
      && Number.isFinite(point.y)
    ));

    if (viewPoints.length === 0) {
      return;
    }

    const width = clamp(Number(item.width) || 4, 0.5, 80);
    const color = typeof item.color === 'string' ? item.color : '#18181b';
    const isEraser = item.tool === 'eraser';

    target.save();
    target.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    target.globalAlpha = item.tool === 'highlighter' ? HIGHLIGHTER_ALPHA : 1;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.strokeStyle = isEraser ? '#000000' : color;
    target.fillStyle = isEraser ? '#000000' : color;

    if (viewPoints.length === 1) {
      if (!isEraser) {
        const dotWidth = item.pressure
          ? width * pressureScale(normalizePressure(viewPoints[0].p))
          : width;
        drawDot(target, viewPoints[0], dotWidth, color);
      }
      target.restore();
      return;
    }

    if (item.pressure) {
      for (let index = 1; index < viewPoints.length; index += 1) {
        const previous = viewPoints[index - 1];
        const current = viewPoints[index];
        const averagePressure = (normalizePressure(previous.p) + normalizePressure(current.p)) / 2;
        target.lineWidth = Math.max(0.4, width * pressureScale(averagePressure));
        target.beginPath();
        target.moveTo(previous.x, previous.y);
        target.lineTo(current.x, current.y);
        target.stroke();
      }
    } else if (item.smoothing !== false) {
      const last = viewPoints[viewPoints.length - 1];
      target.lineWidth = width;
      target.beginPath();
      target.moveTo(viewPoints[0].x, viewPoints[0].y);

      let currentMid = {
        x: (viewPoints[0].x + viewPoints[1].x) / 2,
        y: (viewPoints[0].y + viewPoints[1].y) / 2
      };

      target.quadraticCurveTo(viewPoints[0].x, viewPoints[0].y, currentMid.x, currentMid.y);

      for (let index = 1; index < viewPoints.length - 1; index += 1) {
        const current = viewPoints[index];
        const next = viewPoints[index + 1];
        currentMid = {
          x: (current.x + next.x) / 2,
          y: (current.y + next.y) / 2
        };
        target.quadraticCurveTo(current.x, current.y, currentMid.x, currentMid.y);
      }

      target.quadraticCurveTo(last.x, last.y, last.x, last.y);
      target.stroke();
    } else {
      target.lineWidth = width;
      target.beginPath();
      target.moveTo(viewPoints[0].x, viewPoints[0].y);

      for (let index = 1; index < viewPoints.length; index += 1) {
        target.lineTo(viewPoints[index].x, viewPoints[index].y);
      }

      target.stroke();
    }

    target.restore();
  }

  function drawStarPath(target, left, top, width, height) {
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const outerX = width / 2;
    const outerY = height / 2;
    const innerRatio = 0.44;

    for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
      const radius = pointIndex % 2 === 0 ? 1 : innerRatio;
      const angle = -Math.PI / 2 + (pointIndex * Math.PI) / 5;
      const x = centerX + Math.cos(angle) * outerX * radius;
      const y = centerY + Math.sin(angle) * outerY * radius;

      if (pointIndex === 0) {
        target.moveTo(x, y);
      } else {
        target.lineTo(x, y);
      }
    }

    target.closePath();
  }

  function drawShape(target, tool, start, end, width, color) {
    if (!start || !end) {
      return;
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const shapeWidth = Math.abs(dx);
    const shapeHeight = Math.abs(dy);
    const lineWidth = Math.max(0.5, Number(width) || 4);

    target.save();
    target.globalCompositeOperation = 'source-over';
    target.globalAlpha = 1;
    target.lineWidth = lineWidth;
    target.strokeStyle = color || '#18181b';
    target.fillStyle = color || '#18181b';
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.setLineDash([]);

    if (tool === 'dashed-rect') {
      target.setLineDash([
        Math.max(5, lineWidth * 3),
        Math.max(4, lineWidth * 1.8)
      ]);
    }

    target.beginPath();

    if (tool === 'line' || tool === 'arrow') {
      target.moveTo(start.x, start.y);
      target.lineTo(end.x, end.y);

      if (tool === 'arrow') {
        const angle = Math.atan2(dy, dx);
        const headLength = clamp(lineWidth * 3.6, 10, 28);
        target.moveTo(end.x, end.y);
        target.lineTo(
          end.x - Math.cos(angle - Math.PI / 7) * headLength,
          end.y - Math.sin(angle - Math.PI / 7) * headLength
        );
        target.moveTo(end.x, end.y);
        target.lineTo(
          end.x - Math.cos(angle + Math.PI / 7) * headLength,
          end.y - Math.sin(angle + Math.PI / 7) * headLength
        );
      }
    } else if (tool === 'rect' || tool === 'dashed-rect') {
      target.rect(left, top, shapeWidth, shapeHeight);
    } else if (tool === 'ellipse') {
      target.ellipse(
        left + shapeWidth / 2,
        top + shapeHeight / 2,
        Math.max(shapeWidth / 2, 0.01),
        Math.max(shapeHeight / 2, 0.01),
        0,
        0,
        Math.PI * 2
      );
    } else if (tool === 'triangle') {
      target.moveTo(left + shapeWidth / 2, top);
      target.lineTo(left + shapeWidth, top + shapeHeight);
      target.lineTo(left, top + shapeHeight);
      target.closePath();
    } else if (tool === 'star') {
      drawStarPath(target, left, top, shapeWidth, shapeHeight);
    }

    target.stroke();
    target.restore();
  }

  // History ----------------------------------------------------------------

  function updateHistoryButtons() {
    const page = currentPage();
    undoBtn.disabled = activePointer !== null || !page || page.undo.length === 0;
    redoBtn.disabled = activePointer !== null || !page || page.redo.length === 0;
  }

  function pushUndoSnapshot(page = currentPage()) {
    if (!page) {
      return;
    }

    page.undo.push(page.strokes.slice());
    if (page.undo.length > MAX_HISTORY) {
      page.undo.shift();
    }

    page.redo.length = 0;
    updateHistoryButtons();
  }

  function beginPendingUndo() {
    const page = currentPage();
    pendingUndo = page ? page.strokes.slice() : null;
  }

  function commitPendingUndo() {
    const page = currentPage();
    if (page && pendingUndo) {
      page.undo.push(pendingUndo);
      if (page.undo.length > MAX_HISTORY) {
        page.undo.shift();
      }
      page.redo.length = 0;
    }

    pendingUndo = null;
    markDirty();
    updateHistoryButtons();
  }

  function discardPendingUndo() {
    pendingUndo = null;
    updateHistoryButtons();
  }

  function undo() {
    if (activePointer !== null) {
      return;
    }

    const page = currentPage();
    if (!page || page.undo.length === 0) {
      return;
    }

    page.redo.push(page.strokes.slice());
    if (page.redo.length > MAX_HISTORY) {
      page.redo.shift();
    }

    page.strokes = page.undo.pop();
    renderPage(page);
    markDirty();
    updateHistoryButtons();
  }

  function redo() {
    if (activePointer !== null) {
      return;
    }

    const page = currentPage();
    if (!page || page.redo.length === 0) {
      return;
    }

    page.undo.push(page.strokes.slice());
    if (page.undo.length > MAX_HISTORY) {
      page.undo.shift();
    }

    page.strokes = page.redo.pop();
    renderPage(page);
    markDirty();
    updateHistoryButtons();
  }

  function clearAllDrawings() {
    if (activePointer !== null) {
      abortStroke();
    }

    const page = currentPage();
    if (!page) {
      return;
    }

    pushUndoSnapshot(page);
    page.strokes = [];
    page.redo.length = 0;
    clearLaserTrail();
    renderPage(page);
    markDirty();
    updateHistoryButtons();
  }

  // Freehand and shape input ----------------------------------------------

  function beginFreehand(point, event) {
    const tool = state.tool;
    const width = activeStrokeWidth();
    const pressureMode = tool === 'pen' && state.pressure && event.pointerType === 'pen';
    const pointPressure = clamp(
      typeof event.pressure === 'number' && Number.isFinite(event.pressure)
        ? event.pressure
        : 0.5,
      0,
      1
    );

    const firstPoint = {
      x: point.x,
      y: point.y,
      p: pressureMode ? pointPressure : 0.5
    };

    if (tool === 'highlighter') {
      clearSurface(highlightCtx, highlightCanvas);
      preparePaint(highlightCtx, 'pen', width, state.color);
      drawDot(highlightCtx, point, width, state.color);
      renderHighlightPreview();
    } else {
      preparePaint(ctx, tool, width, state.color);
      if (tool !== 'eraser') {
        const dotWidth = pressureMode ? width * pressureScale(pointPressure) : width;
        drawDot(ctx, point, dotWidth, state.color);
      }
    }

    stroke = {
      kind: 'free',
      tool,
      color: state.color,
      width,
      points: [firstPoint],
      pressure: pressureMode,
      smoothing: state.smoothing,
      last: { ...point },
      lastMid: { ...point },
      moved: false
    };
  }

  function addFreehandPoint(point, pressure) {
    if (!stroke || stroke.kind !== 'free') {
      return;
    }

    if (
      Math.abs(point.x - stroke.last.x) < 0.1
      && Math.abs(point.y - stroke.last.y) < 0.1
    ) {
      return;
    }

    if (stroke.points.length >= 20000) {
      return;
    }

    const pointPressure = stroke.pressure
      ? clamp(Number.isFinite(pressure) ? pressure : 0.5, 0, 1)
      : 0.5;
    const previous = stroke.points[stroke.points.length - 1];
    const target = stroke.tool === 'highlighter' ? highlightCtx : ctx;

    if (stroke.pressure) {
      const segmentWidth = stroke.width * pressureScale((previous.p + pointPressure) / 2);
      target.lineWidth = segmentWidth;
      target.beginPath();
      target.moveTo(stroke.last.x, stroke.last.y);
      target.lineTo(point.x, point.y);
      target.stroke();
    } else if (stroke.smoothing) {
      const mid = {
        x: (stroke.last.x + point.x) / 2,
        y: (stroke.last.y + point.y) / 2
      };

      target.lineWidth = stroke.width;
      target.beginPath();
      target.moveTo(stroke.lastMid.x, stroke.lastMid.y);
      target.quadraticCurveTo(stroke.last.x, stroke.last.y, mid.x, mid.y);
      target.stroke();
      stroke.lastMid = mid;
    } else {
      target.lineWidth = stroke.width;
      target.beginPath();
      target.moveTo(stroke.last.x, stroke.last.y);
      target.lineTo(point.x, point.y);
      target.stroke();
    }

    stroke.points.push({
      x: point.x,
      y: point.y,
      p: pointPressure
    });
    stroke.last = { ...point };
    stroke.moved = true;
  }

  function finishFreehand() {
    if (!stroke || stroke.kind !== 'free') {
      return;
    }

    const current = stroke;
    const {
      tool,
      width,
      color,
      last,
      lastMid,
      moved
    } = current;

    if (tool === 'eraser' && !moved) {
      resetPaint(ctx);
      discardPendingUndo();
      return;
    }

    if (tool === 'highlighter') {
      if (moved && current.smoothing) {
        highlightCtx.lineWidth = width;
        highlightCtx.beginPath();
        highlightCtx.moveTo(lastMid.x, lastMid.y);
        highlightCtx.quadraticCurveTo(last.x, last.y, last.x, last.y);
        highlightCtx.stroke();
      }

      currentPage().strokes.push({
        kind: 'free',
        tool,
        color,
        width,
        pressure: false,
        smoothing: current.smoothing,
        points: current.points
      });

      commitPendingUndo();

      ctx.save();
      ctx.globalAlpha = HIGHLIGHTER_ALPHA;
      ctx.drawImage(highlightCanvas, 0, 0, view.width, view.height);
      ctx.restore();
      resetPaint(ctx);
      clearPreview();
      clearSurface(highlightCtx, highlightCanvas);
      return;
    }

    if (moved && current.smoothing && !current.pressure) {
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
      ctx.stroke();
    }

    currentPage().strokes.push({
      kind: 'free',
      tool,
      color,
      width,
      pressure: current.pressure,
      smoothing: current.smoothing,
      points: current.points
    });

    resetPaint(ctx);
    commitPendingUndo();
  }

  function beginShape(point) {
    stroke = {
      kind: 'shape',
      tool: state.tool,
      color: state.color,
      width: state.penWidth,
      start: { ...point },
      end: { ...point }
    };
    renderShapePreview();
  }

  function renderShapePreview() {
    clearPreview();
    if (!stroke || stroke.kind !== 'shape') {
      return;
    }
    drawShape(previewCtx, stroke.tool, stroke.start, stroke.end, stroke.width, stroke.color);
  }

  function updateShape(point) {
    if (!stroke || stroke.kind !== 'shape') {
      return;
    }
    stroke.end = { ...point };
    renderShapePreview();
  }

  function finishShape() {
    if (!stroke || stroke.kind !== 'shape') {
      return;
    }

    const dx = stroke.end.x - stroke.start.x;
    const dy = stroke.end.y - stroke.start.y;
    const tooSmall = stroke.tool === 'line' || stroke.tool === 'arrow'
      ? Math.hypot(dx, dy) < 2
      : Math.abs(dx) < 2 || Math.abs(dy) < 2;

    if (tooSmall) {
      clearPreview();
      discardPendingUndo();
      return;
    }

    drawShape(ctx, stroke.tool, stroke.start, stroke.end, stroke.width, stroke.color);
    resetPaint(ctx);
    clearPreview();

    currentPage().strokes.push({
      kind: 'shape',
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      start: stroke.start,
      end: stroke.end
    });

    commitPendingUndo();
  }

  function releaseDrawPointer(pointerId) {
    try {
      if (drawCanvas.hasPointerCapture(pointerId)) {
        drawCanvas.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture may already be gone.
    }
  }

  function finishStroke() {
    const pointerId = activePointer;

    if (stroke) {
      if (stroke.kind === 'free') {
        finishFreehand();
      } else if (stroke.kind === 'shape') {
        finishShape();
      }
    }

    stroke = null;
    activePointer = null;

    if (pointerId !== null) {
      releaseDrawPointer(pointerId);
    }

    updateHistoryButtons();
  }

  function abortStroke() {
    const pointerId = activePointer;

    if (!stroke) {
      activePointer = null;
      if (pointerId !== null) {
        releaseDrawPointer(pointerId);
      }
      updateHistoryButtons();
      return;
    }

    if (stroke.kind === 'laser') {
      stroke = null;
    } else if (stroke.kind === 'shape') {
      clearPreview();
      discardPendingUndo();
      stroke = null;
    } else if (stroke.tool === 'highlighter') {
      clearPreview();
      clearSurface(highlightCtx, highlightCanvas);
      discardPendingUndo();
      stroke = null;
    } else {
      finishFreehand();
      stroke = null;
    }

    activePointer = null;

    if (pointerId !== null) {
      releaseDrawPointer(pointerId);
    }

    updateHistoryButtons();
  }

  function onPointerDown(event) {
    if (!state.drawingMode || state.curtain || activePointer !== null) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if (isAnyPanelOpen()) {
      closePanels(false);
      return;
    }

    const point = pointFromEvent(event);

    activePointer = event.pointerId;

    try {
      drawCanvas.setPointerCapture(event.pointerId);
    } catch {
      // Drawing still works without pointer capture.
    }

    event.preventDefault();

    if (state.tool === 'laser') {
      stroke = { kind: 'laser' };
      beginLaser(point);
      updateHistoryButtons();
      return;
    }

    beginPendingUndo();
    updateHistoryButtons();

    if (SHAPE_TOOLS.has(state.tool)) {
      beginShape(point);
    } else {
      beginFreehand(point, event);
    }
  }

  function onPointerMove(event) {
    if (activePointer === null || !stroke || event.pointerId !== activePointer) {
      return;
    }

    if (stroke.kind === 'laser') {
      addLaserPoint(pointFromEvent(event));
      return;
    }

    if (stroke.kind === 'shape') {
      updateShape(pointFromEvent(event));
      return;
    }

    const samples = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents()
      : [event];
    const points = samples.length > 0 ? samples : [event];

    for (const sample of points) {
      addFreehandPoint(pointFromEvent(sample), sample.pressure);
    }

    if (stroke && stroke.tool === 'highlighter') {
      renderHighlightPreview();
    }
  }

  function onPointerUp(event) {
    if (activePointer === null || !stroke || event.pointerId !== activePointer) {
      return;
    }
    finishStroke();
  }

  function onPointerCancel(event) {
    if (activePointer === null || event.pointerId !== activePointer) {
      return;
    }
    abortStroke();
  }

  // Laser pointer ----------------------------------------------------------

  function beginLaser(point) {
    laserPoints = [{
      x: point.x,
      y: point.y,
      t: performance.now()
    }];
    clearSurface(laserCtx, laserCanvas);
    startLaserAnimation();
  }

  function addLaserPoint(point) {
    const now = performance.now();
    const last = laserPoints[laserPoints.length - 1];

    if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.2) {
      return;
    }

    laserPoints.push({
      x: point.x,
      y: point.y,
      t: now
    });

    if (laserPoints.length > LASER_MAX_POINTS) {
      laserPoints.splice(0, laserPoints.length - LASER_MAX_POINTS);
    }
  }

  function drawLaser(now) {
    clearSurface(laserCtx, laserCanvas);

    const alive = laserPoints.filter((point) => now - point.t < LASER_LIFETIME_MS);
    if (alive.length === 0) {
      return false;
    }

    const passes = [
      { width: 17, alpha: 0.16, blur: 22 },
      { width: 8.5, alpha: 0.4, blur: 12 },
      { width: 3.2, alpha: 0.96, blur: 0 }
    ];

    laserCtx.save();
    laserCtx.lineCap = 'round';
    laserCtx.lineJoin = 'round';
    laserCtx.strokeStyle = '#ff1f3d';
    laserCtx.fillStyle = '#ff5a6e';
    laserCtx.shadowColor = '#ff1f3d';

    for (const pass of passes) {
      laserCtx.shadowBlur = pass.blur;

      for (let index = 1; index < alive.length; index += 1) {
        const previous = alive[index - 1];
        const current = alive[index];
        const life = clamp(1 - (now - current.t) / LASER_LIFETIME_MS, 0, 1);
        if (life <= 0) {
          continue;
        }

        laserCtx.globalAlpha = life * pass.alpha;
        laserCtx.lineWidth = Math.max(0.4, pass.width * (0.45 + life * 0.55));
        laserCtx.beginPath();
        laserCtx.moveTo(previous.x, previous.y);
        laserCtx.lineTo(current.x, current.y);
        laserCtx.stroke();
      }

      const head = alive[alive.length - 1];
      const headLife = clamp(1 - (now - head.t) / LASER_LIFETIME_MS, 0, 1);
      if (headLife > 0) {
        laserCtx.globalAlpha = headLife * pass.alpha;
        laserCtx.beginPath();
        laserCtx.arc(head.x, head.y, Math.max(1, pass.width * 0.34), 0, Math.PI * 2);
        laserCtx.fill();
      }
    }

    laserCtx.restore();
    return true;
  }

  function startLaserAnimation() {
    if (laserRaf !== 0) {
      return;
    }

    const step = () => {
      const now = performance.now();
      laserPoints = laserPoints.filter((point) => now - point.t < LASER_LIFETIME_MS);
      const active = drawLaser(now);

      if (active) {
        laserRaf = window.requestAnimationFrame(step);
      } else {
        laserRaf = 0;
        clearSurface(laserCtx, laserCanvas);
      }
    };

    laserRaf = window.requestAnimationFrame(step);
  }

  // Panels -----------------------------------------------------------------

  function isAnyPanelOpen() {
    for (const panel of panelAnchors.keys()) {
      if (!panel.hidden) {
        return true;
      }
    }
    return false;
  }

  function closePanels(restoreFocus = false) {
    let active = null;

    for (const [panel, anchor] of panelAnchors) {
      if (panel.hidden) {
        continue;
      }

      active = { panel, anchor };
      panel.hidden = true;
      anchor.setAttribute('aria-expanded', 'false');
    }

    if (restoreFocus && active) {
      active.anchor.focus({ preventScroll: true });
    }
  }

  function positionPanel(panel) {
    if (panel.hidden) {
      return;
    }

    const anchor = panelAnchors.get(panel);
    if (!anchor) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 8;

    const left = clamp(
      anchorRect.left,
      margin,
      Math.max(margin, window.innerWidth - panelRect.width - margin)
    );

    let top = anchorRect.bottom + 8;
    if (top + panelRect.height > window.innerHeight - margin) {
      top = Math.max(margin, anchorRect.top - panelRect.height - 8);
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function positionOpenPanels() {
    for (const panel of panelAnchors.keys()) {
      if (!panel.hidden) {
        positionPanel(panel);
      }
    }
  }

  function openPanel(panel) {
    closePanels(false);
    panel.hidden = false;

    const anchor = panelAnchors.get(panel);
    if (anchor) {
      anchor.setAttribute('aria-expanded', 'true');
    }

    positionPanel(panel);

    const focusTarget = panel.querySelector('.panel-head .icon-btn');
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
  }

  function togglePanel(panel) {
    if (!panel.hidden) {
      closePanels(false);
    } else {
      openPanel(panel);
    }
  }

  // Tools ------------------------------------------------------------------

  function shapeLabel(tool) {
    return SHAPE_LABELS[tool] || 'Şekiller';
  }

  function updateShapeUI() {
    shapeGrid.querySelectorAll('[data-shape]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.shape === state.tool));
    });

    const isShape = SHAPE_TOOLS.has(state.tool);
    shapeBtn.setAttribute('aria-pressed', String(isShape));
    shapeBtnLabel.textContent = isShape ? shapeLabel(state.tool) : 'Şekiller';
    shapeBtn.title = isShape
      ? `${shapeLabel(state.tool)} (${SHAPE_SHORTCUTS[state.tool]}) · Şekil menüsü`
      : 'Şekiller (L)';
    requestToolbarFit();
  }

  function setTool(tool) {
    if (!VALID_TOOLS.has(tool) || activePointer !== null) {
      return;
    }

    if (isAnyPanelOpen()) {
      closePanels(false);
    }

    state.tool = tool;

    document.querySelectorAll('[data-tool]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    });

    updateShapeUI();
    stage.dataset.tool = tool;
    updateBrushCursor();
  }

  function updateBrushCursor() {
    if (!state.drawingMode || state.curtain) {
      brushCursor.hidden = true;
      return;
    }

    const isLaser = state.tool === 'laser';
    const size = isLaser ? 14 : Math.max(8, Math.round(activeStrokeWidth()) + 2);

    brushCursor.classList.toggle('is-laser', isLaser);
    brushCursor.style.width = `${size}px`;
    brushCursor.style.height = `${size}px`;
  }

  function pointFromEvent(event) {
    const rect = drawCanvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  // Curtain ----------------------------------------------------------------

  function ensureCurtainLayout() {
    if (!curtainLayout) {
      const width = Math.min(760, Math.max(220, view.width * 0.64));
      const height = Math.min(520, Math.max(160, view.height * 0.56));
      curtainLayout = {
        left: Math.round((view.width - width) / 2),
        top: Math.round((view.height - height) / 2),
        width: Math.round(width),
        height: Math.round(height)
      };
    }

    clampCurtainToViewport();
  }

  function clampCurtainToViewport() {
    if (!curtainLayout) {
      return;
    }

    const margin = 8;
    const maxWidth = Math.max(80, view.width - margin * 2);
    const maxHeight = Math.max(80, view.height - margin * 2);
    const minWidth = Math.min(160, maxWidth);
    const minHeight = Math.min(120, maxHeight);

    curtainLayout.width = clamp(curtainLayout.width, minWidth, maxWidth);
    curtainLayout.height = clamp(curtainLayout.height, minHeight, maxHeight);
    curtainLayout.left = clamp(curtainLayout.left, margin, Math.max(margin, view.width - curtainLayout.width - margin));
    curtainLayout.top = clamp(curtainLayout.top, margin, Math.max(margin, view.height - curtainLayout.height - margin));
  }

  function renderCurtain() {
    if (!curtainLayout) {
      return;
    }

    const { left, top, width, height } = curtainLayout;

    curtainWindow.style.left = `${left}px`;
    curtainWindow.style.top = `${top}px`;
    curtainWindow.style.width = `${width}px`;
    curtainWindow.style.height = `${height}px`;

    curtainTop.style.cssText = `left:0;top:0;right:0;height:${top}px`;
    curtainBottom.style.cssText = `left:0;top:${top + height}px;right:0;bottom:0`;
    curtainLeft.style.cssText = `left:0;top:${top}px;width:${left}px;height:${height}px`;
    curtainRight.style.cssText = `left:${left + width}px;top:${top}px;right:0;height:${height}px`;
  }

  function openCurtain() {
    if (state.curtain) {
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    closePanels(false);

    state.curtain = true;
    curtain.hidden = false;
    curtainBtn.setAttribute('aria-pressed', 'true');
    brushCursor.hidden = true;
    ensureCurtainLayout();
    renderCurtain();
    curtainWindow.focus({ preventScroll: true });
    showToast('Perde açık. Kapatmak için Esc.', 'info');
  }

  function closeCurtain(restoreFocus = true) {
    if (!state.curtain) {
      return;
    }

    if (curtainDrag) {
      releaseCurtainPointer(curtainDrag.pointerId);
      curtainDrag = null;
    }

    state.curtain = false;
    curtain.hidden = true;
    curtainBtn.setAttribute('aria-pressed', 'false');

    if (restoreFocus) {
      curtainBtn.focus({ preventScroll: true });
    } else {
      // Avoid leaving a visible focus ring after a pointer toggle.
      curtainBtn.blur();
    }

    updateBrushCursor();
  }

  function toggleCurtain() {
    if (state.curtain) {
      closeCurtain(false);
    } else {
      openCurtain();
    }
  }

  function releaseCurtainPointer(pointerId) {
    try {
      if (curtainWindow.hasPointerCapture(pointerId)) {
        curtainWindow.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture may already be gone.
    }
  }

  function beginCurtainDrag(event) {
    if (!state.curtain || curtainDrag || !curtainLayout) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    curtainDrag = {
      mode: event.target === curtainResize ? 'resize' : 'move',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      base: { ...curtainLayout }
    };

    try {
      curtainWindow.setPointerCapture(event.pointerId);
    } catch {
      // Dragging still works while the pointer stays over the window.
    }

    curtainWindow.focus({ preventScroll: true });
  }

  function moveCurtainDrag(event) {
    if (!curtainDrag || !curtainLayout || event.pointerId !== curtainDrag.pointerId) {
      return;
    }

    event.preventDefault();
    const dx = event.clientX - curtainDrag.startX;
    const dy = event.clientY - curtainDrag.startY;
    const margin = 8;

    if (curtainDrag.mode === 'move') {
      const maxLeft = Math.max(margin, view.width - curtainLayout.width - margin);
      const maxTop = Math.max(margin, view.height - curtainLayout.height - margin);
      curtainLayout.left = clamp(curtainDrag.base.left + dx, margin, maxLeft);
      curtainLayout.top = clamp(curtainDrag.base.top + dy, margin, maxTop);
    } else {
      const maxWidth = Math.max(80, view.width - curtainLayout.left - margin);
      const maxHeight = Math.max(80, view.height - curtainLayout.top - margin);
      curtainLayout.width = clamp(curtainDrag.base.width + dx, Math.min(160, maxWidth), maxWidth);
      curtainLayout.height = clamp(curtainDrag.base.height + dy, Math.min(120, maxHeight), maxHeight);
    }

    renderCurtain();
  }

  function endCurtainDrag(event) {
    if (!curtainDrag || event.pointerId !== curtainDrag.pointerId) {
      return;
    }

    const pointerId = curtainDrag.pointerId;
    curtainDrag = null;
    releaseCurtainPointer(pointerId);
  }

  function handleCurtainKeydown(event) {
    if (!state.curtain || !curtainLayout) {
      return;
    }

    const step = event.altKey ? 40 : 12;
    const resize = event.shiftKey;
    let handled = true;

    switch (event.key) {
      case 'ArrowLeft':
        if (resize) {
          curtainLayout.width -= step;
        } else {
          curtainLayout.left -= step;
        }
        break;
      case 'ArrowRight':
        if (resize) {
          curtainLayout.width += step;
        } else {
          curtainLayout.left += step;
        }
        break;
      case 'ArrowUp':
        if (resize) {
          curtainLayout.height -= step;
        } else {
          curtainLayout.top -= step;
        }
        break;
      case 'ArrowDown':
        if (resize) {
          curtainLayout.height += step;
        } else {
          curtainLayout.top += step;
        }
        break;
      default:
        handled = false;
    }

    if (!handled) {
      return;
    }

    event.preventDefault();
    clampCurtainToViewport();
    renderCurtain();
  }

  // Toolbar ----------------------------------------------------------------

  function updateDockButtons() {
    dockLeft.setAttribute('aria-pressed', String(toolbar.dataset.dock === 'left'));
    dockRight.setAttribute('aria-pressed', String(toolbar.dataset.dock === 'right'));
  }

  function keepToolbarInStrip() {
    const rect = toolbar.getBoundingClientRect();
    const width = toolbar.offsetWidth;
    const height = toolbar.offsetHeight;
    const stripHeight = toolStrip.clientHeight;
    let left = rect.left;

    if (toolbar.dataset.dock === 'left') {
      left = 10;
    } else if (toolbar.dataset.dock === 'right') {
      left = window.innerWidth - width - 10;
    }

    left = clamp(left, 4, Math.max(4, window.innerWidth - width - 4));
    const top = clamp(rect.top, 4, Math.max(4, stripHeight - height - 4));

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }

  function setDock(side) {
    if (side !== 'left' && side !== 'right') {
      return;
    }

    toolbar.dataset.dock = side;
    updateDockButtons();
    closePanels(false);
    keepToolbarInStrip();
  }

  function beginToolbarDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const rect = toolbar.getBoundingClientRect();
    toolbarDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseLeft: rect.left,
      baseTop: rect.top
    };

    toolbar.dataset.dock = 'free';
    updateDockButtons();
    closePanels(false);
    toolbar.style.left = `${rect.left}px`;
    toolbar.style.top = `${rect.top}px`;

    try {
      toolbarGrip.setPointerCapture(event.pointerId);
    } catch {
      // Dragging still works while the pointer stays over the grip.
    }

    event.preventDefault();
  }

  function moveToolbar(event) {
    if (!toolbarDrag || event.pointerId !== toolbarDrag.pointerId) {
      return;
    }

    const width = toolbar.offsetWidth;
    const height = toolbar.offsetHeight;
    const stripHeight = toolStrip.clientHeight;
    const left = clamp(
      toolbarDrag.baseLeft + event.clientX - toolbarDrag.startX,
      4,
      Math.max(4, window.innerWidth - width - 4)
    );
    const top = clamp(
      toolbarDrag.baseTop + event.clientY - toolbarDrag.startY,
      4,
      Math.max(4, stripHeight - height - 4)
    );

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  }

  function releaseToolbarPointer(pointerId) {
    try {
      if (toolbarGrip.hasPointerCapture(pointerId)) {
        toolbarGrip.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture may already be gone.
    }
  }

  function endToolbarDrag(event) {
    if (!toolbarDrag || event.pointerId !== toolbarDrag.pointerId) {
      return;
    }

    const pointerId = toolbarDrag.pointerId;
    toolbarDrag = null;
    releaseToolbarPointer(pointerId);

    const rect = toolbar.getBoundingClientRect();
    const rightEdge = window.innerWidth - rect.right;

    if (rect.left <= 24) {
      toolbar.dataset.dock = 'left';
    } else if (rightEdge <= 24) {
      toolbar.dataset.dock = 'right';
    }

    updateDockButtons();
    keepToolbarInStrip();
  }

  function setCollapsed(collapsed) {
    toolbar.dataset.collapsed = String(collapsed);
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.setAttribute('aria-label', collapsed ? 'Araç çubuğunu genişlet' : 'Araç çubuğunu daralt');
    collapseBtn.title = collapsed ? 'Genişlet' : 'Daralt';
    closePanels(false);

    window.requestAnimationFrame(() => {
      keepToolbarInStrip();
    });
  }

  function toggleSection(section) {
    const collapsed = section.dataset.collapsed !== 'true';
    section.dataset.collapsed = String(collapsed);
    closePanels(false);

    const toggle = section.querySelector('[data-section-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      const label = SECTION_LABELS[section.dataset.section] || 'bölüm';
      toggle.title = collapsed ? `${label} bölümünü genişlet` : `${label} bölümünü daralt`;
      toggle.setAttribute('aria-label', toggle.title);
    }

    window.requestAnimationFrame(() => {
      keepToolbarInStrip();
    });
  }

  // Drawing mode -----------------------------------------------------------

  function applyDrawingModeUI() {
    document.body.classList.toggle('is-drawing', state.drawingMode);
    document.body.classList.toggle('is-click-through', !state.drawingMode);

    modeStatus.dataset.on = String(state.drawingMode);
    modeText.textContent = state.drawingMode ? 'Çizim' : 'Tıklama geçir';
    modeStatus.title = state.drawingMode
      ? 'Çizim modu açık · Ctrl+Alt+K ile tıklamayı geçir'
      : 'Tıklama geçir modu · Ctrl+Alt+K ile çizime dön';

    if (!state.drawingMode) {
      brushCursor.hidden = true;
      closePanels(false);

      if (stroke) {
        abortStroke();
      }
    }

    updateSettingsUI();
    updateBrushCursor();
    window.requestAnimationFrame(() => {
      keepToolbarInStrip();
    });
  }

  function setLocked(locked) {
    if (!bridge || typeof bridge.setDrawingMode !== 'function') {
      return;
    }

    bridge.setDrawingMode(!locked).catch((error) => {
      console.warn('[Fatih Kalem] Kilit durumu değiştirilemedi.', error);
      showToast('Kilit durumu değiştirilemedi.', 'error');
    });
  }

  function loadBridgeState() {
    if (!bridge || typeof bridge.getState !== 'function') {
      return;
    }

    bridge.getState().then((snapshot) => {
      if (snapshot && typeof snapshot.drawingMode === 'boolean') {
        state.drawingMode = snapshot.drawingMode;
        applyDrawingModeUI();
      }
    }).catch((error) => {
      console.warn('[Fatih Kalem] Başlangıç durumu okunamadı.', error);
    });
  }

  function handleConfirmClose(request) {
    if (!bridge || typeof bridge.respondToClose !== 'function') {
      return;
    }

    const requestId = Number(request && request.requestId);
    if (!Number.isFinite(requestId)) {
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    requestUnsavedConfirmation({
      description: 'Kapatmadan önce kaydedilmemiş değişikliklerinizi kaydetmek ister misiniz?',
      saveLabel: 'Kaydet ve çık',
      discardLabel: 'Kaydetmeden çık',
      onDiscard: () => bridge.respondToClose(requestId, true),
      onCancel: () => bridge.respondToClose(requestId, false)
    });
  }

  function subscribeToBridge() {
    if (!bridge) {
      return;
    }

    if (typeof bridge.onModeChange === 'function') {
      bridge.onModeChange((enabled) => {
        state.drawingMode = Boolean(enabled);
        applyDrawingModeUI();
      });
    }

    if (typeof bridge.onVisibilityChange === 'function') {
      bridge.onVisibilityChange((visible) => {
        if (!visible) {
          brushCursor.hidden = true;
        }
      });
    }

    if (typeof bridge.onConfirmClose === 'function') {
      bridge.onConfirmClose(handleConfirmClose);
    }
  }

  // Screenshot flash -------------------------------------------------------

  function flashScreen() {
    if (!state.flash) {
      return;
    }

    flashOverlay.hidden = false;
    flashOverlay.classList.remove('is-flashing');
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add('is-flashing');

    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      flashOverlay.hidden = true;
      flashOverlay.classList.remove('is-flashing');
    }, 360);
  }

  // PNG export -------------------------------------------------------------

  async function exportPng() {
    if (exporting) {
      return;
    }

    exporting = true;
    exportBtn.disabled = true;
    exportBtn.setAttribute('aria-busy', 'true');

    const page = currentPage();
    const hasBackground = Boolean(page && page.background);
    let captureFailed = false;
    let backgroundFailed = false;

    try {
      let output = null;
      let outputCtx = null;

      if (page && page.background && typeof page.background.dataUrl === 'string') {
        const loaded = await ensureBackgroundLoaded(page.background.dataUrl);
        if (!loaded) {
          backgroundFailed = true;
        } else {
          renderBackground(page);
          output = document.createElement('canvas');
          output.width = drawCanvas.width;
          output.height = drawCanvas.height;
          outputCtx = output.getContext('2d');

          if (outputCtx) {
            outputCtx.drawImage(bgCanvas, 0, 0);
            outputCtx.drawImage(drawCanvas, 0, 0);
          } else {
            output = null;
          }
        }
      } else if (bridge && typeof bridge.captureScreen === 'function') {
        let capture = null;

        try {
          capture = await bridge.captureScreen();
        } catch (error) {
          console.warn('[Fatih Kalem] Ekran görüntüsü alınamadı.', error);
          capture = null;
        }

        if (capture && typeof capture.dataUrl === 'string') {
          flashScreen();
          const image = await loadImage(capture.dataUrl).catch(() => null);

          if (image) {
            const width = image.naturalWidth || capture.width || drawCanvas.width;
            const height = image.naturalHeight || capture.height || drawCanvas.height;
            output = document.createElement('canvas');
            output.width = Math.max(1, width);
            output.height = Math.max(1, height);
            outputCtx = output.getContext('2d');

            if (outputCtx) {
              outputCtx.drawImage(image, 0, 0, output.width, output.height);

              const stageRect = stage.getBoundingClientRect();
              const scaleX = output.width / Math.max(1, window.innerWidth);
              const scaleY = output.height / Math.max(1, window.innerHeight);

              outputCtx.drawImage(
                drawCanvas,
                0,
                Math.round(stageRect.top * scaleY),
                Math.round(stageRect.width * scaleX),
                Math.round(stageRect.height * scaleY)
              );
            } else {
              output = null;
            }
          } else {
            captureFailed = true;
          }
        } else {
          captureFailed = true;
        }
      } else {
        captureFailed = true;
      }

      if (!output || !outputCtx) {
        output = document.createElement('canvas');
        output.width = drawCanvas.width;
        output.height = drawCanvas.height;
        outputCtx = output.getContext('2d');

        if (!outputCtx) {
          throw new Error('Çıktı canvas bağlamı oluşturulamadı.');
        }

        outputCtx.drawImage(drawCanvas, 0, 0);
      }

      const dataUrl = output.toDataURL('image/png');
      const suggestedName = `fatih-kalem-sayfa-${pageIndex + 1}-${fileStamp()}.png`;

      let result = null;
      if (bridge && typeof bridge.savePng === 'function') {
        result = await bridge.savePng(dataUrl, suggestedName);
      } else {
        downloadDataUrl(dataUrl, suggestedName);
        result = { saved: true };
      }

      if (!result || result.canceled) {
        showToast('Kaydetme iptal edildi.', 'info');
        return;
      }

      if (result.saved) {
        if (backgroundFailed) {
          showToast('Arka plan yüklenemedi; sayfa yalnızca çizimlerle kaydedildi.', 'warning');
        } else if (captureFailed && !hasBackground) {
          showToast('Ekran görüntüsü alınamadı; yalnızca çizim katmanı kaydedildi.', 'warning');
        } else {
          showToast('PNG kaydedildi.', 'success');
        }
      } else {
        showToast(result.error || 'PNG kaydedilemedi.', 'error');
      }
    } catch (error) {
      console.error('[Fatih Kalem] PNG dışa aktarma başarısız.', error);
      showToast('PNG oluşturulamadı.', 'error');
    } finally {
      exporting = false;
      exportBtn.disabled = false;
      exportBtn.removeAttribute('aria-busy');
    }
  }

  // Project save and open --------------------------------------------------

  function serializeStroke(item) {
    if (item.kind === 'shape') {
      return {
        kind: 'shape',
        tool: item.tool,
        color: item.color,
        width: round(item.width),
        start: { x: round(item.start.x), y: round(item.start.y) },
        end: { x: round(item.end.x), y: round(item.end.y) }
      };
    }

    return {
      kind: 'free',
      tool: item.tool,
      color: item.color,
      width: round(item.width),
      pressure: Boolean(item.pressure),
      smoothing: item.smoothing !== false,
      points: item.points.map((point) => ({
        x: round(point.x),
        y: round(point.y),
        p: round(normalizePressure(point.p), 3)
      }))
    };
  }

  function buildProject() {
    return {
      app: 'fatih-kalem',
      version: PROJECT_VERSION,
      createdAt: new Date().toISOString(),
      settings: {
        smoothing: state.smoothing,
        flash: state.flash,
        pressure: state.pressure
      },
      activePage: pageIndex,
      pages: pages.map((page) => ({
        background: page.background
          ? {
            dataUrl: page.background.dataUrl,
            name: page.background.name,
            kind: page.background.kind
          }
          : null,
        strokes: page.strokes.map(serializeStroke)
      }))
    };
  }

  function isSafePoint(point) {
    return Boolean(
      point
      && Number.isFinite(point.x)
      && Number.isFinite(point.y)
      && Math.abs(point.x) < 100000
      && Math.abs(point.y) < 100000
    );
  }

  function validateStroke(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.tool !== 'string') {
      return null;
    }

    if (typeof raw.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(raw.color)) {
      return null;
    }

    const width = Number(raw.width);
    if (!Number.isFinite(width) || width < 0.5 || width > 80) {
      return null;
    }

    if (raw.kind === 'shape') {
      if (!SHAPE_TOOLS.has(raw.tool) || !isSafePoint(raw.start) || !isSafePoint(raw.end)) {
        return null;
      }

      return {
        kind: 'shape',
        tool: raw.tool,
        color: raw.color,
        width,
        start: { x: raw.start.x, y: raw.start.y },
        end: { x: raw.end.x, y: raw.end.y }
      };
    }

    if (!VALID_FREE_TOOLS.has(raw.tool) || !Array.isArray(raw.points)) {
      return null;
    }

    if (raw.points.length === 0 || raw.points.length > 20000) {
      return null;
    }

    const points = [];

    for (const point of raw.points) {
      if (!isSafePoint(point)) {
        return null;
      }

      points.push({
        x: point.x,
        y: point.y,
        p: normalizePressure(point.p)
      });
    }

    return {
      kind: 'free',
      tool: raw.tool,
      color: raw.color,
      width,
      pressure: Boolean(raw.pressure),
      smoothing: raw.smoothing !== false,
      points
    };
  }

  function validateProject(content) {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    if (!parsed || parsed.app !== 'fatih-kalem' || !Array.isArray(parsed.pages)) {
      return null;
    }

    if (parsed.pages.length === 0 || parsed.pages.length > MAX_PAGES) {
      return null;
    }

    const projectPages = [];
    let totalPoints = 0;
    let totalBackgroundCharacters = 0;

    for (const rawPage of parsed.pages) {
      if (!rawPage || typeof rawPage !== 'object' || !Array.isArray(rawPage.strokes)) {
        return null;
      }

      if (rawPage.strokes.length > 5000) {
        return null;
      }

      const strokes = [];

      for (const rawStroke of rawPage.strokes) {
        const strokeItem = validateStroke(rawStroke);
        if (!strokeItem) {
          return null;
        }

        if (strokeItem.kind === 'free') {
          totalPoints += strokeItem.points.length;
          if (totalPoints > 800000) {
            return null;
          }
        }

        strokes.push(strokeItem);
      }

      let background = null;
      if (rawPage.background !== null && rawPage.background !== undefined) {
        if (typeof rawPage.background !== 'object') {
          return null;
        }

        const dataUrl = rawPage.background.dataUrl;
        if (
          typeof dataUrl !== 'string'
          || !/^data:image\/(?:png|jpeg|jpg|webp|gif|bmp);base64,/i.test(dataUrl)
          || dataUrl.length > MAX_BACKGROUND_DATA_URL_LENGTH
        ) {
          return null;
        }

        totalBackgroundCharacters += dataUrl.length;
        if (totalBackgroundCharacters > 170 * 1024 * 1024) {
          return null;
        }

        background = {
          dataUrl,
          name: typeof rawPage.background.name === 'string'
            ? rawPage.background.name.slice(0, 140)
            : 'Arka plan',
          kind: rawPage.background.kind === 'screen' ? 'screen' : 'image'
        };
      }

      projectPages.push({
        background,
        strokes
      });
    }

    const settings = parsed.settings && typeof parsed.settings === 'object'
      ? {
        smoothing: parsed.settings.smoothing !== false,
        flash: parsed.settings.flash !== false,
        pressure: Boolean(parsed.settings.pressure)
      }
      : {
        smoothing: true,
        flash: true,
        pressure: false
      };

    return {
      settings,
      activePage: clamp(Math.floor(Number(parsed.activePage)) || 0, 0, projectPages.length - 1),
      pages: projectPages
    };
  }

  function applyProject(project) {
    if (activePointer !== null) {
      abortStroke();
    }

    clearLaserTrail();
    pendingUndo = null;

    pages = project.pages.map((page) => {
      const nextPage = makePage();
      nextPage.strokes = page.strokes;
      nextPage.background = page.background;
      return nextPage;
    });

    pageIndex = clamp(project.activePage, 0, pages.length - 1);
    state.smoothing = project.settings.smoothing;
    state.flash = project.settings.flash;
    state.pressure = project.settings.pressure;

    updateSettingsUI();
    pruneBackgroundCache();
    renderPage(currentPage());
    markClean();
    closePanels(false);
    updatePageUI();
    showToast('Proje yüklendi.', 'success');
  }

  async function saveProject() {
    if (projectBusy) {
      return false;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    const project = buildProject();
    const content = JSON.stringify(project);

    if (content.length > MAX_PROJECT_CONTENT_LENGTH) {
      showToast('Proje dosyası çok büyük.', 'error');
      return false;
    }

    const suggestedName = `fatih-kalem-${fileStamp()}.fkproj`;

    if (!bridge || typeof bridge.saveProject !== 'function') {
      downloadDataUrl(
        `data:application/json;charset=utf-8,${encodeURIComponent(content)}`,
        suggestedName
      );
      markClean();
      showToast('Proje kaydedildi.', 'success');
      return true;
    }

    projectBusy = true;

    try {
      const result = await bridge.saveProject(content, suggestedName);

      if (!result || result.canceled) {
        showToast('Kaydetme iptal edildi.', 'info');
        return false;
      }

      if (result.saved) {
        markClean();
        showToast('Proje kaydedildi.', 'success');
        return true;
      }

      showToast(result.error || 'Proje kaydedilemedi.', 'error');
      return false;
    } catch (error) {
      console.error('[Fatih Kalem] Proje kaydedilemedi.', error);
      showToast('Proje kaydedilemedi.', 'error');
      return false;
    } finally {
      projectBusy = false;
    }
  }

  async function openProjectFile() {
    if (projectBusy) {
      return;
    }

    if (!bridge || typeof bridge.openProject !== 'function') {
      showToast('Proje açma bu ortamda kullanılamıyor.', 'error');
      return;
    }

    projectBusy = true;

    try {
      const result = await bridge.openProject();

      if (!result || result.canceled) {
        return;
      }

      if (!result.opened || typeof result.content !== 'string') {
        showToast(result.error || 'Proje açılamadı.', 'error');
        return;
      }

      const project = validateProject(result.content);
      if (!project) {
        showToast('Proje dosyası geçersiz veya bozuk.', 'error');
        return;
      }

      applyProject(project);
    } catch (error) {
      console.error('[Fatih Kalem] Proje açılamadı.', error);
      showToast('Proje açılamadı.', 'error');
    } finally {
      projectBusy = false;
    }
  }

  function requestOpenProject() {
    if (activePointer !== null) {
      abortStroke();
    }

    closePanels(false);
    requestUnsavedConfirmation({
      description: 'Mevcut sayfalar kaydedilmedi. Projeyi açmadan önce değişiklikleri kaydetmek ister misiniz?',
      saveLabel: 'Kaydet ve aç',
      discardLabel: 'Kaydetmeden aç',
      onDiscard: () => {
        openProjectFile();
      },
      onCancel: () => {}
    });
  }

  // Unsaved-changes confirmation ------------------------------------------

  function requestUnsavedConfirmation(options) {
    if (!dirty) {
      options.onDiscard();
      return;
    }

    if (clearDialog.open) {
      clearDialog.close();
    }

    if (unsavedDialog.open) {
      const previous = unsavedContext;
      unsavedContext = null;
      unsavedDialog.close();
      if (previous && typeof previous.onCancel === 'function') {
        previous.onCancel();
      }
    }

    unsavedContext = options;
    unsavedDesc.textContent = options.description;
    unsavedSave.textContent = options.saveLabel || 'Kaydet';
    unsavedDiscard.textContent = options.discardLabel || 'Kaydetmeden devam';

    unsavedDialog.showModal();
    unsavedCancel.focus({ preventScroll: true });
  }

  function cancelUnsavedConfirmation() {
    const context = unsavedContext;
    unsavedContext = null;

    if (unsavedDialog.open) {
      unsavedDialog.close();
    }

    if (context && typeof context.onCancel === 'function') {
      context.onCancel();
    }
  }

  function discardUnsavedChanges() {
    const context = unsavedContext;
    unsavedContext = null;

    if (unsavedDialog.open) {
      unsavedDialog.close();
    }

    if (context && typeof context.onDiscard === 'function') {
      context.onDiscard();
    }
  }

  async function saveUnsavedChanges() {
    const context = unsavedContext;
    if (!context || projectBusy) {
      return;
    }

    unsavedSave.disabled = true;
    unsavedDiscard.disabled = true;
    unsavedCancel.disabled = true;

    const saved = await saveProject();

    unsavedSave.disabled = false;
    unsavedDiscard.disabled = false;
    unsavedCancel.disabled = false;

    unsavedContext = null;

    if (unsavedDialog.open) {
      unsavedDialog.close();
    }

    if (saved) {
      if (typeof context.onDiscard === 'function') {
        context.onDiscard();
      }
    } else if (typeof context.onCancel === 'function') {
      context.onCancel();
    }
  }

  // Screen recording ------------------------------------------------------

  function chooseRecordingMime() {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    for (const candidate of candidates) {
      if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }

    return '';
  }

  function updateRecordingUI(active, busy = false) {
    recordBtn.setAttribute('aria-pressed', String(active));
    recordBtn.disabled = busy;
    recordLabel.textContent = active ? 'Durdur' : (busy ? 'Kaydediliyor' : 'Kaydet');
    recordBtn.title = active
      ? 'Kaydı durdur'
      : 'Ekran kaydı başlat (en fazla 10 dakika)';
    recIndicator.hidden = !active;
    requestToolbarFit();
  }

  function drawRecordingFrame(target, canvasElement) {
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.fillStyle = '#ffffff';
    target.fillRect(0, 0, canvasElement.width, canvasElement.height);
    target.drawImage(bgCanvas, 0, 0, canvasElement.width, canvasElement.height);
    target.drawImage(previewCanvas, 0, 0, canvasElement.width, canvasElement.height);
    target.drawImage(drawCanvas, 0, 0, canvasElement.width, canvasElement.height);
  }

  function evenDimension(value) {
    const rounded = Math.max(2, Math.round(value));
    return rounded % 2 === 0 ? rounded : rounded - 1;
  }

  async function finalizeRecording(instance) {
    if (!instance || instance.finalized) {
      return;
    }

    instance.finalized = true;

    if (recording === instance) {
      recording = null;
    }

    window.clearInterval(instance.frameTimer);
    window.clearTimeout(instance.warnTimer);
    window.clearTimeout(instance.limitTimer);

    instance.canvas.remove();
    updateRecordingUI(false, true);

    if (instance.stream) {
      for (const track of instance.stream.getTracks()) {
        track.stop();
      }
    }

    if (instance.chunks.length === 0) {
      updateRecordingUI(false, false);
      showToast('Kayıt verisi oluşmadı.', 'error');
      return;
    }

    recordBtn.setAttribute('aria-busy', 'true');
    const fileName = `fatih-kalem-kayit-${fileStamp()}.webm`;

    try {
      const blob = new Blob(instance.chunks, { type: 'video/webm' });
      let result;

      if (bridge && typeof bridge.saveRecording === 'function') {
        const buffer = await blob.arrayBuffer();
        result = await bridge.saveRecording(buffer, fileName);
      } else {
        downloadBlob(blob, fileName);
        result = { saved: true };
      }

      if (!result || result.canceled) {
        showToast('Kayıt kaydetme iptal edildi.', 'info');
      } else if (result.saved) {
        showToast('Ekran kaydı kaydedildi.', 'success');
      } else {
        showToast(result.error || 'Kayıt kaydedilemedi.', 'error');
      }
    } catch (error) {
      console.error('[Fatih Kalem] Kayıt kaydedilemedi.', error);
      showToast('Kayıt kaydedilemedi.', 'error');
    } finally {
      recordBtn.removeAttribute('aria-busy');
      updateRecordingUI(false, false);
    }
  }

  function stopRecording(options = {}) {
    const instance = recording;
    if (!instance || instance.stopping) {
      return;
    }

    instance.stopping = true;
    instance.limitReached = Boolean(options.limitReached);

    window.clearInterval(instance.frameTimer);
    window.clearTimeout(instance.warnTimer);
    window.clearTimeout(instance.limitTimer);
    updateRecordingUI(false, true);

    if (options.limitReached) {
      showToast('10 dakika sınırına ulaşıldı; kayıt durduruldu.', 'warning');
    }

    try {
      if (instance.recorder.state !== 'inactive') {
        instance.recorder.stop();
      } else {
        finalizeRecording(instance);
      }
    } catch (error) {
      console.error('[Fatih Kalem] Kayıt durdurulamadı.', error);
      finalizeRecording(instance);
    }
  }

  function startRecording() {
    if (recording) {
      return;
    }

    if (
      typeof MediaRecorder === 'undefined'
      || typeof HTMLCanvasElement.prototype.captureStream !== 'function'
    ) {
      showToast('Bu ortamda ekran kaydı desteklenmiyor.', 'error');
      return;
    }

    if (view.width < 2 || view.height < 2) {
      showToast('Kayıt alanı hazır değil.', 'warning');
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    const scale = Math.min(
      1,
      RECORD_MAX_WIDTH / (view.width * view.dpr),
      RECORD_MAX_HEIGHT / (view.height * view.dpr)
    );

    const canvasElement = document.createElement('canvas');
    canvasElement.className = 'record-canvas';
    canvasElement.width = evenDimension(view.width * view.dpr * scale);
    canvasElement.height = evenDimension(view.height * view.dpr * scale);
    document.body.append(canvasElement);

    const recordCtx = canvasElement.getContext('2d');
    if (!recordCtx) {
      canvasElement.remove();
      showToast('Kayıt tuvali oluşturulamadı.', 'error');
      return;
    }

    const mimeType = chooseRecordingMime();
    let stream;
    let recorder;

    try {
      stream = canvasElement.captureStream(RECORD_FPS);
      recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, videoBitsPerSecond: 4000000 } : { videoBitsPerSecond: 4000000 }
      );
    } catch (error) {
      console.error('[Fatih Kalem] MediaRecorder oluşturulamadı.', error);
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      canvasElement.remove();
      showToast('Ekran kaydı başlatılamadı.', 'error');
      return;
    }

    const instance = {
      recorder,
      stream,
      canvas: canvasElement,
      ctx: recordCtx,
      chunks: [],
      frameTimer: 0,
      warnTimer: 0,
      limitTimer: 0,
      stopping: false,
      finalized: false,
      limitReached: false
    };

    recording = instance;

    drawRecordingFrame(recordCtx, canvasElement);
    instance.frameTimer = window.setInterval(() => {
      if (recording === instance) {
        drawRecordingFrame(recordCtx, canvasElement);
      }
    }, 1000 / RECORD_FPS);

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        instance.chunks.push(event.data);
      }
    });

    recorder.addEventListener('stop', () => {
      finalizeRecording(instance);
    });

    recorder.addEventListener('error', (event) => {
      console.error('[Fatih Kalem] Kayıt hatası.', event.error || event);
      showToast('Kayıt sırasında bir hata oluştu.', 'error');
      stopRecording();
    });

    instance.warnTimer = window.setTimeout(() => {
      showToast('Kayıt 10 dakika sınırına yaklaşıyor. 1 dakika kaldı.', 'warning');
    }, RECORD_WARN_MS);

    instance.limitTimer = window.setTimeout(() => {
      stopRecording({ limitReached: true });
    }, RECORD_LIMIT_MS);

    try {
      recorder.start(1000);
    } catch (error) {
      console.error('[Fatih Kalem] Kayıt başlatılamadı.', error);
      window.clearInterval(instance.frameTimer);
      window.clearTimeout(instance.warnTimer);
      window.clearTimeout(instance.limitTimer);

      if (recording === instance) {
        recording = null;
      }

      for (const track of stream.getTracks()) {
        track.stop();
      }

      canvasElement.remove();
      updateRecordingUI(false, false);
      showToast('Ekran kaydı başlatılamadı.', 'error');
      return;
    }

    updateRecordingUI(true, false);
    showToast('Ekran kaydı başladı (en fazla 10 dakika).', 'info');
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // Clear dialog and keyboard ---------------------------------------------

  function openClearDialog() {
    if (clearDialog.open || unsavedDialog.open) {
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    closePanels(false);
    clearDialog.showModal();
    clearCancel.focus({ preventScroll: true });
  }

  function handleGlobalKeydown(event) {
    if (unsavedDialog.open || clearDialog.open) {
      return;
    }

    if (event.key === 'Escape') {
      let handled = false;

      if (isAnyPanelOpen()) {
        closePanels(true);
        handled = true;
      } else if (activePointer !== null) {
        abortStroke();
        handled = true;
      } else if (state.curtain) {
        closeCurtain(true);
        handled = true;
      }

      if (handled) {
        event.preventDefault();
      }
      return;
    }

    if (isTypingTarget(event.target)) {
      return;
    }

    if (event.code === 'Space') {
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      if (isAnyPanelOpen()) {
        return;
      }

      event.preventDefault();
      if (!event.repeat) {
        toggleCurtain();
      }
      return;
    }

    if (state.curtain && event.target === curtainWindow) {
      return;
    }

    const key = event.key.toLowerCase();

    if (event.ctrlKey || event.metaKey) {
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      } else if (key === 's') {
        event.preventDefault();
        saveProject();
      } else if (key === 'o') {
        event.preventDefault();
        requestOpenProject();
      }
      return;
    }

    if (event.altKey) {
      return;
    }

    if (key === 'pageup') {
      event.preventDefault();
      previousPage();
      return;
    }

    if (key === 'pagedown') {
      event.preventDefault();
      nextPage();
      return;
    }

    if (key === 'u') {
      event.preventDefault();
      undo();
      return;
    }

    const tool = TOOL_SHORTCUTS[key];
    if (tool) {
      event.preventDefault();
      setTool(tool);
    }
  }

  // Pointer cursor ---------------------------------------------------------

  function handleStagePointerMove(event) {
    if (
      event.pointerType !== 'mouse'
      || !state.drawingMode
      || state.curtain
      || isAnyPanelOpen()
      || event.target !== drawCanvas
    ) {
      brushCursor.hidden = true;
      return;
    }

    brushCursor.hidden = false;
    brushCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  }

  // Event wiring -----------------------------------------------------------

  for (const button of document.querySelectorAll('[data-tool]')) {
    button.addEventListener('click', () => setTool(button.dataset.tool || ''));
  }

  shapeGrid.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-shape]')
      : null;

    if (!button) {
      return;
    }

    const tool = button.dataset.shape || '';
    if (SHAPE_TOOLS.has(tool)) {
      setTool(tool);
    }
  });

  penWidthGroup.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-pen-width]')
      : null;

    if (!button) {
      return;
    }

    const width = Number(button.dataset.penWidth);
    if (!PEN_WIDTHS.includes(width)) {
      return;
    }

    state.penWidth = width;
    updateStyleUI();
  });

  eraserGroup.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-eraser-size]')
      : null;

    if (!button) {
      return;
    }

    const size = Number(button.dataset.eraserSize);
    if (!ERASER_SIZES.includes(size)) {
      return;
    }

    state.eraserSize = size;
    updateStyleUI();
  });

  paletteGrid.addEventListener('click', (event) => {
    const swatch = event.target instanceof Element
      ? event.target.closest('button[data-color]')
      : null;

    if (swatch) {
      setColor(swatch.dataset.color || '');
    }
  });

  styleBtn.addEventListener('click', () => togglePanel(stylePanel));
  shapeBtn.addEventListener('click', () => togglePanel(shapePanel));
  pageMenuBtn.addEventListener('click', () => togglePanel(pagePanel));
  settingsBtn.addEventListener('click', () => togglePanel(settingsPanel));

  styleClose.addEventListener('click', () => closePanels(true));
  shapeClose.addEventListener('click', () => closePanels(true));
  pageClose.addEventListener('click', () => closePanels(true));
  settingsClose.addEventListener('click', () => closePanels(true));

  document.addEventListener('pointerdown', (event) => {
    if (!isAnyPanelOpen()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    for (const [panel, anchor] of panelAnchors) {
      if (panel.contains(target) || anchor.contains(target)) {
        return;
      }
    }

    closePanels(false);
  });

  smoothingToggle.addEventListener('click', () => {
    state.smoothing = !state.smoothing;
    updateSettingsUI();
  });

  flashToggle.addEventListener('click', () => {
    state.flash = !state.flash;
    updateSettingsUI();
  });

  pressureToggle.addEventListener('click', () => {
    state.pressure = !state.pressure;
    updateSettingsUI();
  });

  lockToggle.addEventListener('click', () => {
    if (!state.drawingMode) {
      setLocked(false);
      return;
    }

    showToast('Kilitlendi. Açmak için Ctrl+Alt+K.', 'info');
    setLocked(true);
  });

  pagePrev.addEventListener('click', previousPage);
  pageNext.addEventListener('click', nextPage);
  pageAdd.addEventListener('click', addBlankPage);
  pageImage.addEventListener('click', loadImageBackground);
  pageCapture.addEventListener('click', capturePageBackground);
  pageBackgroundClear.addEventListener('click', clearPageBackground);
  pageDuplicate.addEventListener('click', duplicateCurrentPage);
  pageDelete.addEventListener('click', deleteCurrentPage);
  projectSave.addEventListener('click', saveProject);
  projectOpen.addEventListener('click', requestOpenProject);

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', openClearDialog);
  exportBtn.addEventListener('click', exportPng);
  curtainBtn.addEventListener('click', toggleCurtain);
  recordBtn.addEventListener('click', toggleRecording);

  dockLeft.addEventListener('click', () => setDock('left'));
  dockRight.addEventListener('click', () => setDock('right'));

  collapseBtn.addEventListener('click', () => {
    setCollapsed(toolbar.dataset.collapsed !== 'true');
  });

  for (const toggle of document.querySelectorAll('[data-section-toggle]')) {
    toggle.addEventListener('click', () => {
      const section = toggle.closest('.tool-section');
      if (section) {
        toggleSection(section);
      }
    });
  }

  toolbarGrip.addEventListener('pointerdown', beginToolbarDrag);
  toolbarGrip.addEventListener('pointermove', moveToolbar);
  toolbarGrip.addEventListener('pointerup', endToolbarDrag);
  toolbarGrip.addEventListener('pointercancel', endToolbarDrag);

  curtainWindow.addEventListener('pointerdown', beginCurtainDrag);
  curtainWindow.addEventListener('pointermove', moveCurtainDrag);
  curtainWindow.addEventListener('pointerup', endCurtainDrag);
  curtainWindow.addEventListener('pointercancel', endCurtainDrag);
  curtainWindow.addEventListener('keydown', handleCurtainKeydown);

  drawCanvas.addEventListener('pointerdown', onPointerDown);
  drawCanvas.addEventListener('pointermove', onPointerMove);
  drawCanvas.addEventListener('pointerup', onPointerUp);
  drawCanvas.addEventListener('pointercancel', onPointerCancel);

  stage.addEventListener('pointermove', handleStagePointerMove);
  stage.addEventListener('pointerleave', () => {
    brushCursor.hidden = true;
  });

  clearCancel.addEventListener('click', () => {
    clearDialog.close();
  });

  clearConfirm.addEventListener('click', () => {
    clearAllDrawings();
    clearDialog.close();
    showToast('Sayfa temizlendi. Geri almak için Ctrl+Z.', 'success');
  });

  clearDialog.addEventListener('close', () => {
    if (clearBtn.isConnected) {
      clearBtn.focus({ preventScroll: true });
    }
  });

  clearDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    clearDialog.close();
  });

  unsavedCancel.addEventListener('click', cancelUnsavedConfirmation);
  unsavedDiscard.addEventListener('click', discardUnsavedChanges);
  unsavedSave.addEventListener('click', saveUnsavedChanges);

  unsavedDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    cancelUnsavedConfirmation();
  });

  unsavedDialog.addEventListener('close', () => {
    if (!unsavedContext) {
      unsavedSave.disabled = false;
      unsavedDiscard.disabled = false;
      unsavedCancel.disabled = false;
    }
  });

  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('blur', () => {
    brushCursor.hidden = true;

    if (stroke) {
      abortStroke();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!dirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  });

  // Boot -------------------------------------------------------------------

  buildPalette();
  updateStyleUI();
  updateSettingsUI();
  updatePageUI();
  updateShapeUI();
  updateHistoryButtons();
  stage.dataset.tool = state.tool;
  subscribeToBridge();
  loadBridgeState();
  fitCanvases();
  applyDrawingModeUI();
  keepToolbarInStrip();

  window.requestAnimationFrame(() => {
    fitCanvases();
    keepToolbarInStrip();
    showToast('Çizim modu açık. Tıklamayı geçirmek için Ctrl+Alt+K.', 'info');
  });
})();

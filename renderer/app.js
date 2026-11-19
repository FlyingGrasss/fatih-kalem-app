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
  const dockLeft = byId('dockLeft');
  const dockRight = byId('dockRight');
  const collapseBtn = byId('collapseBtn');
  const stage = byId('stage');
  const drawCanvas = byId('drawCanvas');
  const previewCanvas = byId('previewCanvas');
  const brushCursor = byId('brushCursor');
  const curtain = byId('curtain');
  const curtainTop = byId('curtainTop');
  const curtainBottom = byId('curtainBottom');
  const curtainLeft = byId('curtainLeft');
  const curtainRight = byId('curtainRight');
  const curtainWindow = byId('curtainWindow');
  const curtainResize = byId('curtainResize');
  const toastRegion = byId('toastRegion');
  const clearDialog = byId('clearDialog');
  const clearCancel = byId('clearCancel');
  const clearConfirm = byId('clearConfirm');

  const ctx = drawCanvas.getContext('2d');
  const previewCtx = previewCanvas.getContext('2d');
  const highlightCanvas = document.createElement('canvas');
  const highlightCtx = highlightCanvas.getContext('2d');

  if (!ctx || !previewCtx || !highlightCtx) {
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
  const MAX_TOASTS = 3;
  const TOAST_MS = 3800;
  const TOAST_LEAVE_MS = 170;
  const SHAPE_TOOLS = new Set(['line', 'rect', 'ellipse']);
  const TOOL_SHORTCUTS = {
    p: 'pen',
    h: 'highlighter',
    e: 'eraser',
    l: 'line',
    r: 'rect',
    o: 'ellipse'
  };
  const VALID_TOOLS = new Set(Object.values(TOOL_SHORTCUTS));

  const state = {
    tool: 'pen',
    color: '#18181b',
    colorName: 'Siyah',
    penWidth: 4,
    eraserSize: 24,
    drawingMode: true,
    curtain: false
  };

  const view = {
    width: 0,
    height: 0,
    dpr: 1
  };

  const historyStack = [];
  const redoStack = [];

  let pendingSnapshot = null;
  let historyBusy = false;
  let historyToken = 0;
  let activePointer = null;
  let stroke = null;
  let curtainLayout = null;
  let curtainDrag = null;
  let toolbarDrag = null;
  let fitFrame = 0;
  let exporting = false;

  function clamp(value, min, max) {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
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

  function clearSurface(target, canvasElement) {
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.clearRect(0, 0, canvasElement.width, canvasElement.height);
    target.restore();
  }

  function clearPreview() {
    clearSurface(previewCtx, previewCanvas);
  }

  function updateBrushCursor() {
    if (!state.drawingMode || state.curtain) {
      brushCursor.hidden = true;
      return;
    }

    const size = Math.max(8, Math.round(activeStrokeWidth()) + 2);
    brushCursor.style.width = `${size}px`;
    brushCursor.style.height = `${size}px`;
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

    const previous = document.createElement('canvas');
    previous.width = drawCanvas.width;
    previous.height = drawCanvas.height;
    const previousCtx = previous.getContext('2d');
    const hasPrevious = previousCtx !== null && previous.width > 0 && previous.height > 0;

    if (hasPrevious) {
      previousCtx.drawImage(drawCanvas, 0, 0);
    }

    const resized = view.width > 0
      && (view.width !== nextWidth || view.height !== nextHeight || view.dpr !== nextDpr);

    view.width = nextWidth;
    view.height = nextHeight;
    view.dpr = nextDpr;

    const backingWidth = Math.max(1, Math.round(view.width * view.dpr));
    const backingHeight = Math.max(1, Math.round(view.height * view.dpr));

    drawCanvas.width = backingWidth;
    drawCanvas.height = backingHeight;
    previewCanvas.width = backingWidth;
    previewCanvas.height = backingHeight;
    highlightCanvas.width = backingWidth;
    highlightCanvas.height = backingHeight;

    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    previewCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    highlightCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

    if (hasPrevious) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, backingWidth, backingHeight);
      ctx.restore();
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    }

    clearPreview();

    if (state.curtain) {
      clampCurtainToViewport();
      renderCurtain();
    }

    if (!stylePanel.hidden) {
      positionStylePanel();
    }

    if (resized) {
      historyToken += 1;
      historyBusy = false;
      historyStack.length = 0;
      redoStack.length = 0;
      pendingSnapshot = null;
      updateHistoryButtons();
    }

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

      if (!stylePanel.hidden) {
        positionStylePanel();
      }
    });
  }

  function snapshotCanvas() {
    try {
      return drawCanvas.toDataURL('image/png');
    } catch (error) {
      console.warn('[Fatih Kalem] Çizim anlık görüntüsü alınamadı.', error);
      return null;
    }
  }

  function updateHistoryButtons() {
    undoBtn.disabled = historyBusy || historyStack.length === 0;
    redoBtn.disabled = historyBusy || redoStack.length === 0;
  }

  function pushHistoryEntry(snapshot) {
    if (!snapshot) {
      return;
    }

    historyStack.push(snapshot);
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    }

    redoStack.length = 0;
    updateHistoryButtons();
  }

  function beginHistory() {
    pendingSnapshot = snapshotCanvas();
  }

  function commitPendingHistory() {
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    pushHistoryEntry(snapshot);
  }

  function discardPendingHistory() {
    pendingSnapshot = null;
  }

  function restoreSnapshot(dataUrl) {
    historyBusy = true;
    const token = ++historyToken;
    updateHistoryButtons();

    const image = new Image();
    image.onload = () => {
      if (token !== historyToken) {
        return;
      }

      clearPreview();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      ctx.drawImage(image, 0, 0, drawCanvas.width, drawCanvas.height);
      ctx.restore();
      historyBusy = false;
      updateHistoryButtons();
    };
    image.onerror = () => {
      if (token !== historyToken) {
        return;
      }
      historyBusy = false;
      updateHistoryButtons();
      showToast('Geri alma görüntüsü yüklenemedi.', 'error');
    };
    image.src = dataUrl;
  }

  function undo() {
    if (historyBusy || activePointer !== null || historyStack.length === 0) {
      return;
    }

    const snapshot = snapshotCanvas();
    if (!snapshot) {
      return;
    }

    redoStack.push(snapshot);
    if (redoStack.length > MAX_HISTORY) {
      redoStack.shift();
    }

    const previous = historyStack.pop();
    updateHistoryButtons();
    if (previous) {
      restoreSnapshot(previous);
    }
  }

  function redo() {
    if (historyBusy || activePointer !== null || redoStack.length === 0) {
      return;
    }

    const snapshot = snapshotCanvas();
    if (!snapshot) {
      return;
    }

    historyStack.push(snapshot);
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
    }

    const next = redoStack.pop();
    updateHistoryButtons();
    if (next) {
      restoreSnapshot(next);
    }
  }

  function setTool(tool) {
    if (!VALID_TOOLS.has(tool) || activePointer !== null) {
      return;
    }

    state.tool = tool;

    document.querySelectorAll('[data-tool]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    });

    stage.dataset.tool = tool;
    updateBrushCursor();
  }

  function pointFromEvent(event) {
    const rect = drawCanvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

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

  function drawShape(target, tool, start, end, width, color) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    target.globalCompositeOperation = 'source-over';
    target.globalAlpha = 1;
    target.lineWidth = width;
    target.strokeStyle = color;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.beginPath();

    if (tool === 'line') {
      target.moveTo(start.x, start.y);
      target.lineTo(end.x, end.y);
    } else if (tool === 'rect') {
      target.rect(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.abs(dx), Math.abs(dy));
    } else {
      target.ellipse(
        start.x + dx / 2,
        start.y + dy / 2,
        Math.max(Math.abs(dx) / 2, 0.01),
        Math.max(Math.abs(dy) / 2, 0.01),
        0,
        0,
        Math.PI * 2
      );
    }

    target.stroke();
  }

  function beginFreehand(point) {
    const tool = state.tool;
    const width = activeStrokeWidth();

    if (tool === 'highlighter') {
      clearSurface(highlightCtx, highlightCanvas);
      preparePaint(highlightCtx, 'pen', width, state.color);
      drawDot(highlightCtx, point, width, state.color);
      renderHighlightPreview();
    } else {
      preparePaint(ctx, tool, width, state.color);
      drawDot(ctx, point, width, tool === 'eraser' ? '#000000' : state.color);
    }

    stroke = {
      kind: 'free',
      tool,
      last: point,
      lastMid: point,
      moved: false
    };
  }

  function addFreehandPoint(point) {
    if (!stroke || stroke.kind !== 'free') {
      return;
    }

    if (Math.abs(point.x - stroke.last.x) < 0.1 && Math.abs(point.y - stroke.last.y) < 0.1) {
      return;
    }

    const target = stroke.tool === 'highlighter' ? highlightCtx : ctx;
    const mid = {
      x: (stroke.last.x + point.x) / 2,
      y: (stroke.last.y + point.y) / 2
    };

    target.beginPath();
    target.moveTo(stroke.lastMid.x, stroke.lastMid.y);
    target.quadraticCurveTo(stroke.last.x, stroke.last.y, mid.x, mid.y);
    target.stroke();

    stroke.last = point;
    stroke.lastMid = mid;
    stroke.moved = true;
  }

  function finishFreehand() {
    if (!stroke) {
      return;
    }

    const { tool, last, lastMid, moved } = stroke;

    if (tool === 'highlighter') {
      if (moved) {
        highlightCtx.beginPath();
        highlightCtx.moveTo(lastMid.x, lastMid.y);
        highlightCtx.quadraticCurveTo(last.x, last.y, last.x, last.y);
        highlightCtx.stroke();
      }

      commitPendingHistory();
      ctx.save();
      ctx.globalAlpha = HIGHLIGHTER_ALPHA;
      ctx.drawImage(highlightCanvas, 0, 0, view.width, view.height);
      ctx.restore();
      resetPaint(ctx);
      clearPreview();
      clearSurface(highlightCtx, highlightCanvas);
      return;
    }

    if (moved) {
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
      ctx.stroke();
    }

    resetPaint(ctx);
    commitPendingHistory();
  }

  function beginShape(point) {
    stroke = {
      kind: 'shape',
      tool: state.tool,
      start: point,
      end: point
    };
    renderShapePreview();
  }

  function renderShapePreview() {
    clearPreview();
    if (!stroke || stroke.kind !== 'shape') {
      return;
    }
    drawShape(previewCtx, stroke.tool, stroke.start, stroke.end, state.penWidth, state.color);
  }

  function updateShape(point) {
    if (!stroke || stroke.kind !== 'shape') {
      return;
    }
    stroke.end = point;
    renderShapePreview();
  }

  function finishShape() {
    if (!stroke || stroke.kind !== 'shape') {
      return;
    }

    const dx = stroke.end.x - stroke.start.x;
    const dy = stroke.end.y - stroke.start.y;
    const tooSmall = stroke.tool === 'line'
      ? Math.hypot(dx, dy) < 2
      : Math.abs(dx) < 2 || Math.abs(dy) < 2;

    if (tooSmall) {
      clearPreview();
      discardPendingHistory();
      return;
    }

    drawShape(ctx, stroke.tool, stroke.start, stroke.end, state.penWidth, state.color);
    resetPaint(ctx);
    clearPreview();
    commitPendingHistory();
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
    if (!stroke) {
      activePointer = null;
      return;
    }

    const pointerId = activePointer;

    if (stroke.kind === 'free') {
      finishFreehand();
    } else {
      finishShape();
    }

    stroke = null;
    activePointer = null;

    if (pointerId !== null) {
      releaseDrawPointer(pointerId);
    }
  }

  function abortStroke() {
    if (!stroke) {
      activePointer = null;
      return;
    }

    const pointerId = activePointer;
    const { kind, tool } = stroke;

    if (tool === 'highlighter' || kind === 'shape') {
      clearPreview();

      if (tool === 'highlighter') {
        clearSurface(highlightCtx, highlightCanvas);
      }

      discardPendingHistory();
    } else {
      resetPaint(ctx);
      commitPendingHistory();
    }

    stroke = null;
    activePointer = null;

    if (pointerId !== null) {
      releaseDrawPointer(pointerId);
    }
  }

  function onPointerDown(event) {
    if (!state.drawingMode || state.curtain || historyBusy || activePointer !== null) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if (!stylePanel.hidden) {
      closeStylePanel(false);
      return;
    }

    const point = pointFromEvent(event);

    beginHistory();
    activePointer = event.pointerId;

    try {
      drawCanvas.setPointerCapture(event.pointerId);
    } catch {
      // Drawing still works without pointer capture.
    }

    event.preventDefault();

    if (SHAPE_TOOLS.has(state.tool)) {
      beginShape(point);
    } else {
      beginFreehand(point);
    }
  }

  function onPointerMove(event) {
    if (activePointer === null || !stroke || event.pointerId !== activePointer) {
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
      addFreehandPoint(pointFromEvent(sample));
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

    closeStylePanel(false);

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
    }
  }

  function toggleCurtain() {
    if (state.curtain) {
      closeCurtain(true);
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
    closeStylePanel(false);
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
    closeStylePanel(false);
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
    closeStylePanel(false);

    window.requestAnimationFrame(() => {
      keepToolbarInStrip();
    });
  }

  // Style panel ------------------------------------------------------------

  function positionStylePanel() {
    if (stylePanel.hidden) {
      return;
    }

    const anchor = styleBtn.getBoundingClientRect();
    const rect = stylePanel.getBoundingClientRect();
    const margin = 8;

    let left = anchor.left;
    left = clamp(left, margin, Math.max(margin, window.innerWidth - rect.width - margin));

    let top = anchor.bottom + 8;
    if (top + rect.height > window.innerHeight - margin) {
      top = Math.max(margin, anchor.top - rect.height - 8);
    }

    stylePanel.style.left = `${left}px`;
    stylePanel.style.top = `${top}px`;
  }

  function openStylePanel() {
    if (!stylePanel.hidden) {
      return;
    }

    stylePanel.hidden = false;
    styleBtn.setAttribute('aria-expanded', 'true');
    positionStylePanel();
    styleClose.focus({ preventScroll: true });
  }

  function closeStylePanel(restoreFocus = false) {
    if (stylePanel.hidden) {
      return;
    }

    stylePanel.hidden = true;
    styleBtn.setAttribute('aria-expanded', 'false');

    if (restoreFocus) {
      styleBtn.focus({ preventScroll: true });
    }
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
      closeStylePanel(false);

      if (stroke) {
        abortStroke();
      }
    }

    updateBrushCursor();
    window.requestAnimationFrame(() => {
      keepToolbarInStrip();
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
  }

  // Export -----------------------------------------------------------------

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

  async function exportPng() {
    if (exporting) {
      return;
    }

    exporting = true;
    exportBtn.disabled = true;
    exportBtn.setAttribute('aria-busy', 'true');

    let captureFailed = false;

    try {
      let capture = null;

      if (bridge && typeof bridge.captureScreen === 'function') {
        try {
          capture = await bridge.captureScreen();
        } catch (error) {
          console.warn('[Fatih Kalem] Ekran görüntüsü alınamadı.', error);
          capture = null;
        }
      }

      let output = null;
      let outputCtx = null;

      if (capture && typeof capture.dataUrl === 'string') {
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
      const suggestedName = `fatih-kalem-${fileStamp()}.png`;

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
        if (captureFailed) {
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

  // Clear dialog -----------------------------------------------------------

  function openClearDialog() {
    if (clearDialog.open) {
      return;
    }

    if (activePointer !== null) {
      abortStroke();
    }

    clearDialog.showModal();
    clearCancel.focus({ preventScroll: true });
  }

  function clearAllDrawings() {
    if (activePointer !== null) {
      abortStroke();
    }

    historyToken += 1;
    historyBusy = false;
    const snapshot = snapshotCanvas();
    clearSurface(ctx, drawCanvas);
    clearSurface(previewCtx, previewCanvas);
    clearSurface(highlightCtx, highlightCanvas);
    pushHistoryEntry(snapshot);
  }

  // Keyboard ---------------------------------------------------------------

  function handleGlobalKeydown(event) {
    if (clearDialog.open) {
      return;
    }

    if (event.key === 'Escape') {
      let handled = false;

      if (activePointer !== null) {
        abortStroke();
        handled = true;
      } else if (!stylePanel.hidden) {
        closeStylePanel(true);
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
      }
      return;
    }

    if (event.altKey) {
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
      || !stylePanel.hidden
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

  styleBtn.addEventListener('click', () => {
    if (stylePanel.hidden) {
      openStylePanel();
    } else {
      closeStylePanel(true);
    }
  });

  styleClose.addEventListener('click', () => closeStylePanel(true));

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', openClearDialog);
  exportBtn.addEventListener('click', exportPng);
  curtainBtn.addEventListener('click', toggleCurtain);

  dockLeft.addEventListener('click', () => setDock('left'));
  dockRight.addEventListener('click', () => setDock('right'));

  collapseBtn.addEventListener('click', () => {
    setCollapsed(toolbar.dataset.collapsed !== 'true');
  });

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

  document.addEventListener('pointerdown', (event) => {
    if (stylePanel.hidden) {
      return;
    }

    if (stylePanel.contains(event.target) || styleBtn.contains(event.target)) {
      return;
    }

    closeStylePanel(false);
  });

  clearCancel.addEventListener('click', () => {
    clearDialog.close();
  });

  clearConfirm.addEventListener('click', () => {
    clearAllDrawings();
    clearDialog.close();
    showToast('Çizim temizlendi. Geri almak için Ctrl+Z.', 'success');
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

  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('blur', () => {
    brushCursor.hidden = true;

    if (stroke) {
      abortStroke();
    }
  });

  // Boot -------------------------------------------------------------------

  buildPalette();
  updateStyleUI();
  updateHistoryButtons();
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

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * @typedef {Object} OverlayState
 * @property {boolean} drawingMode - True when the overlay captures pointer input.
 * @property {boolean} visible - True when the overlay window is on screen.
 */

/**
 * @typedef {Object} ScreenCapture
 * @property {string} dataUrl - PNG data URL of the captured display.
 * @property {number} width - Captured image width in pixels.
 * @property {number} height - Captured image height in pixels.
 */

/**
 * @typedef {Object} FileResult
 * @property {boolean} [saved]
 * @property {boolean} [opened]
 * @property {boolean} [canceled]
 * @property {string} [filePath]
 * @property {string} [content]
 * @property {string} [dataUrl]
 * @property {string} [name]
 * @property {string} [error]
 */

function subscribe(channel, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('Dinleyici bir fonksiyon olmalıdır.');
  }

  ipcRenderer.on(channel, (_event, payload) => {
    callback(payload);
  });
}

contextBridge.exposeInMainWorld('fatihKalem', {
  /**
   * @returns {Promise<OverlayState>}
   */
  getState: () => ipcRenderer.invoke('overlay:get-state'),

  /**
   * Requests a drawing/click-through mode change. The main process owns the
   * actual mouse-event behavior and broadcasts the result back.
   * @param {boolean} enabled
   * @returns {Promise<{drawingMode: boolean}>}
   */
  setDrawingMode: (enabled) => ipcRenderer.invoke('overlay:set-mode', Boolean(enabled)),

  /**
   * @param {(enabled: boolean) => void} callback
   * @returns {void}
   */
  onModeChange: (callback) => subscribe('overlay:mode', callback),

  /**
   * @param {(visible: boolean) => void} callback
   * @returns {void}
   */
  onVisibilityChange: (callback) => subscribe('overlay:visibility', callback),

  /**
   * Captures a fresh image of the display containing the overlay. The main
   * process briefly hides the overlay so the capture cannot contain itself.
   * @returns {Promise<ScreenCapture | null>}
   */
  captureScreen: () => ipcRenderer.invoke('capture:primary'),

  /**
   * Opens a native image picker and returns the file as a data URL.
   * @returns {Promise<FileResult>}
   */
  openImage: () => ipcRenderer.invoke('dialog:open-image'),

  /**
   * Opens a native save dialog and writes a PNG.
   * @param {string} dataUrl
   * @param {string} suggestedName
   * @returns {Promise<FileResult>}
   */
  savePng: (dataUrl, suggestedName) => ipcRenderer.invoke('export:save-png', {
    dataUrl,
    suggestedName
  }),

  /**
   * Opens a native save dialog and writes the serialized .fkproj document.
   * @param {string} content
   * @param {string} suggestedName
   * @returns {Promise<FileResult>}
   */
  saveProject: (content, suggestedName) => ipcRenderer.invoke('project:save', {
    content,
    suggestedName
  }),

  /**
   * Opens a native picker and returns the raw .fkproj JSON text.
   * @returns {Promise<FileResult>}
   */
  openProject: () => ipcRenderer.invoke('project:open'),

  /**
   * Opens a native save dialog and writes a WebM recording.
   * @param {ArrayBuffer} data
   * @param {string} suggestedName
   * @returns {Promise<FileResult>}
   */
  saveRecording: (data, suggestedName) => ipcRenderer.invoke('recording:save', {
    data: new Uint8Array(data),
    suggestedName
  }),

  /**
   * Fired when the main process wants to close the window and needs the
   * renderer to resolve unsaved changes first.
   * @param {(request: {requestId: number}) => void} callback
   * @returns {void}
   */
  onConfirmClose: (callback) => subscribe('app:confirm-close', callback),

  /**
   * Answers a pending close request.
   * @param {number} requestId
   * @param {boolean} shouldClose
   * @returns {void}
   */
  respondToClose: (requestId, shouldClose) => {
    ipcRenderer.send('app:close-response', {
      requestId,
      close: Boolean(shouldClose)
    });
  }
});

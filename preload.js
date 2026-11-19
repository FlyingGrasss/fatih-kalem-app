'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * @typedef {Object} OverlayState
 * @property {boolean} drawingMode - True when the overlay captures pointer input.
 * @property {boolean} visible - True when the overlay window is on screen.
 */

/**
 * @typedef {Object} ScreenCapture
 * @property {string} dataUrl - PNG data URL of the primary display.
 * @property {number} width - Captured image width in pixels.
 * @property {number} height - Captured image height in pixels.
 */

/**
 * @typedef {Object} SavePngResult
 * @property {boolean} saved
 * @property {boolean} [canceled]
 * @property {string} [filePath]
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
   * Captures a fresh image of the primary display. The main process briefly
   * hides the overlay so the exported image cannot contain itself.
   * @returns {Promise<ScreenCapture | null>}
   */
  captureScreen: () => ipcRenderer.invoke('capture:primary'),

  /**
   * Opens the native save dialog and writes a PNG.
   * @param {string} dataUrl
   * @param {string} suggestedName
   * @returns {Promise<SavePngResult>}
   */
  savePng: (dataUrl, suggestedName) => ipcRenderer.invoke('export:save-png', {
    dataUrl,
    suggestedName
  })
});

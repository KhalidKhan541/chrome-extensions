(function() {
  'use strict';

  let protectionEnabled = true;

  function loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['settings'], (result) => {
          if (result.settings) {
            protectionEnabled = result.settings.fingerprintProtection !== false;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  function addNoise(value, range) {
    const noise = Math.floor(Math.random() * range) - Math.floor(range / 2);
    return value + noise;
  }

  function generateNoiseArray(length, maxNoise) {
    const arr = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = (Math.random() * maxNoise * 2) - maxNoise;
    }
    return arr;
  }

  function protectCanvas() {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
      if (!protectionEnabled) {
        return originalToDataURL.apply(this, arguments);
      }

      const ctx = this.getContext('2d');
      if (ctx) {
        const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = addNoise(data[i], 2);
          data[i + 1] = addNoise(data[i + 1], 2);
          data[i + 2] = addNoise(data[i + 2], 2);
        }

        ctx.putImageData(imageData, 0, 0);
      }

      return originalToDataURL.apply(this, arguments);
    };

    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      if (!protectionEnabled) {
        return originalToBlob.apply(this, arguments);
      }

      const ctx = this.getContext('2d');
      if (ctx) {
        const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = addNoise(data[i], 2);
          data[i + 1] = addNoise(data[i + 1], 2);
          data[i + 2] = addNoise(data[i + 2], 2);
        }

        ctx.putImageData(imageData, 0, 0);
      }

      return originalToBlob.apply(this, arguments);
    };

    CanvasRenderingContext2D.prototype.getImageData = function() {
      const imageData = originalGetImageData.apply(this, arguments);

      if (protectionEnabled) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = addNoise(data[i], 1);
          data[i + 1] = addNoise(data[i + 1], 1);
          data[i + 2] = addNoise(data[i + 2], 1);
        }
      }

      return imageData;
    };
  }

  function protectAudioContext() {
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    const originalCreateOscillator = OscillatorNode.prototype.start;

    AudioBuffer.prototype.getChannelData = function(channel) {
      const data = originalGetChannelData.call(this, channel);

      if (protectionEnabled) {
        const noise = generateNoiseArray(data.length, 0.0001);
        for (let i = 0; i < data.length; i++) {
          data[i] += noise[i];
        }
      }

      return data;
    };

    if (typeof OfflineAudioContext !== 'undefined') {
      const originalStartRendering = OfflineAudioContext.prototype.startRendering;
      OfflineAudioContext.prototype.startRendering = function() {
        return originalStartRendering.call(this).then(function(renderedBuffer) {
          if (protectionEnabled) {
            for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
              const data = renderedBuffer.getChannelData(channel);
              const noise = generateNoiseArray(data.length, 0.00005);
              for (let i = 0; i < data.length; i++) {
                data[i] += noise[i];
              }
            }
          }
          return renderedBuffer;
        });
      };
    }
  }

  function protectWebGL() {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    const originalGetExtension = WebGLRenderingContext.prototype.getExtension;

    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (!protectionEnabled) {
        return originalGetParameter.call(this, param);
      }

      const debugInfo = originalGetExtension.call(this, 'WEBGL_debug_renderer_info');
      if (debugInfo) {
        if (param === debugInfo.UNMASKED_VENDOR_WEBGL) {
          return 'Intel Inc.';
        }
        if (param === debugInfo.UNMASKED_RENDERER_WEBGL) {
          return 'Intel Iris OpenGL Engine';
        }
      }

      if (param === 0x1F01) {
        return 'Intel Inc.';
      }
      if (param === 0x1F00) {
        return 'Intel Iris OpenGL Engine';
      }

      return originalGetParameter.call(this, param);
    };

    if (typeof WebGL2RenderingContext !== 'undefined') {
      const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
      const originalGetExtension2 = WebGL2RenderingContext.prototype.getExtension;

      WebGL2RenderingContext.prototype.getParameter = function(param) {
        if (!protectionEnabled) {
          return originalGetParameter2.call(this, param);
        }

        const debugInfo = originalGetExtension2.call(this, 'WEBGL_debug_renderer_info');
        if (debugInfo) {
          if (param === debugInfo.UNMASKED_VENDOR_WEBGL) {
            return 'Intel Inc.';
          }
          if (param === debugInfo.UNMASKED_RENDERER_WEBGL) {
            return 'Intel Iris OpenGL Engine';
          }
        }

        return originalGetParameter2.call(this, param);
      };
    }
  }

  function protectNavigator() {
    if (!protectionEnabled) return;

    const originalPlugins = Object.getOwnPropertyDescriptor(Navigator.prototype, 'plugins');
    const originalLanguages = Object.getOwnPropertyDescriptor(Navigator.prototype, 'languages');
    const originalPlatform = Object.getOwnPropertyDescriptor(Navigator.prototype, 'platform');
    const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(Navigator.prototype, 'hardwareConcurrency');
    const originalDeviceMemory = Object.getOwnPropertyDescriptor(Navigator.prototype, 'deviceMemory');

    if (originalPlugins) {
      Object.defineProperty(Navigator.prototype, 'plugins', {
        get: function() {
          return [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
          ];
        }
      });
    }

    if (originalHardwareConcurrency) {
      Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', {
        get: function() {
          const values = [2, 4, 8];
          return values[Math.floor(Math.random() * values.length)];
        }
      });
    }

    if (originalDeviceMemory) {
      Object.defineProperty(Navigator.prototype, 'deviceMemory', {
        get: function() {
          const values = [2, 4, 8];
          return values[Math.floor(Math.random() * values.length)];
        }
      });
    }
  }

  function protectScreen() {
    if (!protectionEnabled) return;

    const originalWidth = Object.getOwnPropertyDescriptor(Screen.prototype, 'width');
    const originalHeight = Object.getOwnPropertyDescriptor(Screen.prototype, 'height');
    const originalColorDepth = Object.getOwnPropertyDescriptor(Screen.prototype, 'colorDepth');

    if (originalWidth) {
      Object.defineProperty(Screen.prototype, 'width', {
        get: function() {
          return addNoise(originalWidth.get.call(this), 2);
        }
      });
    }

    if (originalHeight) {
      Object.defineProperty(Screen.prototype, 'height', {
        get: function() {
          return addNoise(originalHeight.get.call(this), 2);
        }
      });
    }
  }

  function protectFontFingerprint() {
    if (!protectionEnabled) return;

    const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;

    CanvasRenderingContext2D.prototype.measureText = function(text) {
      const result = originalMeasureText.call(this, text);

      if (result) {
        const originalWidth = result.width;
        Object.defineProperty(result, 'width', {
          get: function() {
            return addNoise(originalWidth, 0.1);
          }
        });
      }

      return result;
    };
  }

  function protectWebRTC() {
    if (!protectionEnabled) return;

    const originalRTCPeerConnection = window.RTCPeerConnection;
    if (originalRTCPeerConnection) {
      window.RTCPeerConnection = function(config, constraints) {
        if (config && config.iceServers) {
          config.iceServers = config.iceServers.filter(server => {
            return !server.urls || !server.urls.includes('stun:');
          });
        }
        return new originalRTCPeerConnection(config, constraints);
      };
      window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
    }
  }

  function init() {
    loadSettings().then(() => {
      if (protectionEnabled) {
        protectCanvas();
        protectAudioContext();
        protectWebGL();
        protectNavigator();
        protectScreen();
        protectFontFingerprint();
        protectWebRTC();
      }

      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'TOGGLE_FINGERPRINT') {
            protectionEnabled = message.enabled;
            sendResponse({ success: true });
          }
          if (message.type === 'GET_FINGERPRINT_STATUS') {
            sendResponse({ enabled: protectionEnabled });
          }
        });
      }
    });
  }

  init();
})();

import { MessageType, ContentScriptConfig } from '@types/index';
import { MessageHandler } from '@utils/messaging';
import { Logger } from '@utils/logger';
import { DOMObserver } from '@utils/dom-observer';

const logger = new Logger('ContentScript');

class ContentScript {
  private messaging: MessageHandler;
  private observer: DOMObserver;
  private config: ContentScriptConfig | null = null;
  private initialized = false;

  constructor() {
    this.messaging = new MessageHandler();
    this.observer = new DOMObserver();
    this.setupListeners();
    this.initialize();
  }

  private setupListeners(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    this.observer.on('element-added', this.handleElementAdded.bind(this));
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.config = await this.getConfig();
      this.observer.start();
      this.initialized = true;
      logger.info('Content script initialized');

      this.announceReady();
    } catch (error) {
      logger.error('Failed to initialize content script', error);
    }
  }

  private async getConfig(): Promise<ContentScriptConfig> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
        resolve(response?.config || { enabled: true, selector: '' });
      });
    });
  }

  private announceReady(): void {
    this.messaging.sendToBackground({
      type: 'CONTENT_READY',
      payload: { url: window.location.href }
    });
  }

  private handleMessage(
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): boolean {
    switch (message.type) {
      case 'TOGGLE_POPUP':
        this.togglePopup();
        sendResponse({ success: true });
        break;
      case 'OPEN_POPUP':
        this.openPopup();
        sendResponse({ success: true });
        break;
      case 'CONFIG_CHANGED':
        this.handleConfigChange(message.payload);
        sendResponse({ success: true });
        break;
      case 'EXECUTE_ACTION':
        this.executeAction(message.payload);
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
    return true;
  }

  private handleElementAdded(element: HTMLElement): void {
    if (this.config?.selector && element.matches(this.config.selector)) {
      this.processElement(element);
    }
  }

  private processElement(element: HTMLElement): void {
    logger.debug('Processing matched element', element);
  }

  private handleConfigChange(config: ContentScriptConfig): void {
    this.config = config;
    if (config.enabled) {
      this.observer.start();
    } else {
      this.observer.stop();
    }
  }

  private togglePopup(): void {
    const popup = document.getElementById('extension-popup');
    if (popup) {
      popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    }
  }

  private openPopup(): void {
    this.injectPopup();
  }

  private injectPopup(): void {
    if (document.getElementById('extension-popup')) return;

    const container = document.createElement('div');
    container.id = 'extension-popup';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 80vh;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    container.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">Extension Popup</h3>
        <button id="close-popup" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
      </div>
      <div style="padding: 16px;">
        <p>Extension is active on this page.</p>
        <button id="run-action" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Run Action</button>
      </div>
    `;

    document.body.appendChild(container);

    container.querySelector('#close-popup')?.addEventListener('click', () => {
      container.remove();
    });

    container.querySelector('#run-action')?.addEventListener('click', () => {
      this.executeAction({ action: 'sample' });
    });
  }

  private async executeAction(payload: Record<string, unknown>): Promise<void> {
    logger.info('Executing action', payload);
    this.messaging.sendToBackground({
      type: 'ACTION_RESULT',
      payload: { ...payload, timestamp: Date.now(), url: window.location.href }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentScript());
} else {
  new ContentScript();
}

export { ContentScript };
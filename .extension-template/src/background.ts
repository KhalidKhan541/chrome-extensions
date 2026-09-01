import { ExtensionConfig, StorageKeys, MessageType } from '@types/index';
import { StorageManager } from '@utils/storage';
import { MessageHandler } from '@utils/messaging';
import { Logger } from '@utils/logger';

const logger = new Logger('Background');

class BackgroundService {
  private storage: StorageManager;
  private messaging: MessageHandler;
  private initialized = false;

  constructor() {
    this.storage = new StorageManager();
    this.messaging = new MessageHandler();
    this.setupListeners();
  }

  private setupListeners(): void {
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
  }

  private async handleInstalled(details: chrome.runtime.InstalledDetails): Promise<void> {
    logger.info('Extension installed', { reason: details.reason });

    if (details.reason === 'install') {
      await this.setDefaultSettings();
      await this.openWelcomePage();
    } else if (details.reason === 'update') {
      await this.handleUpdate(details.previousVersion);
    }
  }

  private async handleStartup(): Promise<void> {
    logger.info('Browser startup - initializing extension');
    await this.initialize();
  }

  private async initialize(config?: ExtensionConfig): Promise<void> {
    if (this.initialized) return;

    try {
      if (config) {
        await this.storage.set(StorageKeys.CONFIG, config);
      }

      const storedConfig = await this.storage.get<ExtensionConfig>(StorageKeys.CONFIG);
      if (!storedConfig) {
        await this.setDefaultSettings();
      }

      this.initialized = true;
      logger.info('Extension initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize extension', error);
      throw error;
    }
  }

  private async setDefaultSettings(): Promise<void> {
    const defaults: ExtensionConfig = {
      apiKey: '',
      options: {
        theme: 'system',
        notifications: true,
        autoUpdate: true
      }
    };
    await this.storage.set(StorageKeys.CONFIG, defaults);
  }

  private async openWelcomePage(): Promise<void> {
    const url = chrome.runtime.getURL('welcome.html');
    await chrome.tabs.create({ url });
  }

  private async handleUpdate(previousVersion: string): Promise<void> {
    logger.info('Extension updated', { previousVersion });
  }

  private async handleMessage(
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): Promise<boolean> {
    try {
      const response = await this.messaging.handle(message, sender);
      sendResponse(response);
    } catch (error) {
      logger.error('Message handling failed', error);
      sendResponse({ error: (error as Error).message });
    }
    return true;
  }

  private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
    if (tab.id) {
      await this.messaging.sendToTab(tab.id, { type: 'TOGGLE_POPUP' });
    }
  }

  private async handleCommand(command: string): Promise<void> {
    logger.info('Command received', { command });

    switch (command) {
      case 'open-popup':
        await this.openPopup();
        break;
      case 'toggle-feature':
        await this.toggleFeature();
        break;
    }
  }

  private async openPopup(): Promise<void> {
    const tab = await this.getActiveTab();
    if (tab?.id) {
      await this.messaging.sendToTab(tab.id, { type: 'OPEN_POPUP' });
    }
  }

  private async toggleFeature(): Promise<void> {
    const config = await this.storage.get<ExtensionConfig>(StorageKeys.CONFIG);
    if (config) {
      config.options.notifications = !config.options.notifications;
      await this.storage.set(StorageKeys.CONFIG, config);
      await this.broadcastConfigChange(config);
    }
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
      await this.injectContentScript(tabId);
    }
  }

  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (error) {
      logger.debug('Content script already injected or failed', error);
    }
  }

  private async getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  private async broadcastConfigChange(config: ExtensionConfig): Promise<void> {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.map(tab => tab.id && this.messaging.sendToTab(tab.id, {
        type: 'CONFIG_CHANGED',
        payload: config
      }))
    );
  }
}

const background = new BackgroundService();

export { background, BackgroundService };
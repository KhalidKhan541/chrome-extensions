import { BackgroundService } from '../../src/background';
import { StorageManager } from '@utils/storage';
import { MessageHandler } from '@utils/messaging';

jest.mock('@utils/storage');
jest.mock('@utils/messaging');
jest.mock('@utils/logger');

describe('BackgroundService', () => {
  let background: BackgroundService;
  let mockStorage: jest.Mocked<StorageManager>;
  let mockMessaging: jest.Mocked<MessageHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = new StorageManager() as jest.Mocked<StorageManager>;
    mockMessaging = new MessageHandler() as jest.Mocked<MessageHandler>;
    (StorageManager as jest.Mock).mockImplementation(() => mockStorage);
    (MessageHandler as jest.Mock).mockImplementation(() => mockMessaging);
    background = new BackgroundService();
  });

  describe('initialization', () => {
    it('should initialize with default settings on install', async () => {
      mockStorage.get.mockResolvedValue(null);
      mockStorage.set.mockResolvedValue(undefined);

      await (background as any).handleInstalled({ reason: 'install', previousVersion: '', temporary: false } as any);

      expect(mockStorage.set).toHaveBeenCalledWith('config', expect.objectContaining({
        apiKey: '',
        options: expect.objectContaining({
          theme: 'system',
          notifications: true,
          autoUpdate: true
        })
      }));
    });

    it('should not re-initialize if already initialized', async () => {
      mockStorage.get.mockResolvedValue({ apiKey: 'existing', options: {} });
      await background.initialize();
      await background.initialize();

      expect(mockStorage.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling', () => {
    it('should handle GET_CONFIG message', async () => {
      const config = { apiKey: 'test', options: { theme: 'dark' } };
      mockStorage.get.mockResolvedValue(config);
      mockMessaging.handle.mockResolvedValue({ success: true, payload: config });

      const sendResponse = jest.fn();
      await (background as any).handleMessage(
        { type: 'GET_CONFIG' },
        { tab: { id: 1 } },
        sendResponse
      );

      expect(mockStorage.get).toHaveBeenCalledWith('config');
      expect(sendResponse).toHaveBeenCalledWith({ success: true, payload: config });
    });

    it('should handle EXECUTE_ACTION message', async () => {
      mockMessaging.handle.mockResolvedValue({ success: true });

      const sendResponse = jest.fn();
      await (background as any).handleMessage(
        { type: 'EXECUTE_ACTION', payload: { action: 'test' } },
        { tab: { id: 1 } },
        sendResponse
      );

      expect(mockMessaging.handle).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('commands', () => {
    it('should handle open-popup command', async () => {
      const mockSendToTab = jest.fn().mockResolvedValue(undefined);
      mockMessaging.sendToTab = mockSendToTab;
      (chrome.tabs.query as jest.Mock).mockImplementation((query, cb) => cb([{ id: 1, active: true }]));

      await (background as any).handleCommand('open-popup');

      expect(mockSendToTab).toHaveBeenCalledWith(1, { type: 'OPEN_POPUP' });
    });

    it('should handle toggle-feature command', async () => {
      mockStorage.get.mockResolvedValue({
        apiKey: 'test',
        options: { theme: 'dark', notifications: true, autoUpdate: true }
      });
      mockStorage.set.mockResolvedValue(undefined);
      mockMessaging.sendToTab.mockResolvedValue(undefined);
      (chrome.tabs.query as jest.Mock).mockImplementation((query, cb) => cb([{ id: 1 }]));

      await (background as any).handleCommand('toggle-feature');

      expect(mockStorage.set).toHaveBeenCalledWith('config', expect.objectContaining({
        options: expect.objectContaining({ notifications: false })
      }));
    });
  });

  describe('storage changes', () => {
    it('should broadcast config changes to all tabs', async () => {
      const config = { apiKey: 'test', options: { theme: 'dark', notifications: true, autoUpdate: true } };
      mockMessaging.sendToTab.mockResolvedValue(undefined);
      (chrome.tabs.query as jest.Mock).mockImplementation((query, cb) => cb([{ id: 1 }, { id: 2 }]));

      await (background as any).broadcastConfigChange(config);

      expect(mockMessaging.sendToTab).toHaveBeenCalledTimes(2);
      expect(mockMessaging.sendToTab).toHaveBeenCalledWith(1, { type: 'CONFIG_CHANGED', payload: config });
      expect(mockMessaging.sendToTab).toHaveBeenCalledWith(2, { type: 'CONFIG_CHANGED', payload: config });
    });
  });

  describe('content script injection', () => {
    it('should inject content script on tab update', async () => {
      (chrome.scripting.executeScript as jest.Mock).mockResolvedValue([]);

      await (background as any).handleTabUpdated(1, { status: 'complete' }, { id: 1, url: 'https://example.com' } as any);

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: ['content.js']
      });
    });

    it('should not inject on non-http urls', async () => {
      await (background as any).handleTabUpdated(1, { status: 'complete' }, { id: 1, url: 'chrome://extensions' } as any);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });
  });
});
import { MessageHandler } from '@utils/messaging';

describe('MessageHandler', () => {
  let messaging: MessageHandler;

  beforeEach(() => {
    messaging = new MessageHandler();
    jest.clearAllMocks();
  });

  describe('on/off', () => {
    it('should register and handle message', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });
      messaging.on('TEST_ACTION', handler);

      const sendResponse = jest.fn();
      await (messaging as any).handleIncoming(
        { type: 'TEST_ACTION', payload: { data: 'test' } },
        { tab: { id: 1 } },
        sendResponse
      );

      expect(handler).toHaveBeenCalledWith({ data: 'test' }, expect.any(Object));
      expect(sendResponse).toHaveBeenCalledWith({ success: true, payload: { success: true } });
    });

    it('should remove handler with off', async () => {
      const handler = jest.fn();
      messaging.on('TEST_ACTION', handler);
      messaging.off('TEST_ACTION');

      const sendResponse = jest.fn();
      await (messaging as any).handleIncoming(
        { type: 'TEST_ACTION', payload: {} },
        {},
        sendResponse
      );

      expect(handler).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'No handler for TEST_ACTION' });
    });

    it('should handle handler errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      messaging.on('ERROR_ACTION', handler);

      const sendResponse = jest.fn();
      await (messaging as any).handleIncoming(
        { type: 'ERROR_ACTION', payload: {} },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Handler error' });
    });
  });

  describe('sendToBackground', () => {
    it('should send message to background and await response', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockImplementation((msg, cb) => {
        cb({ success: true, payload: { result: 'ok' } });
      });

      const promise = messaging.sendToBackground({ type: 'GET_CONFIG' });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'GET_CONFIG', requestId: expect.any(String) }),
        expect.any(Function)
      );

      const result = await promise;
      expect(result).toEqual({ result: 'ok' });
    });

    it('should timeout if no response', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {});

      await expect(messaging.sendToBackground({ type: 'SLOW_ACTION' })).rejects.toThrow('Message timeout');
    });
  });

  describe('sendToTab', () => {
    it('should send message to specific tab', async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockImplementation((tabId, msg, cb) => {
        cb({ success: true, payload: { tabResponse: true } });
      });

      const result = await messaging.sendToTab(123, { type: 'TAB_ACTION' });
      expect(result).toEqual({ tabResponse: true });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, expect.any(Object), expect.any(Function));
    });
  });

  describe('sendToAllTabs', () => {
    it('should send message to all tabs', async () => {
      const mockTabs = [
        { id: 1, url: 'https://a.com' },
        { id: 2, url: 'https://b.com' }
      ];
      (chrome.tabs.query as jest.Mock).mockImplementation((query, cb) => cb(mockTabs));
      (chrome.tabs.sendMessage as jest.Mock).mockImplementation((tabId, msg, cb) => cb({ success: true }));

      await messaging.sendToAllTabs({ type: 'BROADCAST' });

      expect(chrome.tabs.query).toHaveBeenCalledWith({}, expect.any(Function));
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('request/response correlation', () => {
    it('should correlate request with response by requestId', async () => {
      let captureSendResponse: Function;

      (chrome.runtime.sendMessage as jest.Mock).mockImplementation((msg, cb) => {
        captureSendResponse = cb;
      });

      const promise = messaging.sendToBackground({ type: 'ASYNC_ACTION' });

      captureSendResponse!({ requestId: (messaging as any).pendingRequests.keys().next().value, payload: { done: true } });

      const result = await promise;
      expect(result).toEqual({ done: true });
    });
  });
});
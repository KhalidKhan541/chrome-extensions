import { ContentScript } from '../../src/content';
import { MessageHandler } from '@utils/messaging';
import { DOMObserver } from '@utils/dom-observer';

jest.mock('@utils/messaging');
jest.mock('@utils/dom-observer');
jest.mock('@utils/logger');

describe('ContentScript', () => {
  let contentScript: ContentScript;
  let mockMessaging: jest.Mocked<MessageHandler>;
  let mockObserver: jest.Mocked<DOMObserver>;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockMessaging = new MessageHandler() as jest.Mocked<MessageHandler>;
    mockObserver = new DOMObserver() as jest.Mocked<DOMObserver>;
    (MessageHandler as jest.Mock).mockImplementation(() => mockMessaging);
    (DOMObserver as jest.Mock).mockImplementation(() => mockObserver);
    mockMessaging.sendToBackground.mockResolvedValue(undefined);
    mockObserver.on.mockReturnValue(jest.fn());
    mockObserver.start.mockImplementation();
    mockObserver.stop.mockImplementation();

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((msg, cb) => {
      cb({ config: { enabled: true, selector: '[data-test]' } });
    });

    contentScript = new ContentScript();
  });

  describe('initialization', () => {
    it('should initialize and start observer', async () => {
      await (contentScript as any).initialize();

      expect(mockObserver.start).toHaveBeenCalled();
      expect(mockMessaging.sendToBackground).toHaveBeenCalledWith({
        type: 'CONTENT_READY',
        payload: { url: window.location.href }
      });
    });

    it('should not re-initialize', async () => {
      await (contentScript as any).initialize();
      await (contentScript as any).initialize();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling', () => {
    it('should handle TOGGLE_POPUP', async () => {
      const sendResponse = jest.fn();
      (contentScript as any).injectPopup = jest.fn();

      await (contentScript as any).handleMessage(
        { type: 'TOGGLE_POPUP' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle OPEN_POPUP', async () => {
      const sendResponse = jest.fn();
      (contentScript as any).injectPopup = jest.fn();

      await (contentScript as any).handleMessage(
        { type: 'OPEN_POPUP' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle CONFIG_CHANGED', async () => {
      const sendResponse = jest.fn();

      await (contentScript as any).handleMessage(
        { type: 'CONFIG_CHANGED', payload: { enabled: false } },
        {},
        sendResponse
      );

      expect(mockObserver.stop).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle EXECUTE_ACTION', async () => {
      const sendResponse = jest.fn();

      await (contentScript as any).handleMessage(
        { type: 'EXECUTE_ACTION', payload: { action: 'test' } },
        {},
        sendResponse
      );

      expect(mockMessaging.sendToBackground).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ACTION_RESULT',
          payload: expect.objectContaining({ action: 'test' })
        })
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should return error for unknown message type', async () => {
      const sendResponse = jest.fn();

      await (contentScript as any).handleMessage(
        { type: 'UNKNOWN' },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown message type' });
    });
  });

  describe('popup injection', () => {
    it('should inject popup HTML', () => {
      (contentScript as any).injectPopup();

      const popup = document.getElementById('extension-popup');
      expect(popup).not.toBeNull();
      expect(popup?.querySelector('#close-popup')).not.toBeNull();
      expect(popup?.querySelector('#run-action')).not.toBeNull();
    });

    it('should not inject duplicate popup', () => {
      (contentScript as any).injectPopup();
      (contentScript as any).injectPopup();

      const popups = document.querySelectorAll('#extension-popup');
      expect(popups.length).toBe(1);
    });

    it('should close popup on close button click', () => {
      (contentScript as any).injectPopup();
      const closeBtn = document.getElementById('close-popup') as HTMLButtonElement;
      closeBtn.click();

      expect(document.getElementById('extension-popup')).toBeNull();
    });
  });

  describe('element processing', () => {
    it('should process elements matching selector', () => {
      const processSpy = jest.spyOn(contentScript as any, 'processElement');
      mockObserver.emit.mockImplementation((event, el) => {
        if (event === 'element-added') {
          (contentScript as any).handleElementAdded(el);
        }
      });

      const div = document.createElement('div');
      div.setAttribute('data-test', 'match');
      document.body.appendChild(div);

      expect(processSpy).toHaveBeenCalledWith(div);
    });
  });
});
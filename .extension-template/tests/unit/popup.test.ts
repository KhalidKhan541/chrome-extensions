import { PopupController } from '../../src/popup';
import { StorageManager } from '@utils/storage';
import { MessageHandler } from '@utils/messaging';

jest.mock('@utils/storage');
jest.mock('@utils/messaging');
jest.mock('@utils/logger');

describe('PopupController', () => {
  let popup: PopupController;
  let mockStorage: jest.Mocked<StorageManager>;
  let mockMessaging: jest.Mocked<MessageHandler>;
  let container: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    container.id = 'popup-root';
    document.body.appendChild(container);

    mockStorage = new StorageManager() as jest.Mocked<StorageManager>;
    mockMessaging = new MessageHandler() as jest.Mocked<MessageHandler>;
    (StorageManager as jest.Mock).mockImplementation(() => mockStorage);
    (MessageHandler as jest.Mock).mockImplementation(() => mockMessaging);

    mockStorage.get.mockResolvedValue({
      apiKey: 'test-key',
      options: { theme: 'dark', notifications: true, autoUpdate: true }
    });
    mockMessaging.sendToBackground.mockResolvedValue({ success: true });
    mockStorage.clear.mockResolvedValue(undefined);
    mockStorage.getAll.mockResolvedValue({ config: {} });

    popup = new PopupController();
  });

  afterEach(() => {
    popup.unmount();
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should render popup with config', async () => {
      await popup.mount(container);

      expect(container.querySelector('.popup-title')?.textContent).toBe('{{EXTENSION_NAME}}');
      expect(container.querySelector('.status')?.textContent).toContain('Configured');
      expect(container.querySelector('#btn-run')).not.toHaveAttribute('disabled');
    });

    it('should show unconfigured state when no apiKey', async () => {
      mockStorage.get.mockResolvedValueOnce({
        apiKey: '',
        options: { theme: 'system', notifications: true, autoUpdate: true }
      });

      await popup.mount(container);

      expect(container.querySelector('.status')?.textContent).toContain('Not configured');
      expect(container.querySelector('#btn-run')).toHaveAttribute('disabled');
    });

    it('should not mount twice', async () => {
      await popup.mount(container);
      await popup.mount(container);

      expect(mockStorage.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('unmount', () => {
    it('should clear container', async () => {
      await popup.mount(container);
      popup.unmount();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('update', () => {
    it('should update status', async () => {
      await popup.mount(container);
      popup.update({ status: 'New status', statusType: 'configured' });

      expect(container.querySelector('#status')?.textContent).toBe('New status');
      expect(container.querySelector('#status')?.classList.contains('configured')).toBe(true);
    });

    it('should update config display', async () => {
      await popup.mount(container);
      popup.update({ config: { new: 'config' } });

      expect(container.querySelector('#config-display')?.textContent).toContain('new');
    });
  });

  describe('event handlers', () => {
    beforeEach(async () => {
      await popup.mount(container);
    });

    it('should handle run action', async () => {
      const btn = container.querySelector('#btn-run') as HTMLButtonElement;
      btn.click();

      await new Promise(r => setTimeout(r, 0));

      expect(mockMessaging.sendToBackground).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EXECUTE_ACTION' })
      );
      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toBe('Run Action');
    });

    it('should open settings page', () => {
      const btn = container.querySelector('#btn-settings') as HTMLButtonElement;
      btn.click();

      expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('should clear storage with confirmation', async () => {
      window.confirm = jest.fn().mockReturnValue(true);

      const btn = container.querySelector('#btn-clear-storage') as HTMLButtonElement;
      btn.click();

      await new Promise(r => setTimeout(r, 0));

      expect(mockStorage.clear).toHaveBeenCalled();
      expect(mockStorage.get).toHaveBeenCalledTimes(2);
    });

    it('should not clear storage if cancelled', async () => {
      window.confirm = jest.fn().mockReturnValue(false);

      const btn = container.querySelector('#btn-clear-storage') as HTMLButtonElement;
      btn.click();

      await new Promise(r => setTimeout(r, 0));

      expect(mockStorage.clear).not.toHaveBeenCalled();
    });

    it('should export storage', async () => {
      const createObjectURL = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURL = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();
      const click = jest.fn();
      HTMLAnchorElement.prototype.click = click;

      const btn = container.querySelector('#btn-export-storage') as HTMLButtonElement;
      btn.click();

      expect(createObjectURL).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      revokeObjectURL.mockRestore();
    });

    it('should open docs link', () => {
      const link = container.querySelector('#link-docs') as HTMLAnchorElement;
      link.click();

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/{{ORG}}/{{REPO}}#readme'
      });
    });
  });
});
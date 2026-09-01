import { ExtensionConfig, PopupData } from '@types/index';
import { StorageManager } from '@utils/storage';
import { MessageHandler } from '@utils/messaging';
import { Logger } from '@utils/logger';

const logger = new Logger('Popup');

class PopupController {
  private storage: StorageManager;
  private messaging: MessageHandler;
  private container: HTMLElement | null = null;
  private config: ExtensionConfig | null = null;
  private mounted = false;

  constructor() {
    this.storage = new StorageManager();
    this.messaging = new MessageHandler();
  }

  async mount(container: HTMLElement): Promise<void> {
    if (this.mounted) return;

    this.container = container;
    this.config = await this.storage.get<ExtensionConfig>('config');

    this.render();
    this.attachEventListeners();
    this.mounted = true;
    logger.info('Popup mounted');
  }

  unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.mounted = false;
    logger.info('Popup unmounted');
  }

  update(data: PopupData): void {
    if (!this.container) return;

    const statusEl = this.container.querySelector('#status');
    if (statusEl && data.status) {
      statusEl.textContent = data.status;
      statusEl.className = `status ${data.statusType || ''}`;
    }

    const configEl = this.container.querySelector('#config-display');
    if (configEl && data.config) {
      configEl.textContent = JSON.stringify(data.config, null, 2);
    }
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = this.getTemplate();
    this.applyStyles();
  }

  private getTemplate(): string {
    const isConfigured = this.config?.apiKey?.length > 0;

    return `
      <div class="popup-container">
        <header class="popup-header">
          <h1 class="popup-title">{{EXTENSION_NAME}}</h1>
          <span class="popup-version">v0.0.0</span>
        </header>

        <main class="popup-main">
          <section class="popup-section">
            <h2>Status</h2>
            <div id="status" class="status ${isConfigured ? 'configured' : 'unconfigured'}">
              ${isConfigured ? 'Configured and ready' : 'Not configured - click Settings'}
            </div>
          </section>

          <section class="popup-section">
            <h2>Quick Actions</h2>
            <div class="button-group">
              <button id="btn-run" class="btn btn-primary" ${!isConfigured ? 'disabled' : ''}>
                Run Action
              </button>
              <button id="btn-settings" class="btn btn-secondary">
                Settings
              </button>
            </div>
          </section>

          <section class="popup-section">
            <h2>Configuration</h2>
            <pre id="config-display" class="config-display">${JSON.stringify(this.config?.options || {}, null, 2)}</pre>
          </section>

          <section class="popup-section">
            <h2>Storage</h2>
            <div class="button-group">
              <button id="btn-clear-storage" class="btn btn-danger">Clear Storage</button>
              <button id="btn-export-storage" class="btn btn-secondary">Export</button>
            </div>
          </section>
        </main>

        <footer class="popup-footer">
          <a href="#" id="link-docs" target="_blank">Documentation</a>
          <a href="#" id="link-issues" target="_blank">Report Issue</a>
          <span class="popup-build">Build: {{BUILD_TIME}}</span>
        </footer>
      </div>
    `;
  }

  private applyStyles(): void {
    if (!this.container) return;

    const style = document.createElement('style');
    style.textContent = `
      .popup-container {
        width: 360px;
        min-height: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #fff;
        color: #1a1a1a;
      }
      .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
      }
      .popup-title { margin: 0; font-size: 18px; font-weight: 600; }
      .popup-version { font-size: 12px; color: #666; }
      .popup-main { padding: 16px; max-height: 500px; overflow-y: auto; }
      .popup-section { margin-bottom: 20px; }
      .popup-section h2 { font-size: 13px; font-weight: 600; text-transform: uppercase; color: #666; margin: 0 0 12px; letter-spacing: 0.5px; }
      .status { padding: 12px; border-radius: 6px; font-size: 14px; }
      .status.configured { background: #e8f5e9; color: #2e7d32; }
      .status.unconfigured { background: #fff3e0; color: #ef6c00; }
      .button-group { display: flex; gap: 8px; flex-wrap: wrap; }
      .btn { padding: 10px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-primary { background: #1a73e8; color: white; }
      .btn-primary:hover:not(:disabled) { background: #1557b0; }
      .btn-secondary { background: #f1f3f4; color: #3c4043; }
      .btn-secondary:hover:not(:disabled) { background: #e8eaed; }
      .btn-danger { background: #fce8e6; color: #c5221f; }
      .btn-danger:hover:not(:disabled) { background: #fad2cf; }
      .config-display { background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 12px; max-height: 200px; overflow: auto; margin: 0; }
      .popup-footer { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
      .popup-footer a { color: #1a73e8; text-decoration: none; margin-right: 16px; }
      .popup-footer a:hover { text-decoration: underline; }
      .popup-build { font-family: monospace; }
    `;
    this.container.appendChild(style);
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    this.container.querySelector('#btn-run')?.addEventListener('click', () => this.handleRun());
    this.container.querySelector('#btn-settings')?.addEventListener('click', () => this.handleSettings());
    this.container.querySelector('#btn-clear-storage')?.addEventListener('click', () => this.handleClearStorage());
    this.container.querySelector('#btn-export-storage')?.addEventListener('click', () => this.handleExportStorage());
    this.container.querySelector('#link-docs')?.addEventListener('click', (e) => { e.preventDefault(); this.openDocs(); });
    this.container.querySelector('#link-issues')?.addEventListener('click', (e) => { e.preventDefault(); this.openIssues(); });
  }

  private async handleRun(): Promise<void> {
    const btn = this.container?.querySelector('#btn-run') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Running...';
    }

    try {
      await this.messaging.sendToBackground({
        type: 'EXECUTE_ACTION',
        payload: { action: 'run', timestamp: Date.now() }
      });
      this.update({ status: 'Action completed successfully', statusType: 'configured' });
    } catch (error) {
      logger.error('Action failed', error);
      this.update({ status: `Error: ${(error as Error).message}`, statusType: 'unconfigured' });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Run Action';
      }
    }
  }

  private handleSettings(): void {
    chrome.runtime.openOptionsPage();
  }

  private async handleClearStorage(): Promise<void> {
    if (confirm('Clear all extension storage? This cannot be undone.')) {
      await this.storage.clear();
      this.config = await this.storage.get<ExtensionConfig>('config');
      this.render();
      this.attachEventListeners();
      this.update({ status: 'Storage cleared', statusType: 'unconfigured' });
    }
  }

  private async handleExportStorage(): Promise<void> {
    const data = await this.storage.getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extension-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private openDocs(): void {
    chrome.tabs.create({ url: 'https://github.com/{{ORG}}/{{REPO}}#readme' });
  }

  private openIssues(): void {
    chrome.tabs.create({ url: 'https://github.com/{{ORG}}/{{REPO}}/issues' });
  }
}

const popupController = new PopupController();

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('popup-root') || document.body;
  await popupController.mount(container);
});

export { popupController, PopupController };
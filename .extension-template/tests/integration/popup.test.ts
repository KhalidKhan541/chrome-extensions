import { test, expect, Page } from '@playwright/test';

const EXTENSION_ID = 'test-extension-id';
const POPUP_URL = `chrome-extension://${EXTENSION_ID}/popup.html`;

test.describe('Popup Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(POPUP_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display popup with title', async () => {
    await expect(page.locator('.popup-title')).toContainText('{{EXTENSION_NAME}}');
  });

  test('should show configured status when apiKey exists', async () => {
    await page.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: 'test', options: { theme: 'dark', notifications: true, autoUpdate: true } } });
    });
    await page.reload();

    await expect(page.locator('.status')).toContainText('Configured and ready');
  });

  test('should show unconfigured status when no apiKey', async () => {
    await page.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: '', options: { theme: 'system', notifications: true, autoUpdate: true } } });
    });
    await page.reload();

    await expect(page.locator('.status')).toContainText('Not configured');
    await expect(page.locator('#btn-run')).toBeDisabled();
  });

  test('should enable run button when configured', async () => {
    await page.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: 'test-key', options: { theme: 'dark', notifications: true, autoUpdate: true } } });
    });
    await page.reload();

    await expect(page.locator('#btn-run')).toBeEnabled();
  });

  test('should execute action and show result', async () => {
    await page.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: 'test', options: {} } });
      chrome.runtime.sendMessage = (msg: any) => Promise.resolve({ success: true, payload: { result: 'ok' } });
    });
    await page.reload();

    await page.click('#btn-run');
    await page.waitForTimeout(100);

    await expect(page.locator('.status')).toContainText('Action completed successfully');
  });

  test('should open options page on settings click', async () => {
    await page.click('#btn-settings');
  });

  test('should clear storage', async () => {
    await page.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: 'test', options: {} } });
    });
    await page.reload();

    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Clear all extension storage');
      await dialog.accept();
    });

    await page.click('#btn-clear-storage');
    await page.waitForTimeout(100);

    await expect(page.locator('.status')).toContainText('Storage cleared');
  });

  test('should export storage as JSON', async () => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-export-storage');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/extension-backup-\d+\.json/);
  });

  test('should have working footer links', async () => {
    const docsLink = page.locator('#link-docs');
    const issuesLink = page.locator('#link-issues');

    await expect(docsLink).toHaveAttribute('href', '#');
    await expect(issuesLink).toHaveAttribute('href', '#');
  });

  test('should display config JSON', async () => {
    await page.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: 'test', options: { theme: 'dark', notifications: false, autoUpdate: true } } });
    });
    await page.reload();

    const configText = await page.locator('#config-display').textContent();
    expect(configText).toContain('dark');
    expect(configText).toContain('false');
  });
});

test.describe('Content Script Integration', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should inject content script', async () => {
    const contentScriptInjected = await page.evaluate(() => {
      return !!document.getElementById('extension-popup') || window.hasOwnProperty('contentScriptReady');
    });
    expect(contentScriptInjected).toBeTruthy();
  });

  test('should communicate with background', async () => {
    const response = await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response: any) => {
          resolve(response);
        });
      });
    });

    expect(response).toBeDefined();
  });

  test('should handle keyboard shortcuts', async () => {
    await page.keyboard.press('Control+Shift+X');
    await page.waitForTimeout(100);
  });
});

test.describe('Background Service Worker', () => {
  test('should handle install event', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('chrome://extensions');
    await page.waitForLoadState('domcontentloaded');
    await page.close();
  });

  test('should persist config across reloads', async ({ browser }) => {
    const page1 = await browser.newPage();
    await page1.goto(POPUP_URL);
    await page1.evaluate(() => {
      chrome.storage.sync.set({ config: { apiKey: 'persist-test', options: { theme: 'light', notifications: true, autoUpdate: false } } });
    });
    await page1.close();

    const page2 = await browser.newPage();
    await page2.goto(POPUP_URL);
    await page2.waitForLoadState('domcontentloaded');

    const status = await page2.locator('.status').textContent();
    expect(status).toContain('Configured');
    await page2.close();
  });
});
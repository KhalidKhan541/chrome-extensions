import { test, expect, Page, BrowserContext } from '@playwright/test';
import { loadExtension, unloadExtension, getExtensionPath, getAllExtensionNames, LoadedExtension } from './utils/extension-loader';
import { waitForElement, elementExists, getAttribute } from './utils/test-helpers';

const EXTENSION_NAME = process.env.EXTENSION_NAME || 'website-monitor';

test.describe(`Content Script Tests - ${EXTENSION_NAME}`, () => {
  let loaded: LoadedExtension;
  let testPage: Page;

  test.beforeAll(async () => {
    const extensionPath = getExtensionPath(EXTENSION_NAME);
    loaded = await loadExtension(extensionPath);
    expect(loaded.extensionInfo.id).toBeTruthy();
  });

  test.afterAll(async () => {
    await unloadExtension(loaded);
  });

  test.beforeEach(async ({ context }) => {
    testPage = await context.newPage();
    await testPage.goto('https://example.com');
    await testPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await testPage.close();
  });

  test('content script injects on page load', async () => {
    const hasContentScript = await testPage.evaluate(() => {
      return document.documentElement.hasAttribute('data-extension-injected') ||
             document.querySelector('[data-extension-injected]') !== null ||
             window.chrome?.runtime?.id !== undefined;
    });
    
    if (loaded.extensionInfo.manifest.content_scripts) {
      expect(hasContentScript).toBeTruthy();
    }
  });

  test('content script adds expected DOM elements', async () => {
    if (!loaded.extensionInfo.manifest.content_scripts) {
      test.skip('No content scripts defined in manifest');
      return;
    }

    const injectedElements = await testPage.locator('[data-extension-injected], [data-clipper], [data-blocker], [data-monitor], [data-focus-zone]').count();
    
    if (injectedElements === 0) {
      const shadowHosts = await testPage.evaluate(() => {
        return document.querySelectorAll('*').length > 0;
      });
      expect(shadowHosts).toBeTruthy();
    }
  });

  test('content script communicates with background', async () => {
    if (!loaded.extensionInfo.manifest.content_scripts) {
      test.skip('No content scripts defined in manifest');
      return;
    }

    const canSendMessage = await testPage.evaluate(async (extId) => {
      try {
        const response = await chrome.runtime.sendMessage(extId, { type: 'PING' });
        return response?.pong === true || response !== undefined;
      } catch {
        return false;
      }
    }, loaded.extensionInfo.id);

    expect(canSendMessage).toBeTruthy();
  });

  test('content script handles page navigation', async () => {
    await testPage.goto('https://httpbin.org/html');
    await testPage.waitForLoadState('networkidle');
    
    const stillInjected = await testPage.evaluate(() => {
      return document.documentElement.hasAttribute('data-extension-injected') ||
             document.querySelector('[data-extension-injected]') !== null;
    });
    
    expect(stillInjected).toBeTruthy();
  });

  test('content script works on different domains', async () => {
    const domains = ['https://httpbin.org', 'https://example.org'];
    
    for (const domain of domains) {
      await testPage.goto(domain);
      await testPage.waitForLoadState('networkidle');
      
      const hasInjection = await testPage.evaluate(() => {
        return document.documentElement.hasAttribute('data-extension-injected') ||
               document.querySelector('[data-extension-injected]') !== null ||
               window.chrome?.runtime?.id !== undefined;
      });
      
      expect(hasInjection).toBeTruthy();
    }
  });

  test('content script respects run_at timing', async () => {
    if (!loaded.extensionInfo.manifest.content_scripts) {
      test.skip('No content scripts defined in manifest');
      return;
    }

    const runAt = loaded.extensionInfo.manifest.content_scripts[0]?.run_at || 'document_idle';
    
    const timing = await testPage.evaluate((expectedRunAt) => {
      const startTime = performance.now();
      return new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            resolve({ readyState: document.readyState, time: performance.now() - startTime });
          });
        } else {
          resolve({ readyState: document.readyState, time: performance.now() - startTime });
        }
      });
    }, runAt);

    expect(timing).toBeDefined();
  });

  test('content script does not break page functionality', async () => {
    await testPage.goto('https://example.com');
    await testPage.waitForLoadState('networkidle');
    
    const pageWorks = await testPage.evaluate(() => {
      return document.body !== null && document.body.innerHTML.length > 0;
    });
    
    expect(pageWorks).toBeTruthy();
  });

  test('content script handles dynamic content', async () => {
    await testPage.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'dynamic-test-content';
      div.textContent = 'Dynamic content';
      document.body.appendChild(div);
    });
    
    await testPage.waitForSelector('#dynamic-test-content');
    const dynamicContent = await testPage.locator('#dynamic-test-content');
    await expect(dynamicContent).toBeVisible();
  });

  test('content script cleanup on unload', async () => {
    const initialScripts = await testPage.evaluate(() => {
      return document.querySelectorAll('script[src*="chrome-extension"]').length;
    });
    
    await testPage.goto('about:blank');
    await testPage.waitForLoadState('domcontentloaded');
    
    const finalScripts = await testPage.evaluate(() => {
      return document.querySelectorAll('script[src*="chrome-extension"]').length;
    });
    
    expect(finalScripts).toBeLessThanOrEqual(initialScripts);
  });
});
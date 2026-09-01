import { test, expect } from '@playwright/test';

test.describe('Extension E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('chrome://extensions');
    await page.waitForLoadState('networkidle');
  });

  test('extension loads without errors', async ({ page }) => {
    const extensionManager = page.locator('extensions-manager');
    await expect(extensionManager).toBeVisible();
  });

  test('extension appears in extensions list', async ({ page }) => {
    const extensionItem = page.locator('extensions-item').first();
    await expect(extensionItem).toBeVisible();
  });

  test('popup opens correctly', async ({ page, context }) => {
    const extensionId = await getExtensionId(page);
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popupPage.locator('body')).toBeVisible();
  });
});

async function getExtensionId(page: import('@playwright/test').Page): Promise<string> {
  return await page.evaluate(() => {
    const manager = document.querySelector('extensions-manager');
    if (!manager?.shadowRoot) return '';
    const list = manager.shadowRoot.querySelector('extensions-item-list');
    if (!list?.shadowRoot) return '';
    const item = list.shadowRoot.querySelector('extensions-item');
    return item?.getAttribute('id') || '';
  });
}
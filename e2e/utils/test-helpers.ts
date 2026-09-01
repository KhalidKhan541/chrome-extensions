import { Page, Locator, expect } from '@playwright/test';

export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<Locator> {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  return element;
}

export async function clickElement(page: Page, selector: string): Promise<void> {
  const element = await waitForElement(page, selector);
  await element.click();
}

export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  const element = await waitForElement(page, selector);
  await element.fill(value);
}

export async function selectOption(page: Page, selector: string, value: string): Promise<void> {
  const element = await waitForElement(page, selector);
  await element.selectOption(value);
}

export async function checkCheckbox(page: Page, selector: string, check = true): Promise<void> {
  const element = await waitForElement(page, selector);
  const isChecked = await element.isChecked();
  if (isChecked !== check) {
    await element.click();
  }
}

export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await waitForElement(page, selector);
  return (await element.textContent()) || '';
}

export async function getAttribute(page: Page, selector: string, attribute: string): Promise<string | null> {
  const element = await waitForElement(page, selector);
  return await element.getAttribute(attribute);
}

export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return await element.count() > 0;
}

export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

export function getRandomString(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

export function getRandomEmail(): string {
  return `test-${getRandomString()}@example.com`;
}

export function getRandomUrl(): string {
  return `https://example.com/${getRandomString()}`;
}

export async function testNotificationPermission(page: Page, extensionId: string): Promise<boolean> {
  const permPage = await page.context().newPage();
  await permPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await permPage.waitForLoadState('domcontentloaded');
  
  const hasPermission = await permPage.evaluate(async () => {
    return await Notification.requestPermission() === 'granted';
  });
  
  await permPage.close();
  return hasPermission;
}

export async function testStorageAccess(page: Page, extensionId: string, key: string, value: unknown): Promise<boolean> {
  const testPage = await page.context().newPage();
  await testPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await testPage.waitForLoadState('domcontentloaded');
  
  try {
    await testPage.evaluate(async ({ key, value }) => {
      await chrome.storage.local.set({ [key]: value });
      const result = await chrome.storage.local.get(key);
      return result[key] === value;
    }, { key, value });
    
    await testPage.close();
    return true;
  } catch {
    await testPage.close();
    return false;
  }
}

export async function waitForBackgroundEvent(page: Page, eventName: string, timeout = 5000): Promise<unknown> {
  return await page.evaluate((name) => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === name) {
          window.removeEventListener('message', handler);
          resolve(event.data.payload);
        }
      };
      window.addEventListener('message', handler);
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, timeout);
    });
  }, eventName);
}
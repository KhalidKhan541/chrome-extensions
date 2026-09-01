import { test, expect, Page, BrowserContext } from '@playwright/test';
import { loadExtension, unloadExtension, getExtensionPath, getAllExtensionNames, LoadedExtension } from './utils/extension-loader';
import { waitForElement, clickElement, elementExists, getTextContent } from './utils/test-helpers';

const EXTENSION_NAME = process.env.EXTENSION_NAME || 'website-monitor';

test.describe(`Popup Tests - ${EXTENSION_NAME}`, () => {
  let loaded: LoadedExtension;
  let popupPage: Page;

  test.beforeAll(async () => {
    const extensionPath = getExtensionPath(EXTENSION_NAME);
    loaded = await loadExtension(extensionPath);
    expect(loaded.extensionInfo.id).toBeTruthy();
  });

  test.afterAll(async () => {
    await unloadExtension(loaded);
  });

  test.beforeEach(async ({ context }) => {
    popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${loaded.extensionInfo.id}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await popupPage.close();
  });

  test('popup opens without errors', async () => {
    await expect(popupPage.locator('body')).toBeVisible();
    await expect(popupPage).not.toHaveURL(/chrome-error/);
  });

  test('popup has correct title', async () => {
    const title = await popupPage.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('popup contains interactive elements', async () => {
    const buttons = popupPage.locator('button, input[type="button"], input[type="submit"], a[role="button"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('popup responds to user interactions', async () => {
    const buttons = popupPage.locator('button:visible, input[type="button"]:visible, input[type="submit"]:visible');
    const count = await buttons.count();
    
    if (count > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      await firstButton.click();
      await popupPage.waitForTimeout(100);
    }
  });

  test('popup displays extension name or branding', async () => {
    const bodyText = await getTextContent(popupPage, 'body');
    expect(bodyText.toLowerCase()).toContain(loaded.extensionInfo.name.toLowerCase().split(' ')[0]);
  });

  test('popup has no console errors', async () => {
    const errors: string[] = [];
    popupPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await popupPage.reload();
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForTimeout(500);
    
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('manifest') &&
      !e.includes('Extension context invalidated')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('popup form inputs work correctly', async () => {
    const inputs = popupPage.locator('input:visible, textarea:visible, select:visible');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i);
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const type = await input.getAttribute('type');
      
      if (tagName === 'input' && type !== 'checkbox' && type !== 'radio' && type !== 'hidden' && type !== 'submit') {
        await input.fill('test value');
        const value = await input.inputValue();
        expect(value).toBe('test value');
      } else if (tagName === 'textarea') {
        await input.fill('test textarea');
        const value = await input.inputValue();
        expect(value).toBe('test textarea');
      } else if (tagName === 'select') {
        const options = await input.locator('option').all();
        if (options.length > 1) {
          await input.selectOption({ index: 1 });
        }
      }
    }
  });

  test('popup checkboxes and toggles work', async () => {
    const checkboxes = popupPage.locator('input[type="checkbox"]:visible, input[type="radio"]:visible');
    const count = await checkboxes.count();
    
    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);
      const initialState = await checkbox.isChecked();
      await checkbox.click();
      const newState = await checkbox.isChecked();
      expect(newState).not.toBe(initialState);
      await checkbox.click();
    }
  });

  test('popup links open correctly', async ({ context }) => {
    const links = popupPage.locator('a[href]:visible');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 2); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          link.click()
        ]);
        await newPage.waitForLoadState('domcontentloaded');
        await newPage.close();
      }
    }
  });

  test('popup is accessible', async () => {
    const focusableElements = popupPage.locator('button:visible, a[href]:visible, input:visible, select:visible, textarea:visible, [tabindex]:visible');
    const count = await focusableElements.count();
    
    if (count > 0) {
      await focusableElements.first().focus();
      await expect(focusableElements.first()).toBeFocused();
    }
  });
});
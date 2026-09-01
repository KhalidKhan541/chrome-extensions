import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtensionInfo {
  name: string;
  version: string;
  path: string;
  id?: string;
  manifest: Record<string, unknown>;
}

export interface LoadedExtension {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  extensionInfo: ExtensionInfo;
}

export async function loadExtension(extensionPath: string): Promise<LoadedExtension> {
  const manifestPath = path.join(extensionPath, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const extensionInfo: ExtensionInfo = {
    name: manifest.name || 'Unknown',
    version: manifest.version || '1.0.0',
    path: extensionPath,
    manifest,
  };

  const browser = await chromium.launch({
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--disable-web-security',
      '--disable-site-isolation-trials',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('chrome://extensions');
  await page.waitForLoadState('networkidle');

  const extensionId = await getExtensionId(page);
  
  if (extensionId) {
    extensionInfo.id = extensionId;
    const idFile = path.join(__dirname, `.extension-id-${extensionInfo.name.replace(/\s+/g, '-').toLowerCase()}`);
    fs.writeFileSync(idFile, extensionId);
  }

  return { browser, context, page, extensionInfo };
}

export async function getExtensionId(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const manager = document.querySelector('extensions-manager');
    if (!manager?.shadowRoot) return '';
    const list = manager.shadowRoot.querySelector('extensions-item-list');
    if (!list?.shadowRoot) return '';
    const item = list.shadowRoot.querySelector('extensions-item');
    return item?.getAttribute('id') || '';
  });
}

export async function getExtensionIdByName(page: Page, extensionName: string): Promise<string> {
  return await page.evaluate((name) => {
    const manager = document.querySelector('extensions-manager');
    if (!manager?.shadowRoot) return '';
    const list = manager.shadowRoot.querySelector('extensions-item-list');
    if (!list?.shadowRoot) return '';
    const items = list.shadowRoot.querySelectorAll('extensions-item');
    for (const item of items) {
      const title = item.shadowRoot?.querySelector('#name')?.textContent?.trim();
      if (title?.toLowerCase().includes(name.toLowerCase())) {
        return item.getAttribute('id') || '';
      }
    }
    return '';
  }, extensionName);
}

export async function openPopup(page: Page, context: BrowserContext, extensionId: string): Promise<Page> {
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await popupPage.waitForLoadState('domcontentloaded');
  return popupPage;
}

export async function openSidePanel(page: Page, context: BrowserContext, extensionId: string): Promise<Page> {
  const panelPage = await context.newPage();
  await panelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await panelPage.waitForLoadState('domcontentloaded');
  return panelPage;
}

export async function unloadExtension(loaded: LoadedExtension): Promise<void> {
  await loaded.context.close();
  await loaded.browser.close();
}

export function getExtensionPath(extensionName: string): string {
  return path.resolve(__dirname, `../../dist/${extensionName}`);
}

export function getAllExtensionNames(): string[] {
  const rootDir = path.resolve(__dirname, '../../');
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(rootDir, entry.name, 'manifest.json')))
    .map(entry => entry.name);
}
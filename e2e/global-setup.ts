import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const extensionPath = path.resolve(__dirname, '../dist/extension');

  if (!fs.existsSync(extensionPath)) {
    console.warn(`Extension not found at ${extensionPath}. Run 'npm run build' first.`);
    return;
  }

  const manifestPath = path.join(extensionPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn('manifest.json not found in extension build output.');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`Testing extension: ${manifest.name} v${manifest.version}`);

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

  const extensionId = await page.evaluate(() => {
    const extensions = document.querySelector('extensions-manager')?.shadowRoot
      ?.querySelector('extensions-item-list')?.shadowRoot
      ?.querySelectorAll('extensions-item');
    return extensions?.[0]?.getAttribute('id') || '';
  });

  if (extensionId) {
    fs.writeFileSync(
      path.resolve(__dirname, '.extension-id'),
      extensionId,
    );
    console.log(`Extension ID: ${extensionId}`);
  }

  await context.close();
  await browser.close();
}

export default globalSetup;
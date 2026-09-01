import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  const extensionIdPath = path.resolve(__dirname, '.extension-id');

  if (fs.existsSync(extensionIdPath)) {
    fs.unlinkSync(extensionIdPath);
  }

  console.log('Global teardown completed');
}

export default globalTeardown;
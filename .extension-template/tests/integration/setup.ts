import { chromium, Browser, Page } from 'playwright';

declare global {
  var __BROWSER__: Browser;
  var __PAGE__: Page;
}

beforeAll(async () => {
  global.__BROWSER__ = await chromium.launch({ headless: true });
});

afterAll(async () => {
  await global.__BROWSER__.close();
});

beforeEach(async () => {
  global.__PAGE__ = await global.__BROWSER__.newPage();
  await global.__PAGE__.goto('chrome-extension://test/popup.html');
});

afterEach(async () => {
  await global.__PAGE__.close();
});

jest.setTimeout(60000);
// @ts-check
const path = require('path');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:19365',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 19365',
    cwd: path.join(__dirname),
    url: 'http://127.0.0.1:19365',
    reuseExistingServer: !process.env.CI,
  },
};

module.exports = config;

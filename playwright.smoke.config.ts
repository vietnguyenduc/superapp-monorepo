import { defineConfig, devices } from '@playwright/test';

// Reuse the WSL systemd services; never start duplicate Vite servers.
export default defineConfig({
  testDir: './tests/smoke',
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { screenshot: 'on', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
  ],
});

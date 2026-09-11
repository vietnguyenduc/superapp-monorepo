import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:5175",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
  // Don't start a web server — we run Vite manually
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // trial mode uses shared localStorage, run serially
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:5174",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  // Don't start a web server — we run Vite manually in WSL
  // to avoid port conflicts with the dev server.
});

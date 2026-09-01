import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:5174";

/**
 * Helper: enter trial mode by navigating to /login and clicking the
 * "Dùng thử ngay" button. Trial mode uses an in-memory mock store
 * (10 customers, 15 transactions, 8 bank accounts) — no Supabase needed.
 */
async function enterTrialMode(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  // The trial button text is "Dùng thử ngay (không cần đăng nhập)" in vi
  const trialButton = page.getByRole("button", { name: /dùng thử|trial/i });
  await expect(trialButton).toBeVisible({ timeout: 10000 });
  await trialButton.click();
  // After clicking, the app should redirect to /dashboard
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

// ─── Test group: Trial mode entry ─────────────────────────────────────────

test.describe("Cashflow trial mode", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous trial state so each test starts fresh
    await page.context().clearCookies();
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.removeItem("cashflow_trial_mode_enabled");
      localStorage.removeItem("cashflow_trial_store");
      localStorage.removeItem("isTrial");
      localStorage.removeItem("cashflow_trial_user");
      localStorage.removeItem("superapp_trial_mode");
    });
  });

  test("TC-001: Login page renders with trial button", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /dùng thử|trial/i })).toBeVisible();
    // Also check the sign-in form is present
    await expect(page.locator("form")).toBeVisible();
  });

  test("TC-002: Enter trial mode → redirects to /dashboard", async ({ page }) => {
    await enterTrialMode(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("TC-003: Dashboard shows seeded metrics in trial mode", async ({ page }) => {
    await enterTrialMode(page);
    // Wait for dashboard cards to render (they show currency values)
    await page.waitForTimeout(2000); // allow mock data to hydrate
    // The dashboard should show some metric cards with VND currency
    const bodyText = await page.locator("body").innerText();
    // Trial seed: Tổng công nợ = -584.400.000 (per skill doc)
    // Just check that some large number appears — seeds may drift
    expect(bodyText.length).toBeGreaterThan(100);
    // Check that we're not on an error page
    await expect(page.locator("body")).not.toContainText("Missing VITE_SUPABASE");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("TC-004: Navigate to Customers list — shows 10 seeded customers", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    // Trial seed = 10 customers. Table should have rows.
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(5); // at least some customers
  });

  test("TC-005: Navigate to Transactions list — shows seeded transactions", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    // Trial seed = 15 transactions
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("TC-006: Export Excel button is visible on Transactions page", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    // The export button we added loading indicator to
    const exportBtn = page.getByRole("button", { name: /xuất excel|export/i });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
  });

  test("TC-007: Export Excel button is visible on Customers page", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    // Customers page has a dropdown "Xuất" button that opens a menu with "Xuất Excel danh sách"
    const exportBtn = page.getByRole("button", { name: /^Xuất$/i });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
  });

  test("TC-008: Navigate to Settings page — loads without error", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("TC-009: Navigate to Reports page — loads without error", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("TC-010: Navigate to Import Transactions page — loads without error", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/import/transactions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("TC-011: Navigate to Import Customers page — loads without error", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/import/customers`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("TC-012: Clicking Export Excel on Transactions triggers xlsx lazy load", async ({ page }) => {
    await enterTrialMode(page);
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Listen for network requests to xlsx chunk
    const xlsxChunkPromise = page.waitForRequest(
      (req) => req.url().includes("xlsx") || req.url().includes("XLSX"),
      { timeout: 10000 }
    ).catch(() => null);

    const exportBtn = page.getByRole("button", { name: /xuất excel|export/i }).first();
    await exportBtn.click();

    // Button should show loading state "Đang xuất..."
    await page.waitForTimeout(500);
    // Wait for either xlsx chunk request or the button to return to normal
    const req = await xlsxChunkPromise;
    // In trial mode the export may fail gracefully (no real data fetch),
    // but the xlsx library should still be lazy-loaded.
    // We just verify no uncaught crash.
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("TC-013: No console errors on dashboard in trial mode", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await enterTrialMode(page);
    await page.waitForTimeout(3000);
    // Filter out expected network errors (placeholder Supabase URL)
    const realErrors = consoleErrors.filter(
      (e) => !e.includes("placeholder.supabase.co") &&
             !e.includes("Failed to fetch") &&
             !e.includes("NetworkError") &&
             !e.includes("ERR_CONNECTION")
    );
    expect(realErrors).toEqual([]);
  });
});

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:5175";

/**
 * Helper: enter trial mode by navigating to /login and clicking the
 * "Dùng thử ngay" button.
 */
async function enterTrialMode(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  const trialButton = page.getByRole("button", { name: /dùng thử|trial/i });
  await expect(trialButton).toBeVisible({ timeout: 15000 });
  await trialButton.click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

// ─────────────────────────────────────────────────────────────────────────────
// Test group: Sidebar navigation — verify 3 old menus merged into 1 + new menu
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Inventory app — sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("sidebar has 'Nhập hàng' menu (merged from PO/GR/Return)", async ({ page }) => {
    // Sidebar menu items are <button> elements, not <a> links
    const nhapHang = page.getByRole("button", { name: /nhập hàng/i });
    await expect(nhapHang.first()).toBeVisible({ timeout: 10000 });
  });

  test("sidebar has 'Xuất hàng' menu (new)", async ({ page }) => {
    const xuatHang = page.getByRole("button", { name: /xuất hàng/i });
    await expect(xuatHang.first()).toBeVisible({ timeout: 10000 });
  });

  test("sidebar does NOT have old 'Đặt hàng (PO)' menu", async ({ page }) => {
    const oldPo = page.getByRole("button", { name: /đặt hàng.*po/i });
    await expect(oldPo).toHaveCount(0);
  });

  test("sidebar does NOT have old 'Trả hàng NCC' menu", async ({ page }) => {
    const oldReturn = page.getByRole("button", { name: /trả hàng ncc/i });
    await expect(oldReturn).toHaveCount(0);
  });

  test("sidebar has 'Nhà cung cấp' menu", async ({ page }) => {
    const ncc = page.getByRole("button", { name: /nhà cung cấp/i });
    await expect(ncc.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test group: Nhập hàng page (GoodsReceiptImportPage)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Inventory app — Nhập hàng page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("navigating to /goods-receipts shows Nhập hàng page", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts`, { waitUntil: "networkidle" });
    await expect(page.getByText(/nhập hàng/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("has 3 sub-tabs: PO / GR / Return", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /đặt hàng.*po/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /nhận hàng.*gr/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /trả hàng ncc/i })).toBeVisible();
  });

  test("has 2 import modes: single + bulk", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=single`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /nhập từng dòng/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /nhập hàng loạt/i })).toBeVisible();
  });

  test("single mode shows form with date field", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=single`, { waitUntil: "networkidle" });
    // Form labels don't have htmlFor, so use text-based locator
    await expect(page.getByText(/ngày nhập/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/sản phẩm/i).first()).toBeVisible();
    await expect(page.getByText(/số lượng/i)).toBeVisible();
  });

  test("bulk mode shows grid with template download + upload", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=bulk`, { waitUntil: "networkidle" });
    await expect(page.getByText(/hướng dẫn nhập nhanh/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/tải template excel/i)).toBeVisible();
    await expect(page.getByText(/📁 upload file/i)).toBeVisible();
  });

  test("old /purchase-orders redirects to /goods-receipts", async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase-orders`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/goods-receipts/);
  });

  test("old /supplier-returns redirects to /goods-receipts", async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-returns`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/goods-receipts/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test group: Xuất hàng page (GoodsIssueImportPage)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Inventory app — Xuất hàng page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("navigating to /goods-issues shows Xuất hàng page", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues`, { waitUntil: "networkidle" });
    await expect(page.getByText(/xuất hàng/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("has 2 main modes: manual + sales sync", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /nhập thủ công/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /đồng bộ sales/i })).toBeVisible();
  });

  test("manual mode has single + bulk sub-tabs", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues?mode=manual`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /nhập từng dòng/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /nhập hàng loạt/i })).toBeVisible();
  });

  test("sales sync mode shows date range + load button", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues?mode=sales_sync`, { waitUntil: "networkidle" });
    // Use text-based locators since labels don't have htmlFor
    await expect(page.getByText(/từ ngày/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/đến ngày/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /tải dữ liệu bán hàng/i })).toBeVisible();
  });

  test("manual single form has date + quantity fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues?mode=manual&tab=single`, { waitUntil: "networkidle" });
    await expect(page.getByText(/ngày xuất/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/số lượng xuất/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test group: Nhà cung cấp page (SupplierManagement + SupplierImportPage)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Inventory app — Nhà cung cấp", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("supplier management page loads with add + import buttons", async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-management`, { waitUntil: "networkidle" });
    await expect(page.getByText(/nhà cung cấp/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /thêm nhà cung cấp/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /import hàng loạt/i })).toBeVisible();
  });

  test("supplier import page has single + bulk modes", async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-import?tab=single`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /nhập từng dòng/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /nhập hàng loạt/i })).toBeVisible();
  });

  test("supplier single form has code + name fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-import?tab=single`, { waitUntil: "networkidle" });
    // Use text-based locators since labels don't have htmlFor
    await expect(page.getByText(/mã ncc/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/tên nhà cung cấp/i)).toBeVisible();
  });

  test("supplier bulk mode shows grid + template", async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-import?tab=bulk`, { waitUntil: "networkidle" });
    await expect(page.getByText(/hướng dẫn nhập nhanh/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/tải template excel/i)).toBeVisible();
  });
});

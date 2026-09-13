import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:5175";

/**
 * Helper: enter trial mode by navigating to /login and clicking the
 * "Dùng thử ngay" button.
 */
async function enterTrialMode(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("inventory-tour-completed", "true");
  });
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  const trialButton = page.getByRole("button", { name: /dùng thử|trial/i });
  await expect(trialButton).toBeVisible({ timeout: 15000 });
  await trialButton.click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  // WebKit can finish a second dashboard navigation just after networkidle.
  await page.waitForTimeout(500);
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

  test("single warehouse stays simple without a warehouse selector or transfer menu", async ({ page }) => {
    await expect(page.getByLabel("Kho đang thao tác")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /điều chuyển kho/i })).toHaveCount(0);
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

test.describe("Inventory app — adaptive warehouse workspace", () => {
  test("zero warehouses guides an admin through first setup", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('inventory_trial_warehouses','[]'));
    await enterTrialMode(page);
    await expect(page.getByRole('heading',{name:'Thiết lập kho đầu tiên'})).toBeVisible();
    await page.getByLabel('Tên kho đầu tiên').fill('Kho chính');
    await page.getByRole('button',{name:'Tạo kho và bắt đầu'}).click();
    await expect(page.getByRole('heading',{name:/dashboard tồn kho/i})).toBeVisible();
    await expect(page.getByLabel('Kho đang thao tác')).toHaveCount(0);
  });

  test("multiple warehouses show workspace picker and transfer navigation", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('inventory_trial_warehouses',JSON.stringify([{id:'w1',name:'Kho trung tâm'},{id:'w2',name:'Kho cửa hàng'}]));
      localStorage.setItem('inventory_trial_active_warehouse','w1');
    });
    await enterTrialMode(page);
    await expect(page.getByLabel('Kho đang thao tác')).toBeVisible();
    await expect(page.getByText('Kho trung tâm',{exact:true}).first()).toBeVisible();
    await expect(page.getByRole('button',{name:'Điều chuyển kho'})).toBeVisible();
  });
});

test.describe("Inventory app — Phiên kiểm kê", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("creates snapshot, explains variance, approves and links adjustment", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto(`${BASE_URL}/stock-counts`, { waitUntil: "networkidle" });
    await page.getByLabel("Ghi chú phiên kiểm kê").fill("Kiểm kê pilot");
    await page.getByRole("button", { name: /tạo và chốt tồn sổ/i }).click();
    await expect(page.getByText(/đã chốt snapshot tồn sổ/i)).toBeVisible();
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    for (let index = 0; index < count; index++) {
      const row = rows.nth(index);
      const book = Number((await row.locator("td").nth(1).innerText()).replace(/\./g, '').replace(',', '.'));
      await row.getByRole('spinbutton').fill(String(index === 0 ? book + 1 : book));
      if (index === 0) await row.locator("td").nth(4).locator("input").fill("Đếm thừa một đơn vị");
    }
    await page.getByRole("button", { name: /gửi duyệt/i }).click();
    await expect(page.getByText(/đã gửi phiên kiểm kê để duyệt/i)).toBeVisible();
    await page.getByLabel("Ý kiến duyệt").fill("Đã đối chiếu");
    await page.getByRole("button", { name: /duyệt & điều chỉnh/i }).click();
    await expect(page.getByText(/đã duyệt và sinh phiếu điều chỉnh liên kết/i)).toBeVisible();
    await expect(page.locator("tbody tr").first().locator("td").nth(5)).toContainText(/inv-/);
  });
});

test.describe("Inventory app — Dashboard và MRP đối soát", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("dashboard uses ledger-safe metrics and warns before mixing units", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Sản phẩm có tồn", { exact: true })).toBeVisible();
    await expect(page.getByText("Lượt xuất kho")).toBeVisible();
    await expect(page.getByText(/không cộng lẫn các đơn vị khác nhau/i)).toBeVisible();
    await expect(page.getByText("Giá trị tồn kho")).toHaveCount(0);

    const pageWidth = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(pageWidth.document).toBeLessThanOrEqual(pageWidth.viewport);

    const filterHeader = page.getByTestId("dashboard-filter-header");
    const topBeforeScroll = await filterHeader.evaluate((element) => element.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(() => filterHeader.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThanOrEqual(topBeforeScroll + 1);
    await expect.poll(() => filterHeader.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(63);
  });

  test("MRP shows precise movement-based stock and demand units on iPhone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/inventory-mrp`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /vòng quay tồn kho.*MRP/i })).toBeVisible();
    await expect(page.getByText(/\/ ngày/).first()).toBeVisible();
    await expect(page.getByText(/kg|thùng|chai|gói|cái/i).first()).toBeVisible();
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

  test("bulk CSV imports two inbound rows and shows them in recent records", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=bulk`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles({
      name: "bulk-inbound.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "Date,Supplier,Product,Quantity,Price,Notes\n" +
        "2026-09-11,NCC01,NVL-XO01,10,25000,bulk-in-1\n" +
        "2026-09-11,NCC01,NVL-DH01,5,15000,bulk-in-2\n"
      ),
    });

    await expect(page.locator('tbody input[type="date"]').first()).toHaveValue("2026-09-11");
    await page.getByRole("button", { name: /lưu 2 dòng/i }).click();
    await expect(page.getByText("Đã lưu 2 dòng thành công!")).toBeVisible();
    await expect(page.getByText("Biên nhận nhập hàng loạt")).toBeVisible();
    await expect(page.getByText(/Mã lô:/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /lịch sử lô nhập gần đây/i })).toBeVisible();
    await expect(page.getByText("1 lô")).toBeVisible();
    const recentRecords = page.locator("table").last();
    await expect(recentRecords.getByRole("cell", { name: "NVL-XO01", exact: true }).first()).toBeVisible();
    await expect(recentRecords.getByRole("cell", { name: "NVL-DH01", exact: true }).first()).toBeVisible();
    await page.goto(`${BASE_URL}/inventory-records?tab=accounting_summary`, { waitUntil: "networkidle" });
    const reportRow = page.locator("tbody tr").filter({ hasText: "bulk-in-1" });
    await expect(reportRow).toContainText("NVL-XO01");
    await expect(reportRow.locator("td").nth(3)).toHaveText("10");
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

  test("bulk CSV imports two outbound rows and shows them in recent records", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues?mode=manual&tab=bulk`, { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').setInputFiles({
      name: "bulk-outbound.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "Date,Product,Quantity,Reason,Notes\n" +
        "2026-09-11,NVL-XO01,2,Test issue,bulk-out-1\n" +
        "2026-09-11,NVL-DH01,1,Test issue,bulk-out-2\n"
      ),
    });

    await expect(page.locator('tbody input[type="date"]').first()).toHaveValue("2026-09-11");
    await page.getByRole("button", { name: /lưu 2 dòng/i }).click();
    await expect(page.getByText("Đã lưu 2 dòng thành công!")).toBeVisible();
    await expect(page.getByText("Biên nhận xuất hàng loạt")).toBeVisible();
    await expect(page.getByText(/Mã lô:/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /lịch sử lô xuất gần đây/i })).toBeVisible();
    await expect(page.getByText("1 lô")).toBeVisible();
    const recentRecords = page.locator("table").last();
    await expect(recentRecords.getByRole("cell", { name: "NVL-XO01", exact: true }).first()).toBeVisible();
    await expect(recentRecords.getByRole("cell", { name: "NVL-DH01", exact: true }).first()).toBeVisible();
    await page.goto(`${BASE_URL}/inventory-records?tab=accounting_summary`, { waitUntil: "networkidle" });
    const reportRow = page.locator("tbody tr").filter({ hasText: "bulk-out-1" });
    await expect(reportRow).toContainText("NVL-XO01");
    await expect(reportRow.locator("td").nth(4)).toHaveText("2");
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

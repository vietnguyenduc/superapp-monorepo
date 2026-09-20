import { test, expect, type Page } from "@playwright/test";
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

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

  test("sidebar has 'Nhập hàng' menu", async ({ page }) => {
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

  test("sidebar has the procurement workspace", async ({ page }) => {
    await expect(page.getByRole("button", { name: /mua.*trả ncc/i })).toBeVisible();
  });

  test("groups daily work into Nhập, Xuất and Xuất Nhập Tồn", async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nhập', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Xuất', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quản lý Xuất Nhập Tồn' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kế hoạch nhập (MRP)' })).toBeVisible();
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

  test("master admin can create the first warehouse", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('inventory_trial_warehouses','[]'));
    await enterTrialMode(page);
    await expect(page.getByLabel('Tên kho đầu tiên')).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Nhập hàng", exact: true })).toBeVisible({ timeout: 10000 });
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

  test("single receipt requires a product selection and saves the selected item", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=single`, { waitUntil: "networkidle" });
    await page.getByLabel("Sản phẩm *").fill("Xoài cát");
    await page.getByRole("button", { name: /Xoài cát Hòa Lộc.*NVL-XO01/i }).click();
    await page.getByRole("spinbutton").first().fill("2");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Lưu phiếu thành công!")).toBeVisible();
  });

  test("bulk mode shows grid with template download + upload", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=bulk`, { waitUntil: "networkidle" });
    await expect(page.getByText(/hướng dẫn nhập nhanh/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/tải template excel/i)).toBeVisible();
    await expect(page.getByText(/📁 upload file/i)).toBeVisible();
  });

  test("bulk mode blocks an entered row with zero quantity", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=bulk`, { waitUntil: "networkidle" });
    const firstRow = page.locator("tbody tr").first();
    await firstRow.locator("input").nth(2).fill("NVL-XO01");
    await firstRow.locator("input").nth(3).fill("0");
    await expect(page.getByRole("alert")).toContainText("1 dòng chưa hợp lệ");
    await expect(page.getByRole("button", { name: /lưu 0 dòng/i })).toBeDisabled();
  });

  test("supplier name matching changes the bulk grid and template contract", async ({ page }) => {
    await page.goto(`${BASE_URL}/settings?tab=import-export`, { waitUntil: "networkidle" });
    await page.getByLabel("Đối chiếu nhà cung cấp khi nhập kho").selectOption("full_name");
    await page.goto(`${BASE_URL}/goods-receipts?subTab=gr&tab=bulk`, { waitUntil: "networkidle" });
    await expect(page.getByRole("columnheader", { name: "Tên NCC" })).toBeVisible();
    await expect(page.getByText(/Ngày · Tên NCC · Mã hàng/)).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /tải template excel/i }).click();
    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const xlsx = (XLSX as any).default || XLSX;
    const workbook = xlsx.read(readFileSync(filePath!), { type: "buffer" });
    const templateRows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }) as unknown[][];
    expect(templateRows[0]?.[1]).toBe("Tên NCC");
    expect(templateRows[1]?.[1]).toBe("Công ty TNHH Bao Bì Xanh");
    const uploadWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(uploadWorkbook, xlsx.utils.aoa_to_sheet([
      ["Ngày", "Tên NCC", "Mã hàng", "Số lượng", "Đơn giá", "Ghi chú"],
      ["2026-09-13", "Công ty TNHH Bao Bì Xanh", "NVL-XO01", 2, 25000, "name-match"],
    ]), "Nhập hàng");
    await page.locator('input[type="file"]').setInputFiles({
      name: "bulk-inbound-by-supplier-name.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: xlsx.write(uploadWorkbook, { type: "buffer", bookType: "xlsx" }),
    });
    await page.getByRole("button", { name: /lưu 1 dòng/i }).click();
    await expect(page.getByText("Đã lưu 1 dòng thành công!")).toBeVisible();
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

  test("old /purchase-orders redirects to the procurement PO tab", async ({ page }) => {
    await page.goto(`${BASE_URL}/purchase-orders`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/procurement\?tab=po/);
  });

  test("old /supplier-returns redirects to the procurement return tab", async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-returns`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/procurement\?tab=return/);
  });
});

test.describe("Inventory app — Mua & trả NCC", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("separates PO from supplier returns and explains the stock boundary", async ({ page }) => {
    await page.goto(`${BASE_URL}/procurement?tab=po`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /mua hàng.*trả nhà cung cấp/i })).toBeVisible();
    await expect(page.getByText(/PO là kế hoạch mua/i)).toBeVisible();
    await page.getByRole("button", { name: "Trả hàng NCC" }).click();
    await expect(page.getByText(/cần duyệt trước khi xuất kho/i)).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Xuất hàng", exact: true })).toBeVisible({ timeout: 10000 });
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

  test("manual single form saves the product selected from search", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues?mode=manual&tab=single`, { waitUntil: "networkidle" });
    await page.getByLabel("Sản phẩm *").fill("Xoài cát");
    await page.getByRole("button", { name: /Xoài cát Hòa Lộc.*NVL-XO01/i }).click();
    await page.getByRole("spinbutton").fill("1");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Lưu phiếu xuất thành công!")).toBeVisible();
  });

  test("bulk mode blocks an entered row with zero quantity", async ({ page }) => {
    await page.goto(`${BASE_URL}/goods-issues?mode=manual&tab=bulk`, { waitUntil: "networkidle" });
    const firstRow = page.locator("tbody tr").first();
    await firstRow.locator("input").nth(1).fill("NVL-XO01");
    await firstRow.locator("input").nth(2).fill("0");
    await expect(page.getByRole("alert")).toContainText("1 dòng chưa hợp lệ");
    await expect(page.getByRole("button", { name: /lưu 0 dòng/i })).toBeDisabled();
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

test.describe("Inventory app — downloadable import templates", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await enterTrialMode(page);
  });

  test("accounting inventory template has one value for every declared column", async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory-transaction-import?tab=bulk`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Kế toán kho/)).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /tải file mẫu/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("import_template_ke_toan.xlsx");
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const xlsx = (XLSX as any).default || XLSX;
    const workbook = xlsx.read(readFileSync(filePath!), { type: "buffer" });
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
      header: 1,
      defval: "",
    }) as unknown[][];

    expect(rows[0]).toEqual(["Ngày", "Mã hàng", "Tên hàng", "Nhập sổ", "Giá nhập", "Xuất sổ", "Ghi chú"]);
    expect(rows.slice(1)).toHaveLength(2);
    for (const row of rows.slice(1)) expect(row).toHaveLength(rows[0].length);
    expect(rows[1]?.slice(3)).toEqual([20, 50000, 0, "Nhập sổ"]);
    expect(rows[2]?.slice(3)).toEqual([10, 30000, 2, "Điều chỉnh chứng từ"]);
  });

  test("receipt, issue, supplier and product templates preserve their upload column order", async ({ page }) => {
    const cases = [
      {
        url: "/goods-receipts?subTab=gr&tab=bulk",
        button: /tải template excel/i,
        filename: "template_nhap_hang.xlsx",
        headers: ["Ngày", "Mã NCC", "Mã hàng *", "Số lượng", "Đơn giá", "Ghi chú"],
      },
      {
        url: "/goods-issues?mode=manual&tab=bulk",
        button: /tải template excel/i,
        filename: "template_xuat_hang.xlsx",
        headers: ["Ngày", "Mã hàng *", "Số lượng", "Lý do", "Ghi chú"],
      },
      {
        url: "/supplier-import?tab=bulk",
        button: /tải template excel/i,
        filename: "template_nha_cung_cap.xlsx",
        headers: ["Mã NCC *", "Tên NCC *", "Điện thoại", "Email", "Địa chỉ", "Ghi chú"],
      },
      {
        url: "/product-catalog-import?tab=bulk",
        button: /tải file mẫu chuẩn/i,
        filename: "template-san-pham.xlsx",
        headers: ["Mã sản phẩm", "Tên sản phẩm", "Danh mục", "Đơn vị nhập", "Đơn vị xuất", "Đơn vị trung gian", "Tỷ lệ quy đổi sơ chế", "Định mức thành phẩm", "Giá nhập", "Giá bán", "Trạng thái", "Ghi chú"],
      },
    ];

    for (const item of cases) {
      await page.goto(`${BASE_URL}${item.url}`, { waitUntil: "domcontentloaded" });
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: item.button }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe(item.filename);
      const filePath = await download.path();
      expect(filePath).toBeTruthy();
      const xlsx = (XLSX as any).default || XLSX;
      const workbook = xlsx.read(readFileSync(filePath!), { type: "buffer" });
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
        header: 1,
        defval: "",
      }) as unknown[][];
      expect(rows[0]).toEqual(item.headers);
      for (const row of rows.slice(1)) expect(row).toHaveLength(item.headers.length);
    }
  });
});

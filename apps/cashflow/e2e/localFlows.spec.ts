import { test, expect, type Page } from "@playwright/test";

const timestamp = () => `${Date.now()}`.slice(-6);

async function startTrial(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: /Dùng thử ngay/i }).click();
  await page.waitForURL(/\/dashboard/);
}

// Helpers for label + sibling input/select because the mobile UI uses plain <label>/<input> pairs.
function inputFor(page: Page, label: string) {
  return page.locator(`label:has-text("${label}") + input`);
}

function selectFor(page: Page, label: string) {
  return page.locator(`label:has-text("${label}") + select`);
}

function datalistFor(page: Page, label: string) {
  return page.locator(`label:has-text("${label}") + input[list]`);
}

test.describe("Trial mode create flows", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.setTimeout(60000);

  test("creates bank account, branch, and transaction linked to both", async ({ page }) => {
    await startTrial(page);

    const bankName = `Playwright Bank ${timestamp()}`;
    const accountNumber = `9999${timestamp()}`;
    const accountName = `TK Playwright ${timestamp()}`;
    const branchName = `VP Playwright ${timestamp()}`;

    // 1. Create bank account
    await page.goto("/settings");
    await page.getByRole("button", { name: /Tài khoản ngân hàng/i }).click();
    await page.getByRole("button", { name: /Thêm tài khoản/i }).click();

    await inputFor(page, "Tên ngân hàng").fill(bankName);
    await inputFor(page, "Số tài khoản").fill(accountNumber);
    await inputFor(page, "Tên tài khoản").fill(accountName);
    await inputFor(page, "Loại tài khoản").fill("current");
    await inputFor(page, "Số dư đầu kỳ").fill("1000000");

    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText(accountName)).toBeVisible();

    // 2. Create branch
    await page.getByRole("button", { name: /Văn phòng/i }).click();
    await page.getByRole("button", { name: /Thêm văn phòng/i }).click();

    await inputFor(page, "Tên văn phòng").fill(branchName);
    await inputFor(page, "Địa chỉ").fill("123 Đường Test");
    await inputFor(page, "Số điện thoại").fill("0123456789");

    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText(branchName)).toBeVisible();

    // 3. Create transaction linked to bank account and branch
    await page.goto("/import/transactions");

    await inputFor(page, "Thời gian").fill("04/08/2026");

    // customer_code datalist: type a full valid option to avoid "add new customer" modal
    await datalistFor(page, "Mã khách hàng").fill("CUST0001 - Công ty TNHH ABC");

    // transaction_type select (only one on the page)
    const typeSelect = page.locator("select").nth(0);
    await expect.poll(async () => await typeSelect.locator("option").count()).toBeGreaterThan(1);
    await typeSelect.selectOption("Phát sinh giảm");

    // Amount: fill and blur to trigger formatting
    const amountInput = inputFor(page, "Số tiền");
    await amountInput.fill("500000");
    await amountInput.evaluate((el: HTMLInputElement) => el.blur());

    // bank_account and branch are datalist inputs on mobile
    await datalistFor(page, "Tài khoản ngân hàng").fill(`${accountName} - ${accountNumber}`);

    const branchInput = datalistFor(page, "Văn phòng");
    await branchInput.fill(branchName);
    await branchInput.evaluate((el: HTMLInputElement) => el.blur());

    await page.getByRole("button", { name: /Nhập dữ liệu/i }).first().click();
    await expect(page.getByText(/Nhập giao dịch thành công/i)).toBeVisible();

    // 4. Verify the saved transaction links to the created bank account and branch
    const lastTx = await page.evaluate(() => {
      const raw = localStorage.getItem("cashflow_trial_store");
      if (!raw) return null;
      const store = JSON.parse(raw);
      const txs = store.transactions || [];
      return txs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    });

    expect(lastTx).toBeTruthy();
    expect(lastTx.bank_account_id).toBeTruthy();
    expect(lastTx.branch_id).toBeTruthy();
    expect(lastTx.bank_account_name || "").toContain(accountName);
    expect(lastTx.branch_name || "").toContain(branchName);
  });
});

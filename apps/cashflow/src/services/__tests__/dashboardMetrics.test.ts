import { describe, it, expect, beforeEach } from "vitest";
import { databaseService } from "../database";

const STORAGE_KEYS = {
  customers: "cashflow_customers",
  transactions: "cashflow_transactions",
  bankAccounts: "cashflow_bank_accounts",
};

const buildIsoDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

describe("dashboardService.getDashboardMetrics", () => {
  beforeEach(() => {
    window.localStorage.clear();

    const customers = [
      {
        id: "cust-1",
        customer_code: "CUST001",
        full_name: "Test Customer",
        total_balance: 0,
        is_active: true,
        created_at: buildIsoDate(-40),
        updated_at: buildIsoDate(-40),
      },
    ];

    const bankAccounts = [
      {
        id: "acc-1",
        account_name: "ACB - TK Vốn lưu động",
        account_number: "22012345678",
      },
      {
        id: "acc-2",
        account_name: "BIDV - TK Thanh toán",
        account_number: "3333",
      },
      {
        id: "acc-3",
        account_name: "Techcombank - TK tiết kiệm",
        account_number: "4444",
      },
    ];

    const transactions = [
      {
        id: "tx-1",
        transaction_code: "TXN0001",
        customer_id: "cust-1",
        bank_account_id: "acc-1",
        branch_id: "1",
        transaction_type: "payment",
        amount: 1000,
        transaction_date: buildIsoDate(-10),
        created_at: buildIsoDate(-10),
        updated_at: buildIsoDate(-10),
      },
      {
        id: "tx-2",
        transaction_code: "TXN0002",
        customer_id: "cust-1",
        bank_account_id: "acc-1",
        branch_id: "1",
        transaction_type: "refund",
        amount: 200,
        transaction_date: buildIsoDate(-7),
        created_at: buildIsoDate(-7),
        updated_at: buildIsoDate(-7),
      },
      {
        id: "tx-3",
        transaction_code: "TXN0003",
        customer_id: "cust-1",
        bank_account_id: "acc-1",
        branch_id: "1",
        transaction_type: "charge",
        amount: 500,
        transaction_date: buildIsoDate(-5),
        created_at: buildIsoDate(-5),
        updated_at: buildIsoDate(-5),
      },
      {
        id: "tx-4",
        transaction_code: "TXN0004",
        customer_id: "cust-1",
        bank_account_id: "acc-1",
        branch_id: "1",
        transaction_type: "adjustment",
        amount: -50,
        transaction_date: buildIsoDate(-3),
        created_at: buildIsoDate(-3),
        updated_at: buildIsoDate(-3),
      },
    ];

    window.localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
    window.localStorage.setItem(STORAGE_KEYS.bankAccounts, JSON.stringify(bankAccounts));
    window.localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  });

  it("keeps bank account balance stable across time ranges", async () => {
    const expectedBalance = 750; // payment 1000 - refund 200 + adjustment -50

    const monthMetrics = await databaseService.dashboard.getDashboardMetrics(
      undefined,
      "month",
      { day: 7, week: 6, month: 3, quarter: 4 },
    );
    const weekMetrics = await databaseService.dashboard.getDashboardMetrics(
      undefined,
      "week",
      { day: 7, week: 6, month: 3, quarter: 4 },
    );

    const monthAccount = monthMetrics.data?.balanceByBankAccount[0];
    const weekAccount = weekMetrics.data?.balanceByBankAccount[0];

    expect(monthAccount?.balance).toBe(expectedBalance);
    expect(weekAccount?.balance).toBe(expectedBalance);
    expect(monthAccount?.historical_data?.slice(-1)[0]?.balance).toBe(expectedBalance);
    expect(weekAccount?.historical_data?.slice(-1)[0]?.balance).toBe(expectedBalance);
  });
});

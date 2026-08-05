import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setTrialMode, trialGet } from "../trialMockStore";
import { transactionService } from "../transactionService";

const baseTxn = {
  transaction_code: "TXN-TEST-001",
  customer_id: "1",
  bank_account_id: "1",
  transaction_type: "payment",
  amount: 1_000_000,
  transaction_date: "2024-02-01T10:00:00Z",
  description: "Test payment",
  reference_number: "REF-001",
  branch_id: "trial-branch",
  company_id: "trial-company",
  created_by: "test-user",
};

describe("transaction balance sync (trial mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setTrialMode(true);
  });

  afterEach(() => {
    setTrialMode(false);
    localStorage.clear();
    sessionStorage.clear();
  });

  it("createTransaction updates customer total_balance and bank account balance for payment", async () => {
    const result = await transactionService.createTransaction(baseTxn);
    expect(result.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number; last_transaction_date?: string }[];
    const banks = (trialGet("bank_accounts") || []) as { id: string; balance: number }[];

    const customer = customers.find((c) => c.id === "1");
    const bank = banks.find((b) => b.id === "1");

    expect(customer?.total_balance).toBe(-85_000_000 + 1_000_000); // payment reduces debt
    expect(customer?.last_transaction_date).toBe("2024-02-01T10:00:00Z");
    expect(bank?.balance).toBe(150_000_000 + 1_000_000); // payment increases bank cash
  });

  it("createTransaction with charge does not change bank cash but increases customer debt", async () => {
    const result = await transactionService.createTransaction({ ...baseTxn, transaction_code: "TXN-TEST-002", transaction_type: "charge" });
    expect(result.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number }[];
    const banks = (trialGet("bank_accounts") || []) as { id: string; balance: number }[];

    const customer = customers.find((c) => c.id === "1");
    const bank = banks.find((b) => b.id === "1");

    expect(customer?.total_balance).toBe(-85_000_000 - 1_000_000);
    expect(bank?.balance).toBe(150_000_000); // charge has no cash effect
  });

  it("updateTransaction adjusts balances when amount changes", async () => {
    const createResult = await transactionService.createTransaction(baseTxn);
    const createdId = (createResult.data as { id: string }).id;

    const updateResult = await transactionService.updateTransaction(createdId, {
      ...baseTxn,
      amount: 2_000_000,
      transaction_type: "payment",
    });
    expect(updateResult.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number }[];
    const banks = (trialGet("bank_accounts") || []) as { id: string; balance: number }[];

    const customer = customers.find((c) => c.id === "1");
    const bank = banks.find((b) => b.id === "1");

    // payment 2M -> customer -85M + 2M, bank +2M
    expect(customer?.total_balance).toBe(-85_000_000 + 2_000_000);
    expect(bank?.balance).toBe(150_000_000 + 2_000_000);
  });

  it("updateTransaction moves balance between customers when customer_id changes", async () => {
    const createResult = await transactionService.createTransaction(baseTxn);
    const createdId = (createResult.data as { id: string }).id;

    const updateResult = await transactionService.updateTransaction(createdId, {
      ...baseTxn,
      customer_id: "2",
    });
    expect(updateResult.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number }[];
    const customer1 = customers.find((c) => c.id === "1");
    const customer2 = customers.find((c) => c.id === "2");

    expect(customer1?.total_balance).toBe(-85_000_000); // original restored
    expect(customer2?.total_balance).toBe(-72_000_000 + 1_000_000); // customer 2 original -72M + payment 1M
  });

  it("deleteTransaction reverses the balance impact", async () => {
    const createResult = await transactionService.createTransaction(baseTxn);
    const createdId = (createResult.data as { id: string }).id;

    const deleteResult = await transactionService.deleteTransaction(createdId);
    expect(deleteResult.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number }[];
    const banks = (trialGet("bank_accounts") || []) as { id: string; balance: number }[];

    const customer = customers.find((c) => c.id === "1");
    const bank = banks.find((b) => b.id === "1");

    expect(customer?.total_balance).toBe(-85_000_000);
    expect(bank?.balance).toBe(150_000_000);
  });

  it("createTransaction with negative payment reverses the direction (increases debt, cash out)", async () => {
    const result = await transactionService.createTransaction({
      ...baseTxn,
      transaction_code: "TXN-TEST-NEG-PAY",
      transaction_type: "payment",
      amount: -1_000_000,
    });
    expect(result.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number }[];
    const banks = (trialGet("bank_accounts") || []) as { id: string; balance: number }[];

    const customer = customers.find((c) => c.id === "1");
    const bank = banks.find((b) => b.id === "1");

    expect(customer?.total_balance).toBe(-85_000_000 - 1_000_000);
    expect(bank?.balance).toBe(150_000_000 - 1_000_000);
  });

  it("createTransaction with negative charge reduces customer debt and does not move cash", async () => {
    const result = await transactionService.createTransaction({
      ...baseTxn,
      transaction_code: "TXN-TEST-NEG-CHARGE",
      transaction_type: "charge",
      amount: -1_000_000,
    });
    expect(result.error).toBeFalsy();

    const customers = (trialGet("customers") || []) as { id: string; total_balance: number }[];
    const banks = (trialGet("bank_accounts") || []) as { id: string; balance: number }[];

    const customer = customers.find((c) => c.id === "1");
    const bank = banks.find((b) => b.id === "1");

    expect(customer?.total_balance).toBe(-85_000_000 + 1_000_000);
    expect(bank?.balance).toBe(150_000_000);
  });
});

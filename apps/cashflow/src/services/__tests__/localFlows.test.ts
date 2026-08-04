import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setTrialMode } from "../trialMockStore";
import { bankAccountService } from "../bankAccountService";
import { branchService } from "../branchService";
import { transactionService } from "../transactionService";

describe("Local trial create flows", () => {
  beforeEach(() => {
    setTrialMode(true);
  });

  afterEach(() => {
    setTrialMode(false);
  });

  it("creates a new bank account", async () => {
    const res = await bankAccountService.upsertBankAccount({
      bank_name: "Test Bank",
      account_number: "123456789",
      account_name: "TK Test",
      balance: 500000,
      company_id: "trial-company",
      branch_id: "trial-branch",
    });
    expect(res.error).toBeFalsy();
    expect(res.data).toBeTruthy();
    expect(res.data.bank_name).toBe("Test Bank");
    expect(res.data.account_number).toBe("123456789");
    expect(res.data.company_id).toBe("trial-company");
  });

  it("creates a new branch", async () => {
    const res = await branchService.upsertBranch({
      name: "Văn phòng Test",
      address: "123 Đường Test",
      phone: "0123456789",
      company_id: "trial-company",
      code: "BR-TEST",
    });
    expect(res.error).toBeFalsy();
    expect(res.data).toBeTruthy();
    expect(res.data.name).toBe("Văn phòng Test");
    expect(res.data.company_id).toBe("trial-company");
  });

  it("creates a transaction linked to a bank account and branch", async () => {
    const bank = await bankAccountService.upsertBankAccount({
      bank_name: "Bank TX",
      account_number: "999888",
      account_name: "TK TX",
      balance: 0,
      company_id: "trial-company",
      branch_id: "trial-branch",
    });
    expect(bank.data).toBeTruthy();

    const branch = await branchService.upsertBranch({
      name: "Branch TX",
      address: "",
      phone: "",
      company_id: "trial-company",
      code: "BR-TX",
    });
    expect(branch.data).toBeTruthy();

    const res = await transactionService.createTransaction({
      transaction_code: "TXN-001",
      transaction_type: "payment",
      amount: 1000000,
      transaction_date: new Date().toISOString(),
      customer_id: "trial-customer",
      bank_account_id: bank.data.id,
      branch_id: branch.data.id,
      company_id: "trial-company",
      description: "Test transaction",
    });
    expect(res.error).toBeFalsy();
    expect(res.data).toBeTruthy();
    expect(res.data.bank_account_id).toBe(bank.data.id);
    expect(res.data.branch_id).toBe(branch.data.id);
    expect(res.data.company_id).toBe("trial-company");

    const fetched = await transactionService.getTransactionById(res.data.id, "trial-company");
    expect(fetched.error).toBeFalsy();
    expect(fetched.data?.bank_accounts?.account_name).toBe("TK TX");
  });
});

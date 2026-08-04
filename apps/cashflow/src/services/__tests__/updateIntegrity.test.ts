import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setTrialMode } from "../trialMockStore";
import { apiClient } from "../supabase";
import { transactionService } from "../transactionService";
import { bankAccountService } from "../bankAccountService";
import { branchService } from "../branchService";
import { transactionTypeService } from "../transactionTypeService";

type QueryChain = {
  eq: () => QueryChain;
  neq: () => QueryChain;
  select: () => QueryChain;
  insert: () => QueryChain;
  update: (payload: Record<string, unknown>) => QueryChain;
  upsert: (payload: Record<string, unknown>[]) => QueryChain;
  delete: () => QueryChain;
  single: () => Promise<unknown>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
};

function buildChain(finalResult: unknown, captured: Record<string, unknown>[]): QueryChain {
  const chain: QueryChain = {
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn((payload: Record<string, unknown>) => {
      captured.push(payload);
      return chain;
    }),
    upsert: vi.fn((payload: Record<string, unknown>[]) => {
      captured.push(...payload);
      return chain;
    }),
    delete: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(finalResult)),
    then: (resolve) => Promise.resolve(finalResult).then(resolve),
  };
  return chain;
}

function mockFrom(captured: Record<string, unknown>[]) {
  (apiClient as unknown as { from: () => QueryChain }).from = vi.fn(() =>
    buildChain({ data: [], error: null }, captured)
  );
}

describe("update integrity (live mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    setTrialMode(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // updateCustomer was fixed in customerService.test.ts and should already pass.
  it("customer update payload never contains id, balances, or created_at", async () => {
    const captured: Record<string, unknown>[] = [];
    mockFrom(captured);

    const { customerService } = await import("../customerService");
    const result = await customerService.updateCustomer("cust-id", {
      customer_code: "C-1",
      full_name: "Updated",
      email: "u@example.com",
      phone: "0912345678",
      address: "A",
      working_method: "W",
      nguoi_dai_dien: "R",
      is_active: true,
    });

    expect(result.error).toBeFalsy();
    expect(captured.length).toBeGreaterThan(0);
    const payload = captured[captured.length - 1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("total_balance");
    expect(payload).not.toHaveProperty("opening_balance");
    expect(payload).not.toHaveProperty("created_at");
  });

  it("transaction update payload never contains id, created_at, or defaulted foreign keys", async () => {
    const captured: Record<string, unknown>[] = [];
    mockFrom(captured);

    await transactionService.updateTransaction("txn-id", {
      transaction_code: "TXN-1",
      transaction_type: "payment",
      amount: 100000,
      transaction_date: "2024-01-15",
      description: "Updated description",
    });

    expect(captured.length).toBeGreaterThan(0);
    const payload = captured[captured.length - 1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
    expect(payload).not.toHaveProperty("customer_id");
    expect(payload).not.toHaveProperty("bank_account_id");
    expect(payload).not.toHaveProperty("branch_id");
    expect(payload).not.toHaveProperty("company_id");
    expect(payload.description).toBe("Updated description");
    expect(payload.updated_at).toBeTruthy();
  });

  // Known bug: upsertBankAccount update path reuses transformRawBankAccount,
  // which sets balance to 0 and company_id/branch_id to null when not provided.
  it("bank account update payload never contains id, created_at, or defaulted balance/tenant fields", async () => {
    const captured: Record<string, unknown>[] = [];
    mockFrom(captured);

    await bankAccountService.upsertBankAccount({
      id: "bank-id",
      account_name: "Updated Account",
      account_number: "123456",
      bank_name: "Updated Bank",
    });

    expect(captured.length).toBeGreaterThan(0);
    const payload = captured[captured.length - 1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
    expect(payload).not.toHaveProperty("balance");
    expect(payload).not.toHaveProperty("company_id");
    expect(payload).not.toHaveProperty("branch_id");
    expect(payload.account_name).toBe("Updated Account");
    expect(payload.updated_at).toBeTruthy();
  });

  // Known bug: upsertBranch update path reuses transformRawBranch, which sets
  // company_id to null and overwrites created_at when not provided.
  it("branch update payload never contains id, created_at, or defaulted company_id", async () => {
    const captured: Record<string, unknown>[] = [];
    mockFrom(captured);

    await branchService.upsertBranch({
      id: "branch-id",
      name: "Updated Branch",
      code: "UB",
    });

    expect(captured.length).toBeGreaterThan(0);
    const payload = captured[captured.length - 1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
    expect(payload).not.toHaveProperty("company_id");
    expect(payload.name).toBe("Updated Branch");
    expect(payload.updated_at).toBeTruthy();
  });

  // Known bug: upsertTransactionType update path reuses transformRawTransactionType,
  // which sets color/impact_type/math_factor/is_active defaults and overwrites created_at.
  it("transaction type update payload never contains id, created_at, or defaulted fields", async () => {
    const captured: Record<string, unknown>[] = [];
    mockFrom(captured);

    await transactionTypeService.upsertTransactionType({
      id: "type-id",
      name: "Updated Type",
    });

    expect(captured.length).toBeGreaterThan(0);
    const payload = captured[captured.length - 1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
    expect(payload).not.toHaveProperty("color");
    expect(payload).not.toHaveProperty("math_factor");
    expect(payload).not.toHaveProperty("impact_type");
    expect(payload).not.toHaveProperty("is_active");
    expect(payload.name).toBe("Updated Type");
    expect(payload.updated_at).toBeTruthy();
  });
});

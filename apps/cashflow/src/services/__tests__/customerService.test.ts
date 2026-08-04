import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { customerService } from "../customerService";
import { setTrialMode, trialGet } from "../trialMockStore";
import { apiClient } from "../supabase";

// Lightweight shape for a customer row coming out of the trial seed store.
type TrialCustomer = Record<string, unknown>;

// Minimal thenable used to fake Supabase query chains in live-mode tests.
interface FakeChain {
  select: () => FakeChain;
  eq: () => FakeChain;
  neq: () => FakeChain;
  update: (payload: Record<string, unknown>) => FakeChain;
  single: () => Promise<unknown>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
}

describe("customerService.updateCustomer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    setTrialMode(false);
    vi.restoreAllMocks();
  });

  describe("trial mode", () => {
    beforeEach(() => {
      setTrialMode(true);
    });

    it("preserves id, company_id, branch_id, total_balance and created_at when editing a customer", async () => {
      const seedCustomers = trialGet("customers") as TrialCustomer[];
      expect(seedCustomers.length).toBeGreaterThan(0);
      const original = seedCustomers[0];

      const updateData = {
        customer_code: original.customer_code,
        full_name: "Updated Name",
        email: "updated@example.com",
        phone: "0987654321",
        address: "Updated address",
        working_method: "Updated working method",
        nguoi_dai_dien: "Updated representative",
        is_active: false,
      };

      const result = await customerService.updateCustomer(
        String(original.id),
        updateData,
      );

      expect(result.error).toBeFalsy();
      expect(result.data).toBeTruthy();

      const updated = result.data as TrialCustomer;
      expect(updated.id).toBe(original.id);
      expect(updated.company_id).toBe(original.company_id);
      expect(updated.branch_id).toBe(original.branch_id);
      expect(updated.total_balance).toBe(original.total_balance);
      expect(updated.created_at).toBe(original.created_at);
      expect(updated.full_name).toBe("Updated Name");
      expect(updated.email).toBe("updated@example.com");
      expect(updated.working_method).toBe("Updated working method");
      expect(updated.is_active).toBe(false);
      expect(updated.updated_at).not.toBe(original.updated_at);
    });

    it("does not allow changing customer_code to one already used by another customer", async () => {
      const seedCustomers = trialGet("customers") as TrialCustomer[];
      expect(seedCustomers.length).toBeGreaterThan(1);
      const [first, second] = seedCustomers;

      const result = await customerService.updateCustomer(String(first.id), {
        customer_code: second.customer_code,
        full_name: first.full_name,
      });

      expect(result.error).toBeTruthy();
      expect(result.error).toMatch(/already exists/);
    });
  });

  describe("live mode", () => {
    it("sends only the provided fields and updated_at, never id or balances", async () => {
      setTrialMode(false);
      const originalId = "cust-abc-123";
      const capturedUpdate: Record<string, unknown>[] = [];

      // Build a thenable Supabase-style chain that captures the update payload
      // and resolves all queries successfully.
      const buildChain = (finalResult: unknown): FakeChain => {
        const chain: FakeChain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          update: vi.fn((payload: Record<string, unknown>) => {
            capturedUpdate.push(payload);
            return chain;
          }),
          single: vi.fn(() => Promise.resolve(finalResult)),
          then: (resolve) => Promise.resolve(finalResult).then(resolve),
        };
        return chain;
      };

      (apiClient as unknown as { from: () => FakeChain }).from = vi.fn(() =>
        buildChain({ data: [], error: null }),
      );

      const updateData = {
        customer_code: "CUST-EDITED",
        full_name: "Edited Customer",
        email: "edit@example.com",
        phone: "0912345678",
        address: "Edited address",
        working_method: "Edited method",
        nguoi_dai_dien: "Edited rep",
        is_active: true,
      };

      const result = await customerService.updateCustomer(originalId, updateData);

      expect(result.error).toBeFalsy();
      expect(capturedUpdate.length).toBeGreaterThan(0);

      const payload = capturedUpdate[capturedUpdate.length - 1];
      // The primary key must never be part of the update payload.
      expect(payload).not.toHaveProperty("id");
      // Existing balances must not be reset by a partial edit.
      expect(payload).not.toHaveProperty("total_balance");
      expect(payload).not.toHaveProperty("opening_balance");
      expect(payload).not.toHaveProperty("created_at");
      // company_id/branch_id are not provided by the edit form and should not
      // be sent as null (they would be lost if the schema/RLS depends on them).
      expect(payload).not.toHaveProperty("company_id");
      expect(payload).not.toHaveProperty("branch_id");

      expect(payload.customer_code).toBe("CUST-EDITED");
      expect(payload.full_name).toBe("Edited Customer");
      expect(payload.email).toBe("edit@example.com");
      expect(payload.working_method).toBe("Edited method");
      expect(payload.nguoi_dai_dien).toBe("Edited rep");
      expect(payload.is_active).toBe(true);
      expect(payload.updated_at).toBeTruthy();
    });
  });
});

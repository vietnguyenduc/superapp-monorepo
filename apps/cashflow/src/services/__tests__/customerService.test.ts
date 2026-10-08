import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CustomerService, customerService } from "../customerService";
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
      expect(result.error).toMatch(/đã tồn tại/);
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

describe("customerService.getAllCustomersForLookup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads more than 1000 customers with a stable unique pagination order", async () => {
    const allCustomers = Array.from({ length: 1032 }, (_, index) => ({
      id: `customer-${String(index + 1).padStart(4, "0")}`,
      customer_code: String(index + 1),
      full_name: `Customer ${index + 1}`,
    }));

    const getCustomers = vi
      .spyOn(CustomerService, "getCustomers")
      .mockImplementation(async (filters) => {
        const offset = Number(filters?.offset ?? 0);
        const limit = Number(filters?.limit ?? 500);
        return {
          data: allCustomers.slice(offset, offset + limit) as never,
          error: null,
          count: allCustomers.length,
        };
      });

    const result = await CustomerService.getAllCustomersForLookup("company-1");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1032);
    expect(new Set(result.data.map((customer) => customer.id)).size).toBe(1032);
    expect(getCustomers).toHaveBeenCalledTimes(3);
    expect(getCustomers).toHaveBeenNthCalledWith(1, expect.objectContaining({
      company_id: "company-1",
      offset: 0,
      limit: 500,
      status: "all",
      sortBy: "id",
      sortOrder: "asc",
    }));
    expect(getCustomers).toHaveBeenNthCalledWith(3, expect.objectContaining({ offset: 1000 }));
  });
});

describe("customerService.getCustomers live pagination", () => {
  type QueryResult = {
    data: Record<string, unknown>[];
    error: null;
    count: number;
  };

  interface PagedQuery {
    select: (...args: unknown[]) => PagedQuery;
    eq: (...args: unknown[]) => PagedQuery;
    order: (...args: unknown[]) => PagedQuery;
    range: (from: number, to: number) => PagedQuery;
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
  }

  const buildPagedQuery = (rows: Record<string, unknown>[]) => {
    let from = 0;
    let to = 999;
    const rangeCalls: Array<[number, number]> = [];
    const chain: PagedQuery = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn((nextFrom: number, nextTo: number) => {
        from = nextFrom;
        to = nextTo;
        rangeCalls.push([nextFrom, nextTo]);
        return chain;
      }),
      then: (resolve, reject) =>
        Promise.resolve({
          // Mirror the hosted Supabase response cap, regardless of a larger
          // requested range.
          data: rows.slice(from, Math.min(to + 1, from + 1000)),
          error: null,
          count: rows.length,
        }).then(resolve, reject),
    };
    return { chain, rangeCalls };
  };

  beforeEach(() => {
    setTrialMode(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads every page before applying numeric customer-code sorting", async () => {
    const rows = Array.from({ length: 1032 }, (_, index) => ({
      id: `customer-${String(index + 1).padStart(4, "0")}`,
      customer_code: String(index + 1),
      full_name: `Customer ${index + 1}`,
      company_id: "company-1",
      status: "active",
      total_balance: 0,
    }));
    const { chain, rangeCalls } = buildPagedQuery(rows);
    vi.spyOn(apiClient, "from").mockReturnValue(chain as never);

    const result = await CustomerService.getCustomers({
      company_id: "company-1",
      limit: 20,
      offset: 0,
      sortBy: "customer_code",
      sortOrder: "asc",
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.count).toBe(1032);
    expect(result.data.map((customer) => customer.customer_code)).toEqual(
      Array.from({ length: 20 }, (_, index) => String(index + 1)),
    );
    expect(rangeCalls).toEqual([
      [0, 499],
      [500, 999],
      [1000, 1499],
    ]);
  });

  it("loads all rows for summaries and exports requesting more than 1000", async () => {
    const rows = Array.from({ length: 1032 }, (_, index) => ({
      id: `customer-${String(index + 1).padStart(4, "0")}`,
      customer_code: String(index + 1),
      full_name: `Customer ${index + 1}`,
      company_id: "company-1",
      status: "active",
      total_balance: index + 1,
      created_at: "2026-08-12T02:22:01.865Z",
    }));
    const { chain, rangeCalls } = buildPagedQuery(rows);
    vi.spyOn(apiClient, "from").mockReturnValue(chain as never);

    const result = await CustomerService.getCustomers({
      company_id: "company-1",
      limit: 10000,
      offset: 0,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.count).toBe(1032);
    expect(result.data).toHaveLength(1032);
    expect(new Set(result.data.map((customer) => customer.id)).size).toBe(1032);
    expect(rangeCalls).toEqual([
      [0, 499],
      [500, 999],
      [1000, 1499],
    ]);
  });
});

describe("customerService automatic customer codes", () => {
  beforeEach(() => {
    localStorage.clear();
    setTrialMode(true);
  });

  afterEach(() => {
    setTrialMode(false);
    vi.restoreAllMocks();
  });

  it("continues a four-digit numeric sequence with 1001 then 1002 without duplicates", async () => {
    const companyId = "trial-company";
    const base = await customerService.createCustomer({
      customer_code: "1000",
      full_name: "Mốc mã 1000",
      company_id: companyId,
    });
    expect(base.error).toBeFalsy();

    const options = {
      autoGenerateCode: true,
      codeSettings: {
        customer_code_prefix: "",
        customer_code_digits: 4,
        customer_code_fill_gaps: false,
      },
    };
    const first = await customerService.createCustomer(
      { customer_code: "mã xem trước", full_name: "Khách 1001", company_id: companyId },
      options,
    );
    const second = await customerService.createCustomer(
      { customer_code: "mã xem trước", full_name: "Khách 1002", company_id: companyId },
      options,
    );

    expect(first.error).toBeFalsy();
    expect(second.error).toBeFalsy();
    expect((first.data as TrialCustomer).customer_code).toBe("1001");
    expect((second.data as TrialCustomer).customer_code).toBe("1002");
    const generated = (trialGet("customers") as TrialCustomer[]).filter(
      (customer) => customer.company_id === companyId && ["1001", "1002"].includes(String(customer.customer_code)),
    );
    expect(generated).toHaveLength(2);
  });

  it("keeps a configured prefix unchanged in trial mode", async () => {
    const result = await customerService.createCustomer(
      { customer_code: "mã xem trước", full_name: "Khách tiền tố", company_id: "trial-prefix-company" },
      { autoGenerateCode: true, codeSettings: { customer_code_prefix: "kh-", customer_code_digits: 4 } },
    );
    expect(result.error).toBeFalsy();
    expect((result.data as TrialCustomer).customer_code).toBe("kh-0001");
  });
});

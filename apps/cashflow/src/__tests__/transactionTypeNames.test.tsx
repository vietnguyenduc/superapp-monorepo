import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock the database service before importing the context.
vi.mock("../services/database", () => ({
  databaseService: {
    transactionTypes: {
      getTransactionTypes: vi.fn(),
    },
  },
}));

// Mock @superapp/iam to provide useAuthContext
vi.mock("@superapp/iam", () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    isTrial: false,
    user: { id: "test-user", company_id: "tenant-1" },
  }),
}));

import { TransactionTypeProvider, useTransactionTypes } from "../contexts/TransactionTypeContext";
import { databaseService } from "../services/database";

const Probe: React.FC<{ id: string }> = ({ id }) => {
  const { getNameById, loading } = useTransactionTypes();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="name">{getNameById(id)}</span>
    </div>
  );
};

describe("TransactionTypeContext (ADR-0001 regression guard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the raw typeId when types have not loaded yet", async () => {
    // Hang the request so the context stays in loading state.
    vi.mocked(databaseService.transactionTypes.getTransactionTypes).mockReturnValue(
      new Promise(() => {})
    );

    render(
      <TransactionTypeProvider>
        <Probe id="payment" />
      </TransactionTypeProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("name").textContent).toBe("payment");
  });

  it("returns the Vietnamese name once types resolve", async () => {
    vi.mocked(databaseService.transactionTypes.getTransactionTypes).mockResolvedValue({
      data: [
        {
          id: "payment",
          name: "Điều chỉnh giảm",
          color: "red",
          isActive: true,
          math_factor: -1,
          impact_type: "decrease",
          company_id: null,
        },
        {
          id: "charge",
          name: "Điều chỉnh tăng",
          color: "green",
          isActive: true,
          math_factor: 1,
          impact_type: "increase",
          company_id: null,
        },
      ],
      error: null,
    });

    render(
      <TransactionTypeProvider>
        <Probe id="charge" />
      </TransactionTypeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("name").textContent).toBe("Điều chỉnh tăng");
  });

  it("deduplicates duplicate names preferring company-scoped UUID rows", async () => {
    vi.mocked(databaseService.transactionTypes.getTransactionTypes).mockResolvedValue({
      data: [
        {
          id: "payment",
          name: "Điều chỉnh giảm",
          color: "red",
          isActive: true,
          math_factor: -1,
          impact_type: "decrease",
          company_id: null,
        },
        {
          id: "uuid-tenant-payment",
          name: "Điều chỉnh giảm",
          color: "red",
          isActive: true,
          math_factor: -1,
          impact_type: "decrease",
          company_id: "tenant-1",
        },
      ],
      error: null,
    });

    const Counter: React.FC = () => {
      const { typesForDropdown } = useTransactionTypes();
      return <span data-testid="count">{typesForDropdown.length}</span>;
    };

    render(
      <TransactionTypeProvider>
        <Counter />
      </TransactionTypeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
  });
});

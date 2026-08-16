import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("../services/database", () => ({
  databaseService: {
    transactionTypes: {
      getTransactionTypes: vi.fn(),
    },
  },
}));

vi.mock("@superapp/iam", () => ({
  useAuthContext: () => ({ isAuthenticated: true, isTrial: false, user: { id: "u", company_id: "c" } }),
  useCompany: () => ({ selectedCompany: undefined }),
}));

import { TransactionTypeProvider, useTransactionTypes } from "../contexts/TransactionTypeContext";
import { databaseService } from "../services/database";

const Probe: React.FC<{ id: string }> = ({ id }) => {
  const { getMathFactor, loading } = useTransactionTypes();
  return <div><span data-testid="loading">{String(loading)}</span><span data-testid="factor">{getMathFactor(id)}</span></div>;
};

describe("getMathFactor regression", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns correct factors for company 2222 canonical ids", async () => {
    vi.mocked(databaseService.transactionTypes.getTransactionTypes).mockResolvedValue({
      data: [
        { id: "5859179e-3472-4998-abda-a94bacdc50d2", name: "Điều chỉnh giảm", color: "green", isActive: true, math_factor: -1, impact_type: "decrease", company_id: "22222222-2222-2222-2222-222222222222" },
        { id: "b9c3bff6-5e99-4221-9c30-edfc02618671", name: "Điều chỉnh tăng", color: "red", isActive: true, math_factor: 1, impact_type: "increase", company_id: "22222222-2222-2222-2222-222222222222" },
        { id: "083a4ff9-04fc-4bec-a55e-d797bbd2963c", name: "Điều chỉnh", color: "blue", isActive: true, math_factor: 1, impact_type: "increase", company_id: "22222222-2222-2222-2222-222222222222" },
        { id: "3efc6ae7-b42f-4dc8-be94-70df75801d9e", name: "Hoàn tiền", color: "green", isActive: true, math_factor: 1, impact_type: "increase", company_id: "22222222-2222-2222-2222-222222222222" },
        { id: "3e672c35-a4d3-4f1f-907c-6911373c4331", name: "Đặt cọc", color: "purple", isActive: true, math_factor: -1, impact_type: "decrease", company_id: "22222222-2222-2222-2222-222222222222" },
        { id: "payment", name: "Điều chỉnh giảm", color: "green", isActive: true, math_factor: -1, impact_type: "decrease", company_id: null },
        { id: "charge", name: "Điều chỉnh tăng", color: "red", isActive: true, math_factor: 1, impact_type: "increase", company_id: null },
        { id: "refund", name: "Hoàn tiền", color: "green", isActive: true, math_factor: 1, impact_type: "increase", company_id: null },
        { id: "deposit", name: "Đặt cọc", color: "purple", isActive: true, math_factor: -1, impact_type: "decrease", company_id: null },
      ],
      error: null,
    });

    const { rerender } = render(<TransactionTypeProvider><Probe id="charge" /></TransactionTypeProvider>);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("factor").textContent).toBe("1");

    rerender(<TransactionTypeProvider><Probe id="payment" /></TransactionTypeProvider>);
    await waitFor(() => expect(screen.getByTestId("factor").textContent).toBe("-1"));
  });
});

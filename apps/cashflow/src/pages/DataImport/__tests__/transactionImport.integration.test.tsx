import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import TransactionImport from "../TransactionImport";
import { databaseService } from "../../../services/database";

vi.mock("../../../../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", branch_id: "branch-1" },
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock("../../../components/Import/EditableTable", () => ({
  default: ({ onDataChange }: { onDataChange: (data: any[]) => void }) => (
    <textarea
      placeholder="paste your data here"
      onChange={(event) => {
        const value = event.target.value || "";
        const [customer_name, bank_account, transaction_type, amount, transaction_date] =
          value.split("\t");
        onDataChange([
          {
            customer_name: customer_name || "",
            bank_account: bank_account || "",
            transaction_type: transaction_type || "",
            amount: amount || "",
            transaction_date: transaction_date || "",
          },
        ]);
      }}
    />
  ),
}));

const mockBulkImportTransactions = vi.fn().mockResolvedValue({
  data: [{ id: "txn-1" }],
  errors: [],
});

databaseService.transactions = {
  getTransactions: vi.fn(),
  getTransactionById: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  bulkImportTransactions: mockBulkImportTransactions,
};

describe("TransactionImport Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow user to paste, validate, and import transaction data", async () => {
    render(<TransactionImport onImportComplete={vi.fn()} />);

    // Simulate pasting data
    const textarea = screen.getByPlaceholderText(/paste your data here/i);
    fireEvent.change(textarea, {
      target: {
        value: "John Doe\t123456\tpayment\t1000\t2024-06-01",
      },
    });

    // Validate data
    const validateBtn = screen.getByRole("button", { name: /import.validateData/i });
    fireEvent.click(validateBtn);

    // Show preview and import
    await waitFor(() => {
      expect(screen.getByText(/import.dataPreview/i)).toBeInTheDocument();
    });

    const importBtn = screen.getByRole("button", { name: /import.importData/i });
    fireEvent.click(importBtn);

    // Wait for import to complete
    await waitFor(() => {
      expect(mockBulkImportTransactions).toHaveBeenCalledWith(
        expect.any(Array),
        "branch-1",
        "user-1",
      );
    });
  });

  it("should show validation errors for invalid data", async () => {
    render(<TransactionImport onImportComplete={vi.fn()} />);

    // Simulate pasting invalid data (missing required fields)
    const textarea = screen.getByPlaceholderText(/paste your data here/i);
    fireEvent.change(textarea, {
      target: {
        value: "John Doe\t\t\t\t",
      },
    });

    // Validate data
    const validateBtn = screen.getByRole("button", { name: /import.validateData/i });
    fireEvent.click(validateBtn);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/import.validationErrors/i)).toBeInTheDocument();
    });
  });
});

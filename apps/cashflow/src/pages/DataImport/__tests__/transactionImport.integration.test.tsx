import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import TransactionImport from "../TransactionImport";
import { databaseService } from "../../../services/database";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("@superapp/iam", () => ({
  useAuthContext: () => ({
    user: { id: "user-1", branch_id: "branch-1", role: "admin_company", company_id: "company-1" },
  }),
  useCompany: () => ({
    selectedCompany: null,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock("../../../contexts/TransactionTypeContext", () => ({
  useTransactionTypes: () => ({
    types: [],
    typesForDropdown: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    getNameById: vi.fn(),
    getMathFactor: vi.fn(),
  }),
}));

// Mock EditableTable — just render a simple div
vi.mock("../../../components/Import/EditableTable", () => ({
  default: () => <div data-testid="editable-table">EditableTable Mock</div>,
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

  it("renders the import form with key elements", () => {
    render(<TransactionImport onImportComplete={vi.fn()} />);

    // Verify the component renders key elements
    expect(screen.getByText("import.importData")).toBeInTheDocument();
    expect(screen.getByTestId("editable-table")).toBeInTheDocument();
  });

  it("has a clickable import button", () => {
    render(<TransactionImport onImportComplete={vi.fn()} />);

    const importBtn = screen.getByRole("button", { name: /import.importData/i });
    expect(importBtn).toBeInTheDocument();
    expect(importBtn).not.toBeDisabled();

    // Click should not throw
    fireEvent.click(importBtn);
  });
});
